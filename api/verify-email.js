import crypto from "node:crypto";
import { supabase } from "./supabase.js";

const SECRET = process.env.OTP_SECRET || process.env.RESEND_API_KEY;

function signToken(email, expiresAt) {
  return crypto
    .createHmac("sha256", SECRET)
    .update(`register:${email}:${expiresAt}`)
    .digest("hex");
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, token, expires } = req.query || {};

  if (!email || !token || !expires) {
    return sendHtml(res, 400, "invalid", "パラメータが不足しています。メール内のリンクをもう一度クリックしてください。");
  }

  const expiresAt = parseInt(expires, 10);
  if (isNaN(expiresAt) || Date.now() > expiresAt) {
    return sendHtml(res, 400, "expired", "認証リンクの有効期限が切れています。お手数ですが、再度会員登録を行ってください。");
  }

  const emailLower = email.toLowerCase().trim();
  const expected = signToken(emailLower, expiresAt);

  let valid = false;
  try {
    valid = crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(token, "hex")
    );
  } catch {
    valid = false;
  }

  if (!valid) {
    return sendHtml(res, 400, "invalid", "認証リンクが無効です。メール内のリンクをもう一度クリックしてください。");
  }

  // Update email_verified in Supabase
  const { error } = await supabase
    .from("users")
    .update({ email_verified: true })
    .eq("email", emailLower);

  if (error) {
    console.error("Supabase verify error:", error);
    return sendHtml(res, 500, "error", "認証処理中にエラーが発生しました。しばらくしてから再度お試しください。");
  }

  return sendHtml(res, 200, "success", null);
}

function sendHtml(res, status, type, errorMsg) {
  const isSuccess = type === "success";

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isSuccess ? "メール認証完了" : "認証エラー"} - ApocWire</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: { extend: { colors: { brand: '#2563eb', ink: '#1a2f5e', sub: '#4a5568', mute: '#999', line: '#e0e0e0', bg: '#ffffff' } } }
    }
  </script>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>body { font-family: 'Noto Sans JP', system-ui, sans-serif; }</style>
</head>
<body class="bg-bg text-ink min-h-screen flex items-center justify-center p-4">
  <div class="max-w-sm w-full">
    <div class="text-center mb-6">
      <div class="flex items-center justify-center gap-1.5 mb-6">
        <span class="bg-brand text-white text-[11px] font-bold px-1.5 py-0.5 leading-none">AW</span>
        <span class="text-[16px] font-bold">ApocWire</span>
      </div>
      ${isSuccess ? `
        <div class="w-14 h-14 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
          <svg class="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <h1 class="font-bold text-[18px] mb-2">メール認証が完了しました</h1>
        <p class="text-[13px] text-sub">アカウントが有効化されました。ログインしてご利用ください。</p>
      ` : `
        <div class="w-14 h-14 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <svg class="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </div>
        <h1 class="font-bold text-[18px] mb-2">認証エラー</h1>
        <p class="text-[13px] text-sub">${errorMsg}</p>
      `}
    </div>
    <a href="/" class="block w-full text-center bg-ink text-white py-2.5 rounded-sm text-[13px] font-medium hover:bg-ink/80 transition-colors">
      ${isSuccess ? "ログインページへ" : "トップページへ"}
    </a>
  </div>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.status(status).send(html);
}
