import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { supabase } from "./supabase.js";
import { fireTrigger } from "./trigger-fire.js";

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

  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "メールアドレスとパスワードを入力してください" });
    }

    const emailLower = email.toLowerCase().trim();

    // Look up user — try new schema, fallback to old
    let { data: user, error: fetchErr } = await supabase
      .from("users")
      .select("id, email, password_hash, name, belong_company, is_admin, email_verified")
      .eq("email", emailLower)
      .single();

    // Fallback: old schema
    if (fetchErr && fetchErr.message.includes("belong_company")) {
      ({ data: user, error: fetchErr } = await supabase
        .from("users")
        .select("id, email, password_hash, name, company, role, email_verified")
        .eq("email", emailLower)
        .single());
      if (user) {
        user.belong_company = user.company;
        user.is_admin = user.role === "admin" ? "yes" : "no";
      }
    }

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

    const loginIp = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "";
    const loginBrowser = req.headers["user-agent"] || "";

    const sessionRow = { user_id: user.id, token, expires_at: expiresAt };
    // ip_address/user_agentカラムが存在する場合のみ保存
    let { error: sessionErr } = await supabase.from("sessions").insert({
      ...sessionRow, ip_address: loginIp, user_agent: loginBrowser,
    });
    // カラム未追加の場合はフォールバック
    if (sessionErr) {
      ({ error: sessionErr } = await supabase.from("sessions").insert(sessionRow));
    }

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

    // ログイン通知トリガー (fire-and-forget)
    fireTrigger("login", {
      company_name_jp: user.belong_company || "",
      representer_name: user.name || "",
      login_ip: loginIp,
      login_browser: loginBrowser,
      login_datetime: new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }),
    }, user.email).catch(() => {});

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        company: user.belong_company,
        role: user.is_admin === "yes" ? "admin" : "client",
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
}
