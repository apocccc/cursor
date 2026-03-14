import bcrypt from "bcryptjs";
import { supabase } from "./supabase.js";

const SEED_USERS = [
  { email: "client@apoc.co.jp", password: "client123", name: "鈴木 一郎", company: "トヨタ自動車株式会社", role: "client" },
  { email: "translator@apoc.co.jp", password: "trans123", name: "田中 美咲", company: "", role: "translator" },
  { email: "admin@apoc.co.jp", password: "admin123", name: "山田 太郎", company: "株式会社APOC", role: "admin" },
];

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const results = [];

  for (const u of SEED_USERS) {
    try {
      const passwordHash = await bcrypt.hash(u.password, 10);

      // Delete existing user first (clean slate)
      await supabase.from("sessions").delete().in(
        "user_id",
        (await supabase.from("users").select("id").eq("email", u.email)).data?.map(r => r.id) || []
      );
      await supabase.from("users").delete().eq("email", u.email);

      // Insert fresh
      const { data, error } = await supabase.from("users").insert({
        email: u.email,
        password_hash: passwordHash,
        name: u.name,
        company: u.company,
        role: u.role,
        email_verified: true,
      }).select("id, email, role").single();

      if (error) {
        results.push({ email: u.email, status: "error", error: error.message });
      } else {
        results.push({ email: u.email, status: "created", role: data.role, id: data.id });
      }
    } catch (err) {
      results.push({ email: u.email, status: "exception", error: err.message });
    }
  }

  return res.status(200).json({ ok: true, results });
}
