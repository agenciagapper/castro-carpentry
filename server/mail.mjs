// Envio de e-mail por SMTP (o e-mail da própria Hostinger serve). Sem SMTP_HOST, o painel mostra os links para copiar.
import nodemailer from 'nodemailer';

const { SMTP_HOST, SMTP_PORT = '465', SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env;

export const mailEnabled = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

const transport = mailEnabled && nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT),
  secure: Number(SMTP_PORT) === 465,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

export async function sendMail({ to, subject, text, replyTo }) {
  if (!mailEnabled) return false;
  await transport.sendMail({ from: MAIL_FROM || `Castro website <${SMTP_USER}>`, to, subject, text, ...(replyTo && { replyTo }) });
  return true;
}
