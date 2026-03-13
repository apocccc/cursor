import { Resend } from "resend";
import crypto from "node:crypto";

const resend = new Resend(process.env.RESEND_API_KEY);
const SECRET = process.env.OTP_SECRET || process.env.RESEND_API_KEY;
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function signToken(email, expiresAt) {
  return crypto
    .createHmac("sha256", SECRET)
    .update(`register:${email}:${expiresAt}`)
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

  const { email, name, company } = req.body || {};

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "有効なメールアドレスを入力してください" });
  }

  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const token = signToken(email.toLowerCase(), expiresAt);

  // Build verification URL — works on Vercel preview & production
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost:3000";
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const verifyUrl = `${protocol}://${host}/api/verify-email?email=${encodeURIComponent(email)}&token=${token}&expires=${expiresAt}`;

  try {
    await resend.emails.send({
      from: "ApocWire <onboarding@resend.dev>",
      to: email,
      subject: "[ApocWire] メールアドレスの確認",
      html: `
        <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
          <div style="margin-bottom:24px;">
            <span style="background:#e8380d;color:#fff;font-size:11px;font-weight:700;padding:3px 7px;">AW</span>
            <span style="font-size:15px;font-weight:700;margin-left:6px;">ApocWire</span>
          </div>
          <p style="font-size:14px;color:#222;margin-bottom:4px;">会員登録ありがとうございます</p>
          <p style="font-size:13px;color:#666;margin-bottom:20px;">以下のボタンをクリックしてメールアドレスを確認してください。</p>
          ${name ? `<p style="font-size:12px;color:#999;margin-bottom:16px;">登録名: ${name}${company ? ` / ${company}` : ""}</p>` : ""}
          <a href="${verifyUrl}" style="display:inline-block;background:#222;color:#fff;font-size:13px;font-weight:600;padding:12px 28px;text-decoration:none;">メールアドレスを確認する</a>
          <p style="font-size:11px;color:#999;margin-top:20px;">ボタンが機能しない場合は、以下のURLをブラウザに貼り付けてください:</p>
          <p style="font-size:11px;color:#999;word-break:break-all;">${verifyUrl}</p>
          <p style="font-size:11px;color:#ccc;margin-top:24px;">このリンクは24時間有効です。心当たりのない場合は無視してください。</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Resend error:", err);
    return res.status(500).json({ error: "確認メールの送信に失敗しました" });
  }

  return res.status(200).json({ ok: true });
}
