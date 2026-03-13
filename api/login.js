import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { supabase } from "./supabase.js";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "メールアドレスとパスワードを入力してください" });
  }

  const emailLower = email.toLowerCase().trim();

  // Look up user
  const { data: user, error: fetchErr } = await supabase
    .from("users")
    .select("id, email, password_hash, name, company, role, email_verified")
    .eq("email", emailLower)
    .single();

  if (fetchErr || !user) {
    return res.status(401).json({ error: "メールアドレスまたはパスワードが正しくありません" });
  }

  // Verify password
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: "メールアドレスまたはパスワードが正しくありません" });
  }

  if (!user.email_verified) {
    return res.status(403).json({ error: "メールアドレスが未認証です。確認メール内のリンクをクリックしてください。" });
  }

  // Create session
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  const { error: sessionErr } = await supabase.from("sessions").insert({
    user_id: user.id,
    token,
    expires_at: expiresAt,
  });

  if (sessionErr) {
    console.error("Session insert error:", sessionErr);
    return res.status(500).json({ error: "セッションの作成に失敗しました" });
  }

  // Clean up expired sessions for this user (fire-and-forget)
  supabase
    .from("sessions")
    .delete()
    .eq("user_id", user.id)
    .lt("expires_at", new Date().toISOString())
    .then(() => {});

  return res.status(200).json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      company: user.company,
      role: user.role,
    },
  });
}
