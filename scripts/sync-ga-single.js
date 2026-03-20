import { createClient } from "@supabase/supabase-js";
import { BetaAnalyticsDataClient } from "@google-analytics/data";

const PRESS_RELEASE_ID = "6679600f-2e75-415f-9215-434280af495c";
const SLUG = "cyberagent_us20260316";
const PAGE_PATH = `/press/${SLUG}`;

// Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// GA4
const propertyId = process.env.GA4_PROPERTY_ID;
const clientEmail = process.env.GA4_CLIENT_EMAIL;
const privateKey = process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!propertyId || !clientEmail || !privateKey) {
  console.error("Missing GA4 env vars (GA4_PROPERTY_ID, GA4_CLIENT_EMAIL, GA4_PRIVATE_KEY)");
  process.exit(1);
}

const analyticsClient = new BetaAnalyticsDataClient({
  credentials: { client_email: clientEmail, private_key: privateKey },
});

console.log(`Fetching GA4 data for: ${PAGE_PATH}`);

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
      stringFilter: { matchType: "EXACT", value: PAGE_PATH },
    },
  },
});

let pageViews = 0;
let sessions = 0;

if (response.rows && response.rows.length > 0) {
  pageViews = parseInt(response.rows[0].metricValues[0].value, 10) || 0;
  sessions = parseInt(response.rows[0].metricValues[1].value, 10) || 0;
}

console.log(`Results: pageViews=${pageViews}, sessions=${sessions}`);

const { error } = await supabase
  .from("press_releases")
  .update({
    ga_page_views: pageViews,
    ga_sessions: sessions,
    ga_last_synced_at: new Date().toISOString(),
  })
  .eq("id", PRESS_RELEASE_ID);

if (error) {
  console.error("Supabase update failed:", error.message);
  process.exit(1);
}

console.log(`Updated press_release ${PRESS_RELEASE_ID}:`);
console.log(`  slug: ${SLUG}`);
console.log(`  ga_page_views: ${pageViews}`);
console.log(`  ga_sessions: ${sessions}`);
console.log(`  ga_last_synced_at: ${new Date().toISOString()}`);
