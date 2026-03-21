import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// 共通認証ヘルパー（新旧スキーマ両対応）
export async function getSessionUser(req) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return null;
  const { data: session } = await supabase
    .from("sessions")
    .select("user_id, expires_at")
    .eq("token", token)
    .maybeSingle();
  if (!session || new Date(session.expires_at) < new Date()) return null;

  // Try new schema
  let { data: user } = await supabase
    .from("users")
    .select("id, email, name, belong_company, is_admin")
    .eq("id", session.user_id)
    .maybeSingle();

  if (!user) {
    // Fallback: old schema
    ({ data: user } = await supabase
      .from("users")
      .select("id, email, name, company, role")
      .eq("id", session.user_id)
      .maybeSingle());
    if (user) {
      user.belong_company = user.company;
      user.is_admin = user.role === "admin" ? "yes" : "no";
    }
  }
  return user;
}
