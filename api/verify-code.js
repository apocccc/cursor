import crypto from "node:crypto";
import { supabase } from "./supabase.js";

const SECRET = process.env.OTP_SECRET || process.env.RESEND_API_KEY;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function sign(email, code, expiresAt) {
  return crypto
    .createHmac("sha256", SECRET)
    .update(`${email}:${code}:${expiresAt}`)
    .digest("hex");
}

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

export default async function handler(req, res) {
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

  const emailLower = email.toLowerCase().trim();
  const expected = sign(emailLower, code, expiresAt);

  let valid = false;
  try {
    valid = crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(hash, "hex")
    );
  } catch {
    valid = false;
  }

  if (!valid) {
    return res.status(400).json({ error: "認証コードが正しくありません" });
  }

  // Look up or create user in Supabase
  let { data: user } = await supabase
    .from("users")
    .select("id, email, name, belong_company, is_admin, email_verified")
    .eq("email", emailLower)
    .single();

  if (!user) {
    // Auto-create user for OTP login (no password)
    const { data: newUser, error: insertErr } = await supabase
      .from("users")
      .insert({
        id: crypto.randomUUID(),
        email: emailLower,
        password_hash: "",
        name: emailLower.split("@")[0],
        is_admin: "no",
        email_verified: true,
      })
      .select("id, email, name, belong_company, is_admin")
      .single();

    if (insertErr) {
      console.error("Supabase insert error:", insertErr);
      return res.status(500).json({ error: "ユーザー作成に失敗しました" });
    }
    user = newUser;
  } else if (!user.email_verified) {
    // OTP login verifies the email
    await supabase.from("users").update({ email_verified: true }).eq("id", user.id);
  }

  // Create session
  const token = generateToken();
  const sessionExpires = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  const { error: sessionErr } = await supabase.from("sessions").insert({
    user_id: user.id,
    token,
    expires_at: sessionExpires,
  });

  if (sessionErr) {
    console.error("Session insert error:", sessionErr);
    return res.status(500).json({ error: "セッションの作成に失敗しました" });
  }

  return res.status(200).json({
    ok: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      company: user.belong_company || "",
      role: user.is_admin === "yes" ? "admin" : "client",
    },
  });
}
