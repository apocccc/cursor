import { supabase } from "./supabase.js";

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  if (!token) {
    return res.status(401).json({ error: "認証トークンがありません" });
  }

  // Look up session
  const { data: session, error: sessionErr } = await supabase
    .from("sessions")
    .select("user_id, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (sessionErr || !session) {
    return res.status(401).json({ error: "無効なセッションです" });
  }

  if (new Date(session.expires_at) < new Date()) {
    // Clean up expired session
    supabase.from("sessions").delete().eq("token", token).then(() => {});
    return res.status(401).json({ error: "セッションの有効期限が切れています。再度ログインしてください。" });
  }

  // Fetch user
  const { data: user, error: userErr } = await supabase
    .from("users")
    .select("id, email, name, belong_company, is_admin, email_verified")
    .eq("id", session.user_id)
    .maybeSingle();

  if (userErr || !user) {
    return res.status(401).json({ error: "ユーザーが見つかりません" });
  }

  return res.status(200).json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      company: user.belong_company,
      role: user.is_admin === "yes" ? "admin" : "user",
    },
  });
}
