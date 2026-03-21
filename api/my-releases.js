import { supabase, getSessionUser } from "./supabase.js";

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const user = await getSessionUser(req);
  if (!user) return res.status(401).json({ error: "認証が必要です" });

  const isAdmin = user.is_admin === "yes";

  // select * で全カラム取得（新旧スキーマ両対応）
  let { data: releases, error } = await supabase
    .from("press_releases")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({ error: "プレスリリースの取得に失敗しました", detail: error.message });
  }

  return res.status(200).json({ releases: releases || [], role: isAdmin ? "admin" : "client" });
}
