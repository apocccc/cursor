import { Resend } from "resend";
import crypto from "node:crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

// HMAC secret — falls back to RESEND_API_KEY so there's always *something*,
// but a dedicated OTP_SECRET env var is recommended for production.
const SECRET = process.env.OTP_SECRET || process.env.RESEND_API_KEY;
const CODE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function generateCode() {
  return crypto.randomInt(100000, 999999).toString();
}

function sign(email, code, expiresAt) {
  return crypto
    .createHmac("sha256", SECRET)
    .update(`${email}:${code}:${expiresAt}`)
    .digest("hex");
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email } = req.body || {};
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "有効なメールアドレスを入力してください" });
  }

  const code = generateCode();
  const expiresAt = Date.now() + CODE_TTL_MS;
  const hash = sign(email.toLowerCase(), code, expiresAt);

  try {
    await resend.emails.send({
      from: "ApocWire <noreply@apocwire.com>",
      to: email,
      subject: `[ApocWire] 認証コード: ${code}`,
      html: `
        <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
          <div style="margin-bottom:24px;">
            <span style="background:#e8380d;color:#fff;font-size:11px;font-weight:700;padding:3px 7px;">AW</span>
            <span style="font-size:15px;font-weight:700;margin-left:6px;">ApocWire</span>
          </div>
          <p style="font-size:14px;color:#222;margin-bottom:8px;">ログイン認証コード</p>
          <div style="background:#f5f5f3;border:1px solid #e0e0e0;padding:20px;text-align:center;margin-bottom:16px;">
            <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#222;">${code}</span>
          </div>
          <p style="font-size:12px;color:#999;">このコードは5分間有効です。心当たりのない場合は無視してください。</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Resend error:", err);
    return res.status(500).json({ error: "メール送信に失敗しました" });
  }

  return res.status(200).json({ hash, expiresAt });
}
