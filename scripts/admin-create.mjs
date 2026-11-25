// Cria um membro do painel pelo terminal (SSH da Hostinger ou local).
// Uso: npm run admin:criar -- email@dominio.com "Nome Completo"
import readline from 'node:readline';
import { db, logActivity } from '../server/db.mjs';
import { hashPassword, passwordProblem } from '../server/auth.mjs';

const [email, name = 'Administrador'] = process.argv.slice(2);
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Uso: npm run admin:criar -- email@dominio.com "Nome Completo"');
  process.exit(1);
}

function askHidden(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  rl._writeToOutput = (s) => { if (s.startsWith(question)) process.stdout.write(s); };
  return new Promise((resolve) => rl.question(question, (answer) => { rl.close(); process.stdout.write('\n'); resolve(answer); }));
}

const password = process.env.ADMIN_PASSWORD || await askHidden('Senha (10+ caracteres): ');
const problem = passwordProblem(password);
if (problem) { console.error(problem); process.exit(1); }

const normalized = email.trim().toLowerCase();
const existing = db.prepare('SELECT id FROM members WHERE email = ?').get(normalized);
if (existing) {
  db.prepare('UPDATE members SET password_hash = ?, active = 1 WHERE id = ?').run(hashPassword(password), existing.id);
  logActivity(null, 'senha redefinida pelo terminal', normalized);
  console.log(`Senha de ${normalized} redefinida e conta ativada.`);
} else {
  db.prepare('INSERT INTO members (name, email, password_hash) VALUES (?, ?, ?)').run(name, normalized, hashPassword(password));
  logActivity(null, 'membro criado pelo terminal', normalized);
  console.log(`Membro ${normalized} criado.`);
}
