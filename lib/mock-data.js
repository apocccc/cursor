const CATEGORIES = [
  { id: "it", name: "IT・テクノロジー" },
  { id: "manufacturing", name: "製造・メーカー" },
  { id: "food", name: "食品・飲料" },
  { id: "entertainment", name: "エンタメ・レジャー" },
  { id: "finance", name: "金融・保険" },
  { id: "healthcare", name: "医療・ヘルスケア" },
];

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

const COMPANIES = [
  {
    id: "techvision",
    name: "テックビジョン株式会社",
    nameEn: "TechVision Inc.",
    logo: "TV",
    description: "AIとクラウド技術を活用したSaaSプロダクトを開発。2018年創業、従業員数120名。企業のDX推進を支援するソリューションを提供。",
    industry: "IT・テクノロジー",
    founded: "2018年",
    employees: "120名",
  },
  {
    id: "greenfactory",
    name: "グリーンファクトリー株式会社",
    nameEn: "Green Factory Co., Ltd.",
    logo: "GF",
    description: "環境配慮型の製造プロセスを推進する総合メーカー。持続可能な製品開発と循環型経済の実現に取り組む。",
    industry: "製造・メーカー",
    founded: "2005年",
    employees: "450名",
  },
  {
    id: "umamilab",
    name: "うまみラボ株式会社",
    nameEn: "Umami Lab Inc.",
    logo: "UL",
    description: "発酵技術と最新のフードテクノロジーを融合した新しい食品ブランド。伝統的な日本の食文化を現代に再解釈。",
    industry: "食品・飲料",
    founded: "2020年",
    employees: "35名",
  },
  {
    id: "stageone",
    name: "ステージワン株式会社",
    nameEn: "StageOne Inc.",
    logo: "S1",
    description: "ライブエンターテインメントとデジタルコンテンツの企画・制作を手がける総合エンタメ企業。XR技術を活用。",
    industry: "エンタメ・レジャー",
    founded: "2015年",
    employees: "80名",
  },
  {
    id: "mediwell",
    name: "メディウェル株式会社",
    nameEn: "MediWell Inc.",
    logo: "MW",
    description: "オンライン診療プラットフォームと医療データ分析を提供するヘルスケアテック企業。",
    industry: "医療・ヘルスケア",
    founded: "2019年",
    employees: "65名",
  },
];

