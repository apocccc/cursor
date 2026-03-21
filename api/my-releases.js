import { supabase } from "./supabase.js";

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return res.status(401).json({ error: "認証トークンがありません" });

  const { data: session } = await supabase
    .from("sessions")
    .select("user_id, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (!session || new Date(session.expires_at) < new Date()) {
    return res.status(401).json({ error: "無効なセッションです" });
  }

  // Fetch user to check role
  const { data: user } = await supabase
    .from("users")
    .select("id, is_admin")
    .eq("id", session.user_id)
    .maybeSingle();

  if (!user) return res.status(401).json({ error: "ユーザーが見つかりません" });

  let query = supabase
    .from("press_releases")
    .select("id, title, slug, belong_company, status, text, lead_text, creator, created_at, modified_at")
    .order("created_at", { ascending: false });

  // Admin sees all, others see only their own
  if (user.is_admin !== "yes") {
    query = query.eq("creator", session.user_id);
  }

  const { data: releases, error } = await query;

  if (error) {
    return res.status(500).json({ error: "プレスリリースの取得に失敗しました", detail: error.message });
  }

  return res.status(200).json({ releases: releases || [], role: user.is_admin === "yes" ? "admin" : "user" });
}
