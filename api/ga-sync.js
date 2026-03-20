import { supabase } from "./supabase.js";
import { BetaAnalyticsDataClient } from "@google-analytics/data";

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
    .single();
  if (!session || new Date(session.expires_at) < new Date()) return null;
  const { data: user } = await supabase
    .from("users")
    .select("id, email, name, company, role")
    .eq("id", session.user_id)
    .single();
  return user;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "認証が必要です" });

  const propertyId = process.env.GA4_PROPERTY_ID;
  const clientEmail = process.env.GA4_CLIENT_EMAIL;
  const privateKey = process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!propertyId || !clientEmail || !privateKey) {
    return res.status(500).json({ error: "GA4環境変数が未設定です" });
  }

  // slugが設定されているプレスリリースを取得
  const { data: releases, error: fetchErr } = await supabase
    .from("press_releases")
    .select("id, slug")
    .not("slug", "is", null)
    .neq("slug", "");

  if (fetchErr) {
    return res.status(500).json({ error: "プレスリリースの取得に失敗しました" });
  }

  if (!releases || releases.length === 0) {
    return res.json({ message: "slugが設定されたプレスリリースがありません", updated: 0 });
  }

  const analyticsClient = new BetaAnalyticsDataClient({
    credentials: { client_email: clientEmail, private_key: privateKey },
  });

  let updated = 0;

  for (const release of releases) {
    const pagePath = `/press/${release.slug}`;
    try {
      const [response] = await analyticsClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [{ name: "pagePath" }],
        metrics: [
          { name: "screenPageViews" },
          { name: "sessions" },
        ],
        dimensionFilter: {
          filter: {
            fieldName: "pagePath",
            stringFilter: { matchType: "EXACT", value: pagePath },
          },
        },
      });

      let pageViews = 0;
      let sessions = 0;

      if (response.rows && response.rows.length > 0) {
        pageViews = parseInt(response.rows[0].metricValues[0].value, 10) || 0;
        sessions = parseInt(response.rows[0].metricValues[1].value, 10) || 0;
      }

      const { error: updateErr } = await supabase
        .from("press_releases")
        .update({
          ga_page_views: pageViews,
          ga_sessions: sessions,
          ga_last_synced_at: new Date().toISOString(),
        })
        .eq("id", release.id);

      if (!updateErr) updated++;
    } catch (err) {
      // エラー時は該当記事のGA数値をnullのまま維持
      console.error('GA4 auth error:', err.message, err.code);
      console.error(`GA sync error for ${release.slug}:`, err.message);
    }
  }

  return res.json({ message: `${updated}件のプレスリリースを更新しました`, updated });
}
