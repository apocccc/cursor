import { supabase, getSessionUser } from "./supabase.js";

// 内部API: トリガーを発火させる
// 認証済みユーザーからの内部呼び出しを想定
export async function fireTrigger(triggerType, context, recipientEmail) {
  // トリガー設定を取得
  const { data: trigger } = await supabase
    .from("email_triggers")
    .select("*")
    .eq("trigger_type", triggerType)
    .eq("is_active", true)
    .maybeSingle();

  if (!trigger) return { skipped: true, reason: "トリガーが無効または未設定" };

  // テンプレート変数を置換
  let subject = trigger.subject.replace(/\{\{(\w+)\}\}/g, (_, key) => context[key] || "");
  let body = trigger.body.replace(/\{\{(\w+)\}\}/g, (_, key) => context[key] || "");

  if (!recipientEmail) return { skipped: true, reason: "送信先メールアドレスが不明" };

  // TODO: Resend連携（後で実装）
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({ from: 'noreply@apocwire.com', to: recipientEmail, subject, html: body });

  // 現時点ではログだけ保存
  await supabase.from("email_logs").insert({
    trigger_type: triggerType,
    recipient_email: recipientEmail,
    subject,
    body,
    status: "pending",
  });

  return { ok: true, to: recipientEmail };
}

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
  if (!user) return res.status(401).json({ error: "認証が必要です" });

  const { trigger_type, context, recipient_email } = req.body || {};
  if (!trigger_type) return res.status(400).json({ error: "trigger_typeは必須です" });

  const result = await fireTrigger(trigger_type, context || {}, recipient_email || user.email);
  return res.json(result);
}
