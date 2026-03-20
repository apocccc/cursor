/**
 * PR TIMES クローリング & テストデータ差し替えスクリプト
 *
 * 使い方:
 *   node scripts/seed-prtimes.js
 *
 * 仕様:
 *   - PR TIMESの新着一覧からプレスリリースを取得
 *   - 1法人あたり最大3件まで
 *   - 取得データ: タイトル・会社名・配信日・カテゴリー・本文抜粋・URL
 *   - lib/mock-data.js を差し替え
 *   - Supabase press_releases テーブルにも投入（環境変数設定時）
 */

import * as cheerio from "cheerio";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = "https://prtimes.jp";
const MAX_PER_COMPANY = 3;
const TARGET_RELEASES = 20; // 目標取得件数

// カテゴリマッピング (PR TIMES → ApocWire)
const CATEGORY_MAP = {
  "テクノロジー": "it",
  "IT": "it",
  "ネットサービス": "it",
  "アプリ": "it",
  "製品・サービス": "it",
  "商品サービス": "it",
  "製造": "manufacturing",
  "メーカー": "manufacturing",
  "ものづくり": "manufacturing",
  "食品": "food",
  "グルメ": "food",
  "飲料": "food",
  "フード": "food",
  "エンタメ": "entertainment",
  "エンターテインメント": "entertainment",
  "ゲーム": "entertainment",
  "音楽": "entertainment",
  "レジャー": "entertainment",
  "金融": "finance",
  "保険": "finance",
  "経営": "finance",
  "ビジネス": "finance",
  "医療": "healthcare",
  "ヘルスケア": "healthcare",
  "福祉": "healthcare",
  "美容": "healthcare",
  "ビューティー": "healthcare",
  "ライフスタイル": "entertainment",
  "ファッション": "entertainment",
};

function mapCategory(prTimesCategory) {
  if (!prTimesCategory) return "it";
  for (const [key, value] of Object.entries(CATEGORY_MAP)) {
    if (prTimesCategory.includes(key)) return value;
  }
  return "it";
}

async function fetchHTML(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "ApocWire-Seed-Script/1.0 (compatible)",
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "ja,en;q=0.9",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.text();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** PR TIMES トップページから新着リリース一覧を取得 */
async function fetchReleaseList() {
  console.log("📡 PR TIMES トップページを取得中...");
  const html = await fetchHTML(`${BASE_URL}/`);
  const $ = cheerio.load(html);

  const releases = [];

  // 各プレスリリースリンクを探索
  $("a[href*='/main/html/rd/p/']").each((_, el) => {
    const $el = $(el);
    const href = $el.attr("href");
    if (!href) return;

    const url = href.startsWith("http") ? href : `${BASE_URL}${href}`;

    // タイトルを取得（リンク内のテキスト or 直近のh要素）
    let title = $el.find("h2, h3").first().text().trim() || $el.text().trim();
    if (!title || title.length < 5) return;
    // 長すぎるテキストは除外（ナビゲーションリンク等）
    if (title.length > 200) return;

    releases.push({ title, url });
  });

  console.log(`  → ${releases.length}件のリンクを検出`);

  // 重複URL除去
  const seen = new Set();
  return releases.filter((r) => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });
}

