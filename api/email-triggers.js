import { supabase } from "./supabase.js";

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

async function getAdmin(req) {
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
    .select("id, is_admin")
    .eq("id", session.user_id)
    .maybeSingle();
  if (!user || user.is_admin !== "yes") return null;
  return user;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();

  const admin = await getAdmin(req);
  if (!admin) return res.status(403).json({ error: "管理者権限が必要です" });

  // GET: 全件取得
  if (req.method === "GET") {
    const { data, error } = await supabase
      .from("email_triggers")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ triggers: data || [] });
  }

  // POST: upsert
  if (req.method === "POST") {
    const { id, name, trigger_type, is_active, recipient_type, subject, body } = req.body || {};
    if (!trigger_type || !subject || !body) {
      return res.status(400).json({ error: "trigger_type, subject, bodyは必須です" });
    }

    if (id) {
      const { error } = await supabase
        .from("email_triggers")
        .update({ name, trigger_type, is_active, recipient_type, subject, body, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) return res.status(500).json({ error: error.message });
    } else {
      const { error } = await supabase
        .from("email_triggers")
        .insert({ name: name || trigger_type, trigger_type, is_active: is_active ?? true, recipient_type: recipient_type || "self", subject, body });
      if (error) return res.status(500).json({ error: error.message });
    }

    return res.json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
