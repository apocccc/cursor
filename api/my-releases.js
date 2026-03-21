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

  const { data: releases, error } = await supabase
    .from("press_releases")
    .select("id, title, slug, ga_page_views, ga_sessions, ga_last_synced_at, published_at")
    .eq("user_id", session.user_id)
    .order("published_at", { ascending: false });

  if (error) {
    return res.status(500).json({ error: "プレスリリースの取得に失敗しました" });
  }

  return res.status(200).json({ releases: releases || [] });
}
