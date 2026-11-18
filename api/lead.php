<?php
/**
 * Estimate form endpoint for castrocarpentryinc.com (runs on Hostinger PHP).
 *
 * GET  /api/lead.php        -> {"token": "..."}  signed, short-lived form token
 * POST /api/lead.php        -> validates and forwards the lead
 *
 * Layers (cheapest first): honeypots, signed time token (min fill time, max age,
 * single use), proof-of-work, per-IP rate limit, strict field validation (US
 * phone, MA ZIP), spam content filters, foreign-traffic signals (country header,
 * browser time zone, language). Obvious bots get a fake success ("shadow drop")
 * so they never learn what tripped them. Borderline leads go to a quarantine
 * file instead of being lost.
 *
 * Config lives OUTSIDE public_html in ~/castro-config.json:
 *   {
 *     "webhook": "https://...",                  // where accepted leads are POSTed (JSON)
 *     "notify_email": "ecastrocarpentry@gmail.com" // used when no webhook is set (or as a copy)
 *   }
 * A random "secret" is created there automatically on first run.
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');

const MIN_SECONDS = 4;          // faster than this is a bot
const MAX_SECONDS = 7200;       // token valid for 2 hours
const POW_PREFIX = '000';       // proof-of-work difficulty (hex zeros)
const RATE_HOUR = 3;
const RATE_DAY = 6;
const ALLOWED_COUNTRIES = ['US', 'CA'];
const SERVICES = ['Trim & finish carpentry', 'Siding', 'Decks', 'Windows & doors', 'Roofing repairs', 'ADU / garage conversion', 'Other / not sure'];

$home = getenv('HOME') ?: dirname(__DIR__, 3);
$dataDir = $home . '/castro-data';
$cfgFile = $home . '/castro-config.json';
if (!is_dir($dataDir)) @mkdir($dataDir, 0700, true);

$cfg = json_decode((string) @file_get_contents($cfgFile), true) ?: [];
if (empty($cfg['secret'])) {
    $cfg['secret'] = bin2hex(random_bytes(32));
    @file_put_contents($cfgFile, json_encode($cfg, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), LOCK_EX);
    @chmod($cfgFile, 0600);
}
$secret = $cfg['secret'];

function out($code, $data) { http_response_code($code); echo json_encode($data); exit; }
function client_ip() { return $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0'; }
function log_line($dir, $file, $row) {
    $row['at'] = date('c');
    @file_put_contents("$dir/$file", json_encode($row, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n", FILE_APPEND | LOCK_EX);
}

// --- GET: issue a token -------------------------------------------------------
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $payload = time() . '.' . bin2hex(random_bytes(8));
    out(200, ['token' => $payload . '.' . hash_hmac('sha256', $payload, $secret)]);
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(405, ['success' => false]);

$f = array_map(fn($v) => is_string($v) ? trim($v) : '', $_POST);
$g = fn($k) => $f[$k] ?? '';
$ip = client_ip();
$ipKey = hash('sha256', $ip . $secret);

// Fake success: the bot thinks it worked, nothing is forwarded.
function shadow($reason, $dir, $quarantine = null) {
    log_line($dir, 'rejected.log', ['reason' => $reason]);
    if ($quarantine) log_line($dir, 'quarantine.log', ['reason' => $reason, 'lead' => $quarantine]);
    out(200, ['success' => true]);
}

// 1. Honeypots: invisible fields a person never fills in.
foreach (['website', 'company', 'fax', 'botcheck'] as $hp) {
    if ($g($hp) !== '') shadow("honeypot:$hp", $dataDir);
}

// 2. Signed token: proves the page was loaded and JS ran; enforces fill time.
$parts = explode('.', $g('form_token'));
if (count($parts) !== 3 || !hash_equals(hash_hmac('sha256', $parts[0] . '.' . $parts[1], $secret), $parts[2])) {
    shadow('token:invalid', $dataDir);
}
$age = time() - (int) $parts[0];
if ($age < MIN_SECONDS) shadow('token:too-fast', $dataDir);
if ($age > MAX_SECONDS) out(400, ['success' => false, 'message' => 'This form expired. Please refresh the page and try again.']);
$used = "$dataDir/used-" . substr(hash('sha256', $g('form_token')), 0, 32);
if (is_file($used)) shadow('token:replay', $dataDir);

// 3. Proof-of-work computed in the browser.
if (strpos(hash('sha256', $g('form_token') . ':' . $g('pow')), POW_PREFIX) !== 0) shadow('pow', $dataDir);

// 4. Rate limit per IP (stored as a hash, no raw IPs on disk).
$rateFile = "$dataDir/rate-" . substr($ipKey, 0, 32);
$hits = array_filter(array_map('intval', file_exists($rateFile) ? file($rateFile, FILE_IGNORE_NEW_LINES) : []), fn($t) => $t > time() - 86400);
$lastHour = count(array_filter($hits, fn($t) => $t > time() - 3600));
if ($lastHour >= RATE_HOUR || count($hits) >= RATE_DAY) {
    log_line($dataDir, 'rejected.log', ['reason' => 'rate-limit']);
    out(429, ['success' => false, 'message' => 'We already received several requests from this connection. Please call (508) 566-1618.']);
}

// 5. Field validation (real people get a clear error to fix).
$name = preg_replace('/[\r\n\t]+/', ' ', $g('name')); $email = $g('email'); $town = $g('town'); $service = $g('service'); $msg = $g('message');
$digits = preg_replace('/\D/', '', $g('phone'));
if (strlen($digits) === 11 && $digits[0] === '1') $digits = substr($digits, 1);
$errors = [];
if (mb_strlen($name) < 2 || mb_strlen($name) > 80) $errors[] = 'name';
if (!preg_match('/^[2-9]\d{2}[2-9]\d{6}$/', $digits)) $errors[] = 'phone';
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 120) $errors[] = 'email';
if (mb_strlen($town) < 2 || mb_strlen($town) > 60) $errors[] = 'town';
if (!in_array($service, SERVICES, true)) $errors[] = 'service';
if (mb_strlen($msg) > 2000) $errors[] = 'message';
if ($errors) out(422, ['success' => false, 'fields' => $errors, 'message' => 'Please check the highlighted fields. We need a 10-digit US phone number.']);

$lead = [
    'lead_type' => 'estimate', 'name' => $name, 'phone' => $digits, 'email' => $email, 'town' => $town,
    'service' => $service, 'timeframe' => mb_substr($g('timeframe'), 0, 40), 'message' => $msg,
];
foreach (['page_url', 'landing_page', 'referrer', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'] as $k) {
    $lead[$k] = mb_substr($g($k), 0, 300);
}

// 6. Content filters: scripts, links and pitches that real homeowners don't send.
$all = "$name $email $town $msg";
if (preg_match('/[\p{Cyrillic}\p{Han}\p{Arabic}\p{Hangul}\p{Thai}\p{Hebrew}\p{Devanagari}\p{Hiragana}\p{Katakana}]/u', $all)) shadow('content:script', $dataDir, $lead);
if (preg_match_all('#(https?://|www\.|\.(ru|cn|top|xyz|click|link|shop)\b)#i', $all) > 1) shadow('content:links', $dataDir, $lead);
if (preg_match('#https?://|www\.#i', $name . $town)) shadow('content:url-in-name', $dataDir, $lead);
if (preg_match('/\b(seo|backlinks?|guest post|rank(ing)? (your|on)|web ?design|website redesign|crypto|bitcoin|casino|viagra|cialis|loan offer|marketing services|lead generation|virtual assistant|outsourc)/i', $all)) {
    shadow('content:pitch', $dataDir, $lead);
}
if (preg_match('/\d{3,}/', $name)) shadow('content:digits-in-name', $dataDir, $lead);

// 7. Foreign-traffic signals.
$country = strtoupper($_SERVER['HTTP_CF_IPCOUNTRY'] ?? $_SERVER['HTTP_X_COUNTRY_CODE'] ?? $_SERVER['GEOIP_COUNTRY_CODE'] ?? '');
if ($country !== '' && $country !== 'XX' && !in_array($country, ALLOWED_COUNTRIES, true)) shadow("geo:$country", $dataDir, $lead);
$score = 0; $why = [];
$tz = $g('tz');
if ($tz === '' || strpos($tz, 'America/') !== 0) { $score++; $why[] = "tz:$tz"; }
$lang = strtolower(substr($g('lang') ?: ($_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? ''), 0, 2));
if (!in_array($lang, ['en', 'pt', 'es'], true)) { $score++; $why[] = "lang:$lang"; }
if (preg_match('/^\d{5}$/', $town) && strpos($town, '02') !== 0) { $score++; $why[] = 'zip-out-of-area'; }
if (empty($_SERVER['HTTP_USER_AGENT']) || preg_match('/curl|python|wget|httpclient|java\/|go-http|headless/i', $_SERVER['HTTP_USER_AGENT'])) { $score += 2; $why[] = 'ua'; }
if ($score >= 2) shadow('signals:' . implode(',', $why), $dataDir, $lead);

// 8. Duplicate (same phone in 15 minutes): accept quietly, don't forward twice.
$dupFile = "$dataDir/dup-" . substr(hash('sha256', $digits . $secret), 0, 32);
if (is_file($dupFile) && filemtime($dupFile) > time() - 900) out(200, ['success' => true]);

// Accepted: mark token used, count the hit, forward.
@touch($used);
$hits[] = time();
@file_put_contents($rateFile, implode("\n", $hits), LOCK_EX);
@touch($dupFile);
$lead['spam_score'] = $score;
$lead['received_at'] = date('c');
log_line($dataDir, 'leads.log', $lead); // backup copy in case the webhook is down

$sent = false;
if (!empty($cfg['webhook'])) {
    $ctx = stream_context_create(['http' => [
        'method' => 'POST', 'timeout' => 10, 'ignore_errors' => true,
        'header' => "Content-Type: application/json\r\n",
        'content' => json_encode($lead, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    ]]);
    $res = @file_get_contents($cfg['webhook'], false, $ctx);
    $sent = $res !== false;
    if (!$sent) log_line($dataDir, 'rejected.log', ['reason' => 'webhook-failed']);
}
if ((!$sent || !empty($cfg['email_copy'])) && !empty($cfg['notify_email'])) {
    $body = '';
    foreach ($lead as $k => $v) if ($v !== '' && $v !== null) $body .= ucfirst(str_replace('_', ' ', $k)) . ": $v\n";
    @mail($cfg['notify_email'], "New estimate request: $name ($town)", $body,
        "From: website@castrocarpentryinc.com\r\nReply-To: $email\r\nContent-Type: text/plain; charset=utf-8");
}
out(200, ['success' => true]);
