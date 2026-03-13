import crypto from "node:crypto";

const SECRET = process.env.OTP_SECRET || process.env.RESEND_API_KEY;

function sign(email, code, expiresAt) {
  return crypto
    .createHmac("sha256", SECRET)
    .update(`${email}:${code}:${expiresAt}`)
    .digest("hex");
}

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, code, hash, expiresAt } = req.body || {};

  if (!email || !code || !hash || !expiresAt) {
    return res.status(400).json({ error: "パラメータが不足しています" });
  }

  if (Date.now() > expiresAt) {
    return res.status(400).json({ error: "コードの有効期限が切れています。再送信してください。" });
  }

  const expected = sign(email.toLowerCase(), code, expiresAt);
  const valid = crypto.timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(hash, "hex")
  );

  if (!valid) {
    return res.status(400).json({ error: "認証コードが正しくありません" });
  }

  return res.status(200).json({ ok: true });
}
