// slugはapocwire.comに配信された記事URLの識別子です
// 例：https://apocwire.com/press/cyberagent_us20260316 → slug: cyberagent_us20260316
// adminが配信完了後に手動で設定し、GA4データの取得に使用します

import { supabase } from "./supabase.js";

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

async function getUser(req) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;
  const { data: session } = await supabase
    .from("sessions")
    .select("user_id, expires_at")
    .eq("token", token)
    .maybeSingle();
  if (!session || new Date(session.expires_at) < new Date()) return null;
  const { data: user } = await supabase
    .from("users")
    .select("id, email, name, belong_company, is_admin")
    .eq("id", session.user_id)
    .maybeSingle();
  return user;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "認証が必要です" });
  if (user.is_admin !== "yes") return res.status(403).json({ error: "admin権限が必要です" });

  const { id, title, slug } = req.body || {};
  if (!id && !title) return res.status(400).json({ error: "プレスリリースIDまたはタイトルが必要です" });

  // UUIDならidで検索、それ以外はtitleで検索
  const isUUID = id && /^[0-9a-f]{8}-/.test(id);
  let query = supabase.from("press_releases").update({ slug: slug || null });
  if (isUUID) {
    query = query.eq("id", id);
  } else if (title) {
    query = query.eq("title", title);
  } else {
    return res.status(400).json({ error: "有効なIDまたはタイトルが必要です" });
  }

  const { error, count } = await query;

  if (error) {
    return res.status(500).json({ error: "slugの更新に失敗しました" });
  }

  return res.json({ success: true, slug: slug || null });
}
