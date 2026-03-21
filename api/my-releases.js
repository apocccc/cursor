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

  // Fetch user to check role (new schema: is_admin, fallback: role)
  let { data: user } = await supabase
    .from("users")
    .select("id, is_admin")
    .eq("id", session.user_id)
    .maybeSingle();

  let isAdmin = false;
  if (!user) {
    // Fallback: old schema
    ({ data: user } = await supabase
      .from("users")
      .select("id, role")
      .eq("id", session.user_id)
      .maybeSingle());
    if (!user) return res.status(401).json({ error: "ユーザーが見つかりません" });
    isAdmin = user.role === "admin";
  } else {
    isAdmin = user.is_admin === "yes";
  }

  // Try new schema columns first, fallback to old
  let { data: releases, error } = await supabase
    .from("press_releases")
    .select("id, title, slug, belong_company, status, text, lead_text, creator, created_at, modified_at")
    .order("created_at", { ascending: false });

  if (error && (error.message.includes("belong_company") || error.message.includes("creator"))) {
    // Fallback: old schema columns
    ({ data: releases, error } = await supabase
      .from("press_releases")
      .select("id, title, slug, company, status, content, user_id, published_at, ga_page_views, ga_sessions, ga_last_synced_at")
      .order("published_at", { ascending: false }));

    // TODO: データ移行完了後にユーザーフィルターを有効化
    // if (!isAdmin && releases) {
    //   releases = releases.filter(r => r.user_id === session.user_id);
    // }
  } else {
    // TODO: データ移行完了後にユーザーフィルターを有効化
    // if (!isAdmin && releases) {
    //   releases = releases.filter(r => r.creator === session.user_id);
    // }
  }

  if (error) {
    return res.status(500).json({ error: "プレスリリースの取得に失敗しました", detail: error.message });
  }

  return res.status(200).json({ releases: releases || [], role: isAdmin ? "admin" : "client" });
}
