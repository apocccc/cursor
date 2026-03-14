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
    // Check if already exists
    const { data: existing } = await supabase
      .from("users")
      .select("id, email, role")
      .eq("email", u.email)
      .single();

    if (existing) {
      // Update role and verify
      await supabase
        .from("users")
        .update({ role: u.role, email_verified: true, name: u.name, company: u.company })
        .eq("id", existing.id);
      results.push({ email: u.email, status: "updated", role: u.role });
      continue;
    }

    const passwordHash = await bcrypt.hash(u.password, 10);
    const { error } = await supabase.from("users").insert({
      email: u.email,
      password_hash: passwordHash,
      name: u.name,
      company: u.company,
      role: u.role,
      email_verified: true,
    });

    if (error) {
      results.push({ email: u.email, status: "error", error: error.message });
    } else {
      results.push({ email: u.email, status: "created", role: u.role });
    }
  }

  return res.status(200).json({ ok: true, results });
}
