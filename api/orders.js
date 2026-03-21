import { Resend } from "resend";
import { supabase, getSessionUser } from "./supabase.js";

const resend = new Resend(process.env.RESEND_API_KEY);

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();

  const user = await getSessionUser(req);
  if (!user) return res.status(401).json({ error: "認証が必要です" });

  // GET — list orders
  if (req.method === "GET") {
    let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
    // Non-admin users only see their own orders
    if (user.is_admin !== "yes") {
      query = query.eq("user_id", user.id);
    }
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ orders: data });
  }

  // POST — create order
  if (req.method === "POST") {
    const { categories, countries, company_name, contact_name, email, phone, selected_options, base_price, total_price, sns_consent, cancel_consent } = req.body || {};

    if (!categories || !categories.length) return res.status(400).json({ error: "カテゴリーを選択してください" });
    if (!countries || !countries.length) return res.status(400).json({ error: "配信先を選択してください" });
    if (!company_name) return res.status(400).json({ error: "企業名は必須です" });
    if (!contact_name) return res.status(400).json({ error: "担当者名は必須です" });
    if (!email) return res.status(400).json({ error: "メールアドレスは必須です" });
    if (!cancel_consent) return res.status(400).json({ error: "キャンセルポリシーへの同意が必要です" });

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        categories,
        countries,
        company_name,
        contact_name,
        email,
        phone: phone || "",
        selected_options: selected_options || [],
        base_price: base_price || 0,
        total_price: total_price || 0,
        sns_consent: sns_consent || false,
        cancel_consent,
      })
      .select()
      .single();

    if (error) {
      console.error("Order insert error:", error);
      return res.status(500).json({ error: "発注の登録に失敗しました" });
    }

    // Send notification email (fire-and-forget)
    try {
      await resend.emails.send({
        from: "ApocWire <onboarding@resend.dev>",
        to: email,
        subject: `[ApocWire] 発注を受け付けました（${order.id.slice(0, 8)}）`,
        html: `
          <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
            <div style="margin-bottom:24px;">
              <span style="background:#2563eb;color:#fff;font-size:11px;font-weight:700;padding:3px 7px;">AW</span>
              <span style="font-size:15px;font-weight:700;margin-left:6px;">ApocWire</span>
            </div>
            <p style="font-size:14px;color:#1a2f5e;margin-bottom:8px;">${contact_name} 様</p>
            <p style="font-size:13px;color:#4a5568;margin-bottom:16px;">プレスリリース配信のご発注を受け付けました。</p>
            <div style="background:#f0f4ff;border:1px solid #e0e0e0;padding:16px;margin-bottom:16px;">
              <p style="font-size:12px;color:#999;margin-bottom:4px;">注文ID</p>
              <p style="font-size:14px;font-weight:700;color:#1a2f5e;">${order.id.slice(0, 8)}</p>
              <p style="font-size:12px;color:#999;margin-top:12px;margin-bottom:4px;">配信先</p>
              <p style="font-size:13px;color:#1a2f5e;">${countries.length}カ国</p>
              <p style="font-size:12px;color:#999;margin-top:12px;margin-bottom:4px;">合計金額（税込）</p>
              <p style="font-size:16px;font-weight:700;color:#2563eb;">¥${Math.floor(total_price * 1.1).toLocaleString()}</p>
            </div>
            <p style="font-size:12px;color:#999;">担当者より改めてご連絡いたします。</p>
          </div>
        `,
      });
    } catch (err) {
      console.error("Notification email error:", err);
    }

    return res.status(201).json({ order });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
