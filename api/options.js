import { supabase } from "./supabase.js";

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();

  // GET — list all active options (public) or all options (admin)
  if (req.method === "GET") {
    const all = req.query.all === "true";
    let query = supabase.from("options").select("*").order("created_at", { ascending: true });
    if (!all) query = query.eq("is_active", true);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ options: data });
  }

  // POST — create option (admin)
  if (req.method === "POST") {
    const { name, description, price, price_rule } = req.body || {};
    if (!name) return res.status(400).json({ error: "名前は必須です" });
    const { data, error } = await supabase
      .from("options")
      .insert({ name, description: description || "", price: price || 0, price_rule: price_rule || "per_country" })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ option: data });
  }

  // PUT — update option (admin)
  if (req.method === "PUT") {
    const { id, ...updates } = req.body || {};
    if (!id) return res.status(400).json({ error: "IDは必須です" });
    const { data, error } = await supabase.from("options").update(updates).eq("id", id).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ option: data });
  }

  // DELETE — soft delete (set is_active = false)
  if (req.method === "DELETE") {
    const id = req.query.id || (req.body && req.body.id);
    if (!id) return res.status(400).json({ error: "IDは必須です" });
    const { error } = await supabase.from("options").update({ is_active: false }).eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