/** 個別プレスリリースページから詳細を取得 */
async function fetchReleaseDetail(url) {
  try {
    const html = await fetchHTML(url);
    const $ = cheerio.load(html);

    // タイトル
    const title =
      $("h1.release--title").text().trim() ||
      $("h1").first().text().trim() ||
      $('meta[property="og:title"]').attr("content") ||
      "";

    // 会社名
    const company =
      $("a[href*='/company_id/']").first().text().trim() ||
      $(".company-name").first().text().trim() ||
      $('meta[name="author"]').attr("content") ||
      "";

    // 配信日 (YYYY-MM-DD形式に正規化)
    let dateText =
      $('time[datetime]').attr("datetime") ||
      $('meta[property="article:published_time"]').attr("content") ||
      $(".release-date, .information-release-date").first().text().trim() ||
      "";
    // "2026-03-18 14:40:02" or "2026-03-18T14:40:02" → "2026-03-18"
    dateText = dateText.split(/[T ]/)[0];

    // カテゴリー
    const category =
      $("a[href*='release_type_id']").first().text().trim() ||
      $(".release-category, .information-category").first().text().trim() ||
      "";

    // 本文抜粋
    const bodyEl = $(".rich-text, .pr-text, article .body, .release--body, #press-release-body");
    let body = "";
    if (bodyEl.length) {
      body = bodyEl.first().text().trim();
    } else {
      body = $('meta[property="og:description"]').attr("content") || "";
    }
    // 本文を適度に切り詰め
    if (body.length > 600) {
      body = body.substring(0, 600) + "...";
    }

    // サムネイル画像URL（OGP画像 → 記事内最初のimg）
    let thumbnailUrl =
      $('meta[property="og:image"]').attr("content") || "";
    if (!thumbnailUrl) {
      const firstImg = bodyEl.find("img").first().attr("src") ||
        $("article img").first().attr("src") || "";
      thumbnailUrl = firstImg;
    }
    // 相対URLを絶対URLに変換
    if (thumbnailUrl && !thumbnailUrl.startsWith("http")) {
      thumbnailUrl = `${BASE_URL}${thumbnailUrl.startsWith("/") ? "" : "/"}${thumbnailUrl}`;
    }

    // 会社IDをURLから抽出
    const companyIdMatch = url.match(/\.(\d+)\.html/);
    const companyIdNum = companyIdMatch ? companyIdMatch[1] : "";

    return {
      title: title || null,
      company: company || null,
      companyIdNum,
      date: dateText ? dateText.split("T")[0] : null,
      category: category || null,
      categoryId: mapCategory(category),
      body: body || null,
      thumbnailUrl: thumbnailUrl || null,
      url,
    };
  } catch (err) {
    console.error(`  ⚠ 取得失敗: ${url} - ${err.message}`);
    return null;
  }
}

/** 会社情報を生成 */
function generateCompanies(releases) {
  const companyMap = new Map();
  for (const r of releases) {
    if (!r.company || companyMap.has(r.companyIdNum)) continue;
    const id = `company_${r.companyIdNum}`;
    const initials = r.company
      .replace(/株式会社|有限会社|合同会社/g, "")
      .trim()
      .substring(0, 2);
    companyMap.set(r.companyIdNum, {
      id,
      name: r.company,
      nameEn: r.company,
      logo: initials,
      description: `${r.company}のプレスリリース`,
      industry: r.category || "その他",
      founded: "",
      employees: "",
    });
  }
  return Array.from(companyMap.values());
}

/** mock-data.js を生成 */
function generateMockDataJS(categories, companies, releases) {
  const pressReleases = releases.map((r, i) => ({
    id: String(i + 1),
    title: r.title,
    titleEn: "",
    summary: r.body ? r.body.substring(0, 100) : "",
    summaryEn: "",
    body: r.body || "",
    bodyEn: "",
    companyId: `company_${r.companyIdNum}`,
    categoryId: r.categoryId,
    regions: ["na", "eu", "asia"],
    publishedAt: r.date || new Date().toISOString().split("T")[0],
    thumbnailUrl: r.thumbnailUrl || null,
  }));

  const code = `const CATEGORIES = ${JSON.stringify(categories, null, 2)};

const REGIONS = [
  { id: "na", name: "北米", flag: "🇺🇸" },
  { id: "eu", name: "欧州", flag: "🇪🇺" },
  { id: "asia", name: "アジア", flag: "🇸🇬" },
  { id: "cn", name: "中国", flag: "🇨🇳" },
  { id: "kr", name: "韓国", flag: "🇰🇷" },
  { id: "latam", name: "中南米", flag: "🇧🇷" },
];

const LANGS = [
  { id: "en", name: "English", label: "英語" },
  { id: "zh", name: "中文", label: "中国語" },
  { id: "ko", name: "한국어", label: "韓国語" },
  { id: "es", name: "Español", label: "スペイン語" },
  { id: "fr", name: "Français", label: "フランス語" },
  { id: "de", name: "Deutsch", label: "ドイツ語" },
];

const COMPANIES = ${JSON.stringify(companies, null, 2)};

const PRESS_RELEASES = ${JSON.stringify(pressReleases, null, 2)};
`;
  return code;
}

