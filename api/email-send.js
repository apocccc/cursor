import { supabase, getSessionUser } from "./supabase.js";

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const user = await getSessionUser(req);
  if (!user || user.is_admin !== "yes") return res.status(403).json({ error: "管理者権限が必要です" });

  const { to, subject, body, trigger_type } = req.body || {};
  if (!to || !subject || !body) {
    return res.status(400).json({ error: "to, subject, bodyは必須です" });
  }

  // TODO: Resend連携（後で実装）
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({ from: 'noreply@apocwire.com', to, subject, html: body });

  // 現時点ではログだけ保存
  const { error } = await supabase.from("email_logs").insert({
    trigger_type: trigger_type || null,
    recipient_email: to,
    subject,
    body,
    status: "pending",
  });

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
}
