<?php
/**
 * Instagram feed sync for castrocarpentryinc.com
 *
 * Pulls the latest posts from the Instagram API (Instagram Login, Business or
 * Creator account), saves the images under /instagram/ and writes
 * /instagram/feed.json, which the homepage reads. The token lives OUTSIDE
 * public_html and is refreshed automatically before it expires (60 days).
 *
 * Run it from a Hostinger cron job (hPanel > Advanced > Cron Jobs), e.g. hourly:
 *   php /home/USER/domains/castrocarpentryinc.com/public_html/_build/instagram-sync.php
 *
 * One-time setup: create ~/instagram-config.json (chmod 600) with
 *   {"token": "LONG_LIVED_INSTAGRAM_TOKEN"}
 *
 * This file is in _build/, which .htaccess blocks from the web. CLI only.
 */
if (PHP_SAPI !== 'cli') { http_response_code(403); exit; }

const API = 'https://graph.instagram.com';
const LIMIT = 8;

$home = getenv('HOME') ?: dirname(__DIR__, 3);
$cfgFile = $home . '/instagram-config.json';
$outDir = dirname(__DIR__) . '/instagram';

function fail($msg) { fwrite(STDERR, '[instagram-sync] ' . $msg . "\n"); exit(1); }

function get_json($url) {
    $ctx = stream_context_create(['http' => ['timeout' => 20, 'ignore_errors' => true]]);
    $body = @file_get_contents($url, false, $ctx);
    if ($body === false) return null;
    return json_decode($body, true);
}

$cfg = json_decode((string) @file_get_contents($cfgFile), true);
if (!$cfg || empty($cfg['token'])) fail("Missing token in $cfgFile");

// Refresh the long-lived token weekly (it expires after 60 days without a refresh).
if (empty($cfg['refreshed']) || time() - (int) $cfg['refreshed'] > 7 * 86400) {
    $r = get_json(API . '/refresh_access_token?grant_type=ig_refresh_token&access_token=' . urlencode($cfg['token']));
    if (!empty($r['access_token'])) {
        $cfg['token'] = $r['access_token'];
        $cfg['refreshed'] = time();
        file_put_contents($cfgFile, json_encode($cfg), LOCK_EX);
        @chmod($cfgFile, 0600);
    } else {
        fwrite(STDERR, "[instagram-sync] Token refresh failed: " . json_encode($r) . "\n");
    }
}

$fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';
$r = get_json(API . '/me/media?fields=' . $fields . '&limit=' . LIMIT . '&access_token=' . urlencode($cfg['token']));
if (empty($r['data'])) fail('No media returned: ' . json_encode($r));

if (!is_dir($outDir)) mkdir($outDir, 0755, true);
$items = [];
$keep = ['feed.json' => true];
foreach ($r['data'] as $m) {
    $src = ($m['media_type'] ?? '') === 'VIDEO' ? ($m['thumbnail_url'] ?? '') : ($m['media_url'] ?? '');
    if (!$src || !preg_match('/^\d+$/', $m['id'])) continue;
    $file = $m['id'] . '.jpg';
    $keep[$file] = true;
    if (!is_file("$outDir/$file")) {
        $img = @file_get_contents($src);
        if ($img === false) continue;
        file_put_contents("$outDir/$file", $img);
    }
    $caption = trim(preg_replace('/\s+/', ' ', $m['caption'] ?? ''));
    if (mb_strlen($caption) > 140) $caption = rtrim(mb_substr($caption, 0, 137)) . '...';
    $items[] = [
        'id' => $m['id'],
        'image' => "/instagram/$file",
        'permalink' => $m['permalink'] ?? '',
        'caption' => $caption,
        'type' => $m['media_type'] ?? 'IMAGE',
        'timestamp' => $m['timestamp'] ?? '',
    ];
}

// Write atomically, then remove images that are no longer in the feed.
$tmp = "$outDir/feed.json.tmp";
file_put_contents($tmp, json_encode(['updated' => date('c'), 'items' => $items], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
rename($tmp, "$outDir/feed.json");
foreach (scandir($outDir) as $f) {
    if ($f[0] !== '.' && empty($keep[$f])) @unlink("$outDir/$f");
}
echo '[instagram-sync] ' . count($items) . " posts saved\n";