/** Supabase にシードデータを投入 */
async function seedSupabase(releases) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log("ℹ️  SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が未設定のため、Supabaseへの投入はスキップ");
    return;
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("🗄️  Supabase: 既存データを削除中...");
  await supabase.from("press_releases").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log("🗄️  Supabase: 新規データを投入中...");
  const rows = releases.map((r, i) => ({
    title: r.title,
    company: r.company,
    published_at: r.date || new Date().toISOString().split("T")[0],
    category: r.category,
    body: r.body,
    source_url: r.url,
    thumbnail_url: r.thumbnailUrl || null,
  }));

  const { error } = await supabase.from("press_releases").insert(rows);
  if (error) {
    console.error("  ⚠ Supabase投入エラー:", error.message);
  } else {
    console.log(`  ✅ ${rows.length}件をpress_releasesテーブルに投入しました`);
  }
}

// ===== メイン処理 =====
async function main() {
  console.log("🚀 PR TIMES クローリング開始\n");

  // 1. 一覧ページからリンク取得
  const list = await fetchReleaseList();
  console.log(`\n📋 ${list.length}件のユニークなリリースを検出\n`);

  // 2. 詳細ページを取得（レート制限のため間隔を空ける）
  const details = [];
  const companyCount = new Map();
  let fetched = 0;

  for (const item of list) {
    if (details.length >= TARGET_RELEASES) break;

    console.log(`  [${fetched + 1}] ${item.title.substring(0, 50)}...`);
    const detail = await fetchReleaseDetail(item.url);

    if (detail && detail.title && detail.company) {
      // 1法人あたり最大3件
      const count = companyCount.get(detail.companyIdNum) || 0;
      if (count < MAX_PER_COMPANY) {
        details.push(detail);
        companyCount.set(detail.companyIdNum, count + 1);
      } else {
        console.log(`    → ${detail.company} は既に${MAX_PER_COMPANY}件取得済み、スキップ`);
      }
    }

    fetched++;
    // PR TIMESへの負荷軽減: 1秒待機
    await sleep(1000);
  }

  console.log(`\n✅ ${details.length}件のプレスリリースを取得完了\n`);

  // 3. 会社データを生成
  const companies = generateCompanies(details);
  console.log(`📊 ${companies.length}社の企業データを生成`);

  // 4. カテゴリー（既存を維持）
  const categories = [
    { id: "it", name: "IT・テクノロジー" },
    { id: "manufacturing", name: "製造・メーカー" },
    { id: "food", name: "食品・飲料" },
    { id: "entertainment", name: "エンタメ・レジャー" },
    { id: "finance", name: "金融・保険" },
    { id: "healthcare", name: "医療・ヘルスケア" },
  ];

  // 5. mock-data.js を生成・書き出し
  const mockDataPath = join(__dirname, "..", "lib", "mock-data.js");
  const jsContent = generateMockDataJS(categories, companies, details);
  writeFileSync(mockDataPath, jsContent, "utf-8");
  console.log(`\n📝 ${mockDataPath} を更新しました`);

  // 6. Supabase にシード（環境変数がある場合）
  await seedSupabase(details);

  console.log("\n🎉 完了！");
}

main().catch((err) => {
  console.error("❌ エラー:", err);
  process.exit(1);
});
