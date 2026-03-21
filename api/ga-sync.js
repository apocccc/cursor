import { supabase, getSessionUser } from "./supabase.js";
import { BetaAnalyticsDataClient } from "@google-analytics/data";

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method === "GET") {
    // Vercel Cron Jobからの呼び出し（CRON_SECRETで認証）
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || req.headers.authorization !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  } else if (req.method === "POST") {
    // 手動呼び出し（ユーザー認証）
    const user = await getSessionUser(req);
    if (!user) return res.status(401).json({ error: "認証が必要です" });
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const propertyId = process.env.GA4_PROPERTY_ID;
  const clientEmail = process.env.GA4_CLIENT_EMAIL;
  const privateKey = process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!propertyId || !clientEmail || !privateKey) {
    return res.status(500).json({ error: "GA4環境変数が未設定です" });
  }

  // slugが設定されているpress_dataを取得
  const { data: pressDataList, error: fetchErr } = await supabase
    .from("press_data")
    .select("id, slug")
    .not("slug", "is", null)
    .neq("slug", "");

  if (fetchErr) {
    return res.status(500).json({ error: "press_dataの取得に失敗しました" });
  }

  if (!pressDataList || pressDataList.length === 0) {
    return res.json({ message: "slugが設定されたpress_dataがありません", updated: 0 });
  }

  const analyticsClient = new BetaAnalyticsDataClient({
    credentials: { client_email: clientEmail, private_key: privateKey },
  });

  let updated = 0;

  for (const pd of pressDataList) {
    const pagePath = `/press/${pd.slug}`;
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
        .from("press_data")
        .update({
          ga_page_views: pageViews,
          ga_sessions: sessions,
          ga_last_synced_at: new Date().toISOString(),
        })
        .eq("id", pd.id);

      if (!updateErr) updated++;
    } catch (err) {
      console.error('GA4 auth error:', err.message, err.code);
      console.error(`GA sync error for ${pd.slug}:`, err.message);
    }
  }

  return res.json({ message: `${updated}件のpress_dataを更新しました`, updated });
}
