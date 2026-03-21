import { supabase } from "./supabase.js";
import { BetaAnalyticsDataClient } from "@google-analytics/data";

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
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
    .maybeSingle();
  if (!session || new Date(session.expires_at) < new Date()) return null;
  const { data: user } = await supabase
    .from("users")
    .select("id, is_admin")
    .eq("id", session.user_id)
    .maybeSingle();
  return user;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "認証が必要です" });

  const propertyId = process.env.GA4_PROPERTY_ID;
  const clientEmail = process.env.GA4_CLIENT_EMAIL;
  let privateKey = process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!propertyId || !clientEmail || !privateKey) {
    return res.status(500).json({ error: "GA4環境変数が未設定です" });
  }

  // PEMヘッダー補完（必要な場合のみ）
  if (privateKey && !privateKey.includes("BEGIN PRIVATE KEY")) {
    privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey.trim()}\n-----END PRIVATE KEY-----\n`;
  }

  // Get slugs for this user's releases (or all for admin)
  let slugQuery = supabase
    .from("press_releases")
    .select("slug")
    .not("slug", "is", null)
    .neq("slug", "");
  if (user.is_admin !== "yes") {
    slugQuery = slugQuery.eq("creator", user.id);
  }
  const { data: releases } = await slugQuery;
  const slugs = (releases || []).map((r) => r.slug).filter(Boolean);

  if (slugs.length === 0) {
    return res.json({ daily: [], referrers: [], countries: [], perSlug: [] });
  }

  const analyticsClient = new BetaAnalyticsDataClient({
    credentials: { client_email: clientEmail, private_key: privateKey },
  });

  const property = `properties/${propertyId}`;
  const dateRanges = [{ startDate: "30daysAgo", endDate: "today" }];

  // Build page path filter for all slugs
  const pagePathFilters = slugs.map((slug) => ({
    filter: {
      fieldName: "pagePath",
      stringFilter: { matchType: "EXACT", value: `/press/${slug}` },
    },
  }));
  const dimensionFilter =
    pagePathFilters.length === 1
      ? pagePathFilters[0]
      : { orGroup: { expressions: pagePathFilters } };

  try {
    // 1. Daily PV/UU
    const [dailyRes] = await analyticsClient.runReport({
      property,
      dateRanges,
      dimensions: [{ name: "date" }],
      metrics: [
        { name: "screenPageViews" },
        { name: "sessions" },
      ],
      dimensionFilter,
      orderBys: [{ dimension: { dimensionName: "date" } }],
    });

    const daily = (dailyRes.rows || []).map((row) => ({
      date: row.dimensionValues[0].value, // YYYYMMDD
      pv: parseInt(row.metricValues[0].value, 10) || 0,
      uu: parseInt(row.metricValues[1].value, 10) || 0,
    }));

    // 2. Referrers (session source / medium)
    const [refRes] = await analyticsClient.runReport({
      property,
      dateRanges,
      dimensions: [{ name: "sessionSourceMedium" }],
      metrics: [
        { name: "sessions" },
        { name: "screenPageViews" },
      ],
      dimensionFilter,
      orderBys: [
        { metric: { metricName: "sessions" }, desc: true },
      ],
      limit: 20,
    });

    const referrers = (refRes.rows || []).map((row) => ({
      source: row.dimensionValues[0].value,
      sessions: parseInt(row.metricValues[0].value, 10) || 0,
      pv: parseInt(row.metricValues[1].value, 10) || 0,
    }));

    // 3. Country breakdown
    const [countryRes] = await analyticsClient.runReport({
      property,
      dateRanges,
      dimensions: [{ name: "country" }],
      metrics: [{ name: "screenPageViews" }],
      dimensionFilter,
      orderBys: [
        { metric: { metricName: "screenPageViews" }, desc: true },
      ],
      limit: 15,
    });

    const totalCountryPV = (countryRes.rows || []).reduce(
      (sum, row) => sum + (parseInt(row.metricValues[0].value, 10) || 0),
      0
    );
    const countries = (countryRes.rows || []).map((row) => {
      const pv = parseInt(row.metricValues[0].value, 10) || 0;
      return {
        country: row.dimensionValues[0].value,
        pv,
        pct: totalCountryPV > 0 ? Math.round((pv / totalCountryPV) * 1000) / 10 : 0,
      };
    });

    // 4. Per-slug daily breakdown
    const [slugRes] = await analyticsClient.runReport({
      property,
      dateRanges,
      dimensions: [{ name: "pagePath" }, { name: "date" }],
      metrics: [
        { name: "screenPageViews" },
        { name: "sessions" },
      ],
      dimensionFilter,
      orderBys: [{ dimension: { dimensionName: "date" } }],
    });

    // Group by slug
    const slugMap = {};
    for (const row of slugRes.rows || []) {
      const path = row.dimensionValues[0].value;
      const date = row.dimensionValues[1].value;
      const pv = parseInt(row.metricValues[0].value, 10) || 0;
      const uu = parseInt(row.metricValues[1].value, 10) || 0;
      if (!slugMap[path]) slugMap[path] = {};
      slugMap[path][date] = { pv, uu };
    }

    const perSlug = Object.entries(slugMap).map(([path, dates]) => {
      const slug = path.replace("/press/", "");
      const dailyEntries = Object.entries(dates)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, vals]) => ({ date, ...vals }));
      const totalPV = dailyEntries.reduce((s, d) => s + d.pv, 0);
      const totalUU = dailyEntries.reduce((s, d) => s + d.uu, 0);
      return { slug, path, daily: dailyEntries, totalPV, totalUU };
    });

    return res.json({ daily, referrers, countries, perSlug });
  } catch (err) {
    console.error("GA4 analytics error:", err.message);
    return res.status(500).json({ error: "GA4データの取得に失敗しました", detail: err.message });
  }
}