const PRESS_RELEASES = [
  {
    id: "1",
    title: "テックビジョン、生成AIを活用した業務自動化プラットフォーム「AutoFlow AI」を正式リリース",
    titleEn: "TechVision Launches AutoFlow AI, a Generative AI-Powered Business Automation Platform",
    summary: "企業の定型業務を最大70%自動化する新サービスを提供開始。中小企業向けの無料プランも用意。",
    summaryEn: "New service automates up to 70% of routine business operations. Free plan available for SMBs.",
    body: `テックビジョン株式会社（本社：東京都渋谷区、代表取締役：山田太郎）は、生成AIを活用した業務自動化プラットフォーム「AutoFlow AI」を本日より正式にリリースいたします。

■ サービス概要
AutoFlow AIは、企業の日常的な定型業務をAIが自動的に処理するクラウドプラットフォームです。書類作成、データ入力、メール対応、スケジュール調整など、これまで人手で行っていた業務をAIが学習し、自動化します。

■ 主な特徴
・ノーコードで業務フローを設計可能
・既存のSaaS（Slack、Google Workspace、Microsoft 365等）との連携
・業務パターンを自動学習し、精度が向上
・エンタープライズグレードのセキュリティ

■ 料金プラン
・フリープラン：月5,000タスクまで無料
・スタンダードプラン：月額29,800円（税別）
・エンタープライズプラン：要問合せ

■ 今後の展望
2026年中に利用企業1,000社の獲得を目指し、パートナーエコシステムの拡充を進めてまいります。`,
    bodyEn: `TechVision Inc. (Headquarters: Shibuya, Tokyo; CEO: Taro Yamada) today announced the official launch of AutoFlow AI, a generative AI-powered business automation platform.

■ Service Overview
AutoFlow AI is a cloud platform where AI automatically handles routine business operations. It learns and automates tasks such as document creation, data entry, email handling, and scheduling.

■ Key Features
・No-code workflow design
・Integration with existing SaaS (Slack, Google Workspace, Microsoft 365, etc.)
・Automatic learning of business patterns for improved accuracy
・Enterprise-grade security

■ Pricing Plans
・Free Plan: Up to 5,000 tasks/month at no cost
・Standard Plan: ¥29,800/month (excl. tax)
・Enterprise Plan: Contact us

■ Future Outlook
TechVision aims to acquire 1,000 corporate users by the end of 2026 while expanding its partner ecosystem.`,
    companyId: "techvision",
    categoryId: "it",
    regions: ["na", "eu", "asia"],
    publishedAt: "2026-03-12",
  },
  {
    id: "2",
    title: "グリーンファクトリー、100%リサイクル素材の建築資材を量産化に成功",
    titleEn: "Green Factory Achieves Mass Production of 100% Recycled Building Materials",
    summary: "廃プラスチックを原料とした高強度建築パネルの量産技術を確立。従来品と同等の耐久性を実現。",
    summaryEn: "High-strength building panels made entirely from waste plastics now in mass production.",
    body: `グリーンファクトリー株式会社（本社：愛知県名古屋市、代表取締役：佐藤花子）は、廃プラスチックを100%原料としたリサイクル建築資材の量産化に成功したことをお知らせいたします。

■ 開発背景
建設業界では年間約400万トンの廃棄物が発生しており、循環型経済への転換が急務となっています。

■ 製品の特徴
・廃プラスチック100%使用（原料はペットボトル・容器等）
・従来の木質パネルと同等以上の強度（曲げ強度25MPa）
・耐水性・耐候性に優れ、屋外使用にも対応
・CO2排出量を従来比で60%削減

■ 量産体制
名古屋工場に専用生産ラインを新設し、月産50,000枚の量産体制を整備。初年度売上目標は30億円。`,
    bodyEn: `Green Factory Co., Ltd. (Headquarters: Nagoya, Aichi; CEO: Hanako Sato) announces the successful mass production of building materials made from 100% recycled waste plastics.

■ Background
The construction industry generates approximately 4 million tons of waste annually, making the transition to a circular economy urgent.

■ Product Features
・Made from 100% waste plastics (PET bottles, containers, etc.)
・Strength equal to or greater than conventional wood panels (flexural strength: 25 MPa)
・Excellent water and weather resistance for outdoor use
・60% reduction in CO2 emissions compared to conventional products

■ Production Capacity
A dedicated production line at the Nagoya plant enables mass production of 50,000 panels per month. First-year sales target: ¥3 billion.`,
    companyId: "greenfactory",
    categoryId: "manufacturing",
    regions: ["na", "eu"],
    publishedAt: "2026-03-11",
  },
  {
    id: "3",
    title: "うまみラボ、次世代プロテイン食品「HAKKO PROTEIN」シリーズを発売",
    titleEn: "Umami Lab Launches 'HAKKO PROTEIN' Next-Gen Fermented Protein Food Series",
    summary: "日本の発酵技術とバイオテクノロジーを融合した植物性プロテイン食品3種を全国のスーパーで販売開始。",
    summaryEn: "Three plant-based protein products combining Japanese fermentation and biotech hit stores nationwide.",
    body: `うまみラボ株式会社（本社：京都府京都市、代表取締役：田中誠）は、独自の発酵技術を活用した次世代プロテイン食品「HAKKO PROTEIN」シリーズの販売を3月20日より開始いたします。

■ 商品概要
HAKKO PROTEINは、大豆やエンドウ豆などの植物性タンパク質を日本伝統の発酵技術で加工した新しいプロテイン食品です。

■ ラインナップ（各598円・税込）
1. HAKKO PROTEIN BAR（味噌キャラメル / 甘酒バニラ / 醤油ショコラ）
2. HAKKO PROTEIN SOUP（豆乳味噌 / 発酵トマト）
3. HAKKO PROTEIN GRANOLA（麹グラノーラ）

■ 技術的特徴
・独自の「ダブルファーメンテーション製法」によりタンパク質の吸収率を40%向上
・発酵由来のアミノ酸が豊富で自然な旨味を実現
・保存料・人工甘味料不使用`,
    bodyEn: `Umami Lab Inc. (Headquarters: Kyoto; CEO: Makoto Tanaka) will begin selling the HAKKO PROTEIN series of next-generation fermented protein foods from March 20.

■ Product Overview
HAKKO PROTEIN is a new line of protein foods made from plant-based proteins like soy and pea, processed using traditional Japanese fermentation techniques.

■ Lineup (¥598 each, tax incl.)
1. HAKKO PROTEIN BAR (Miso Caramel / Amazake Vanilla / Soy Sauce Chocolate)
2. HAKKO PROTEIN SOUP (Soy Milk Miso / Fermented Tomato)
3. HAKKO PROTEIN GRANOLA (Koji Granola)

■ Technical Features
・Proprietary "Double Fermentation Method" improves protein absorption by 40%
・Rich in fermentation-derived amino acids for natural umami flavor
・No preservatives or artificial sweeteners`,
    companyId: "umamilab",
    categoryId: "food",
    regions: ["na", "asia"],
    publishedAt: "2026-03-10",
  },
  {
    id: "4",
    title: "ステージワン、世界初のフルXRライブ施設を東京・お台場にオープン",
    titleEn: "StageOne Opens World's First Full-XR Live Entertainment Venue in Tokyo",
    summary: "最大500名収容のXR専用ライブ施設が4月グランドオープン。現実と仮想が融合する新体験を提供。",
    summaryEn: "A 500-capacity XR-dedicated live venue opens in April, blending reality and virtual worlds.",
    body: `ステージワン株式会社（本社：東京都港区、代表取締役：鈴木一郎）は、世界初となるフルXRライブエンターテインメント施設「STAGE ONE TOKYO」を2026年4月15日にグランドオープンいたします。

■ 施設概要
・名称：STAGE ONE TOKYO
・所在地：東京都江東区青海
・延床面積：約3,000平方メートル
・最大収容人数：500名
・投資総額：約50億円

■ 特徴
・Apple Vision ProおよびMeta Quest対応の専用XRコンテンツ
・300台以上のセンサーによるリアルタイムトラッキング
・観客の動きに反応するインタラクティブ演出
・遠隔地からのバーチャル参加も可能`,
    bodyEn: `StageOne Inc. (Headquarters: Minato-ku, Tokyo; CEO: Ichiro Suzuki) will open "STAGE ONE TOKYO," the world's first full-XR live entertainment venue, on April 15, 2026, in Odaiba, Tokyo.

■ Venue Overview
・Name: STAGE ONE TOKYO
・Location: Aomi, Koto-ku, Tokyo
・Floor area: Approx. 3,000 sqm
・Maximum capacity: 500
・Total investment: Approx. ¥5 billion

■ Key Features
・Dedicated XR content for Apple Vision Pro and Meta Quest
・Real-time tracking with 300+ sensors throughout the venue
・Interactive effects responding to audience movements
・Virtual attendance from remote locations`,
    companyId: "stageone",
    categoryId: "entertainment",
    regions: ["na", "eu", "asia", "kr"],
    publishedAt: "2026-03-09",
  },
  {
    id: "5",
    title: "メディウェル、AI皮膚疾患スクリーニングアプリ「SkinCheck」が医療機器認証を取得",
    titleEn: "MediWell's AI Skin Disease Screening App 'SkinCheck' Receives Medical Device Certification",
    summary: "スマホで撮影するだけで皮膚疾患の可能性を判定するAIアプリが、クラスII医療機器として認証。",
    summaryEn: "AI app that screens for skin diseases from smartphone photos certified as Class II medical device.",
    body: `メディウェル株式会社（本社：東京都千代田区、代表取締役：高橋美咲）は、AI搭載の皮膚疾患スクリーニングアプリ「SkinCheck」が厚生労働省よりクラスII医療機器としての認証を取得しました。

■ SkinCheckについて
スマートフォンのカメラで皮膚の気になる部位を撮影するだけで、AIが50種類以上の皮膚疾患の可能性をスクリーニング。

■ 技術的特徴
・100万枚以上の皮膚画像データで学習したAIモデル
・判定精度：感度92.3%、特異度89.7%
・撮影から結果表示まで約10秒
・近隣の皮膚科クリニックへのオンライン予約連携`,
    bodyEn: `MediWell Inc. (Headquarters: Chiyoda-ku, Tokyo; CEO: Misaki Takahashi) announces that its AI-powered skin disease screening app "SkinCheck" has received Class II medical device certification from Japan's Ministry of Health.

■ About SkinCheck
Simply photograph a skin area of concern using a smartphone camera, and the AI screens for over 50 types of skin diseases.

■ Technical Features
・AI model trained on over 1 million dermatological images
・Accuracy: 92.3% sensitivity, 89.7% specificity
・Results displayed within approx. 10 seconds
・Online booking integration with nearby dermatology clinics`,
    companyId: "mediwell",
    categoryId: "healthcare",
    regions: ["na", "eu", "asia"],
    publishedAt: "2026-03-08",
  },
  {
    id: "6",
    title: "テックビジョン、シリーズBラウンドで総額30億円の資金調達を完了",
    titleEn: "TechVision Closes ¥3 Billion Series B Funding Round",
    summary: "グローバル展開と研究開発の加速に向け、国内外の投資家から30億円を調達。企業価値は200億円に。",
    summaryEn: "Raises ¥3B from domestic and international investors for global expansion. Valuation reaches ¥20B.",
    body: `テックビジョン株式会社は、シリーズBラウンドにおいて総額30億円の資金調達を完了いたしました。

■ 調達概要
・調達総額：30億円
・引受先：グローバルVC Capital、東京イノベーションファンド他
・累計調達額：45億円

■ 資金使途
1. AutoFlow AIのグローバル展開（東南アジア・北米市場）
2. AI基盤技術の研究開発強化
3. エンジニア・セールス人材の採用（50名規模）`,
    bodyEn: `TechVision Inc. has completed a ¥3 billion Series B funding round.

■ Funding Summary
・Total raised: ¥3 billion
・Lead investors: Global VC Capital, Tokyo Innovation Fund, and others
・Cumulative funding: ¥4.5 billion

■ Use of Funds
1. Global expansion of AutoFlow AI (Southeast Asia & North America)
2. Strengthened R&D in core AI technology
3. Hiring of 50 engineers and sales professionals`,
    companyId: "techvision",
    categoryId: "finance",
    regions: ["na", "eu", "asia"],
    publishedAt: "2026-03-07",
  },
  {
    id: "7",
    title: "グリーンファクトリー、自動車メーカー3社と廃バッテリーリサイクル事業で業務提携",
    titleEn: "Green Factory Partners with 3 Automakers on EV Battery Recycling",
    summary: "EV用リチウムイオン電池のリサイクル技術を活用し、希少金属の回収率95%以上を実現。",
    summaryEn: "Recycling technology achieves 95%+ recovery rate of rare metals from EV lithium-ion batteries.",
    body: `グリーンファクトリー株式会社は、大手自動車メーカー3社と、EV用リチウムイオン電池のリサイクル事業に関する業務提携契約を締結いたしました。

■ 事業概要
・使用済みEVバッテリーの回収・解体・リサイクル
・リチウム、コバルト、ニッケル等の希少金属回収（回収率95%以上）
・回収した金属を新品バッテリー原料として再利用

■ 事業規模
・初期投資額：約100億円（3社共同出資）
・2027年度の処理能力：年間10万台分
・2030年度の売上目標：500億円`,
    bodyEn: `Green Factory Co., Ltd. has signed a business alliance agreement with three major automakers for EV lithium-ion battery recycling.

■ Business Overview
・Collection, dismantling, and recycling of used EV batteries
・Recovery of rare metals including lithium, cobalt, and nickel (95%+ recovery rate)
・Recovered metals reused as raw materials for new batteries

■ Scale
・Initial investment: Approx. ¥10 billion (joint investment)
・2027 processing capacity: 100,000 vehicles per year
・2030 sales target: ¥50 billion`,
    companyId: "greenfactory",
    categoryId: "manufacturing",
    regions: ["na", "eu"],
    publishedAt: "2026-03-06",
  },
  {
    id: "8",
    title: "ステージワン、韓国最大手エンタメ企業と戦略的パートナーシップを締結",
    titleEn: "StageOne Signs Strategic Partnership with Korea's Largest Entertainment Company",
    summary: "K-POPアーティストのXRコンテンツ制作で協業。日韓同時配信のバーチャルライブを2026年夏に開催予定。",
    summaryEn: "Collaboration on K-POP XR content. Joint Japan-Korea virtual live event planned for summer 2026.",
    body: `ステージワン株式会社は、韓国最大手エンタメ企業StarLight Entertainment Co., Ltd.と戦略的パートナーシップ契約を締結しました。

■ パートナーシップ概要
・K-POPアーティストのXRライブコンテンツ共同制作
・日韓同時配信プラットフォームの構築
・XR技術のライセンス供与と共同開発`,
    bodyEn: `StageOne Inc. has signed a strategic partnership with South Korea's largest entertainment company, StarLight Entertainment Co., Ltd.

■ Partnership Overview
・Joint production of K-POP artist XR live content
・Building a Japan-Korea simultaneous streaming platform
・XR technology licensing and co-development`,
    companyId: "stageone",
    categoryId: "entertainment",
    regions: ["kr", "asia"],
    publishedAt: "2026-03-05",
  },
  {
    id: "9",
    title: "うまみラボ、東京大学と「発酵AIプロジェクト」を共同研究開始",
    titleEn: "Umami Lab and University of Tokyo Launch Joint 'Fermentation AI Project'",
    summary: "AIを活用した発酵プロセスの最適化研究を開始。開発期間を従来の1/10に短縮する技術を目指す。",
    summaryEn: "AI-driven fermentation optimization research aims to cut new product development time by 90%.",
    body: `うまみラボ株式会社は、東京大学大学院農学生命科学研究科と、AIを活用した発酵プロセスの最適化に関する共同研究を開始しました。

■ 研究概要
・プロジェクト名：発酵AIプロジェクト
・研究期間：2026年4月〜2029年3月（3年間）
・研究費総額：約5億円`,
    bodyEn: `Umami Lab Inc. has begun joint research with the University of Tokyo's Graduate School of Agricultural and Life Sciences on AI-powered fermentation process optimization.

■ Research Overview
・Project name: Fermentation AI Project
・Period: April 2026 – March 2029 (3 years)
・Total budget: Approx. ¥500 million`,
    companyId: "umamilab",
    categoryId: "it",
    regions: ["na", "eu"],
    publishedAt: "2026-03-04",
  },
  {
    id: "10",
    title: "メディウェル、全国500の調剤薬局とオンライン服薬指導ネットワークを構築",
    titleEn: "MediWell Builds Online Medication Guidance Network with 500 Pharmacies Nationwide",
    summary: "オンライン診療後の服薬指導をシームレスに連携するネットワークを全国展開。",
    summaryEn: "Nationwide network seamlessly connects online consultations with pharmacy medication guidance.",
    body: `メディウェル株式会社は、全国500の調剤薬局と提携し、オンライン服薬指導ネットワーク「MediConnect Pharmacy」の本格運用を開始しました。

■ 特徴
・オンライン診療から服薬指導まで、アプリ内でワンストップ完結
・処方薬は最短当日に自宅へ配送
・AIによる飲み合わせチェック機能`,
    bodyEn: `MediWell Inc. has launched full-scale operations of "MediConnect Pharmacy," an online medication guidance network partnering with 500 pharmacies across Japan.

■ Key Features
・One-stop experience from online consultation to medication guidance within the app
・Same-day prescription delivery to home
・AI-powered drug interaction checking`,
    companyId: "mediwell",
    categoryId: "healthcare",
    regions: ["na", "asia"],
    publishedAt: "2026-03-03",
  },
];
