
import nodemailer from "nodemailer";
import { CODE_TTL_MINUTES } from "../utils/twoFactor.js";

let transporter = null;

// Created on first use so the env vars are read after they are loaded.
function getTransporter() {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT) || 587;

    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }

  return transporter;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layout(title, bodyHtml) {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0f172a">
    <h2 style="margin:0 0 16px;color:#2563eb">LifeVault</h2>
    <h3 style="margin:0 0 12px">${title}</h3>
    ${bodyHtml}
    <p style="margin-top:24px;font-size:12px;color:#64748b">
      If you did not request this, you can ignore this email or change your password.
    </p>
  </div>`;
}

export async function sendEmail({ to, subject, text, html }) {
  await getTransporter().sendMail({
    from: process.env.FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html
  });
}

const CODE_SUBJECTS = {
  login: "Your LifeVault sign-in code",
  enable: "Confirm two-factor authentication"
};

export async function sendTwoFactorCode(to, username, code, purpose) {
  const intro = purpose === "enable"
    ? "Use this code to turn on two-factor authentication:"
    : "Use this code to finish signing in:";

  await sendEmail({
    to,
    subject: CODE_SUBJECTS[purpose] || CODE_SUBJECTS.login,
    text: `Hello ${username},\n\n${intro} ${code}\n\nThe code expires in ${CODE_TTL_MINUTES} minutes.`,
    html: layout(
      `Hello ${escapeHtml(username)},`,
      `<p>${intro}</p>
       <p style="font-size:32px;font-weight:bold;letter-spacing:8px;margin:16px 0">${code}</p>
       <p>The code expires in ${CODE_TTL_MINUTES} minutes.</p>`
    )
  });
}

export async function sendSecurityAlert(to, username, message) {
  await sendEmail({
    to,
    subject: "LifeVault security alert",
    text: `Hello ${username},\n\n${message}`,
    html: layout(`Hello ${escapeHtml(username)},`, `<p>${escapeHtml(message)}</p>`)
  });
}
