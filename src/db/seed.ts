import "dotenv/config";

import { eq } from "drizzle-orm";

import { client, db } from "./index";
import { docFromPlainText } from "../lib/content";
import {
  adSlots,
  aiModels,
  aiProviders,
  articleRevisions,
  articles,
  categories,
  columnists,
  glossaryTerms,
  promptTemplates,
  settings,
  translationProfiles,
  users,
} from "./schema";

const categorySeed = [
  {
    slug: "samachar",
    nameNp: "समाचार",
    nameEn: "News",
    kind: "NEWS" as const,
    sortOrder: 1,
  },
  {
    slug: "artha-banking",
    nameNp: "अर्थ र बैंकिङ",
    nameEn: "Economy & Banking",
    kind: "NEWS" as const,
    sortOrder: 2,
  },
  {
    slug: "kanun-visa",
    nameNp: "कानुन र भिसा",
    nameEn: "Law & Visa",
    kind: "NEWS" as const,
    sortOrder: 3,
  },
  {
    slug: "samudaya",
    nameNp: "समुदाय",
    nameEn: "Community",
    kind: "NEWS" as const,
    sortOrder: 4,
  },
  {
    slug: "shram-samaj",
    nameNp: "श्रम र समाज",
    nameEn: "Labour & Society",
    kind: "NEWS" as const,
    sortOrder: 5,
  },
  {
    slug: "vichar",
    nameNp: "विचार",
    nameEn: "Opinion",
    kind: "OPINION" as const,
    sortOrder: 6,
  },
  {
    slug: "nepal",
    nameNp: "नेपाल",
    nameEn: "Nepal",
    kind: "NEPAL" as const,
    sortOrder: 7,
    isActive: false,
  },
];

async function seedUser(email: string, role: "SUPER_ADMIN" | "ADMIN") {
  const [created] = await db
    .insert(users)
    .values({
      email,
      name: email.split("@")[0],
      role,
    })
    .onConflictDoNothing({ target: users.email })
    .returning();

  if (created) return created;

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!existing) {
    throw new Error(`Could not seed user ${email}`);
  }

  return existing;
}

function sampleBody() {
  return {
    type: "doc" as const,
    content: [
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "चौतारी.dk ले डेनमार्कमा रहेका नेपाली समुदायका लागि नयाँ डिजिटल संस्करण सुरु गरेको छ। अब समाचार, विचार र समुदायका गतिविधि एकै ठाउँबाट, छिटो र स्पष्ट रूपमा पढ्न सकिनेछ।",
          },
        ],
      },
      {
        type: "heading",
        attrs: { level: 2 },
        content: [{ type: "text", text: "के फेरियो?" }],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "सम्पादकीय टोलीले हरेक समाचारलाई स्रोत, सन्दर्भ र नेपाली पाठकको आवश्यकताअनुसार तयार पार्नेछ। डेनमार्कको नीति, अध्यागमन, रोजगारी, भाषा र सामुदायिक जीवनसँग जोडिएका विषयमा निरन्तर अपडेट पाइनेछ।",
          },
        ],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "यो पहिलो परीक्षण संस्करण हो। पाठकको सुझाव, सुधार र विषयगत जिज्ञासा स्वागत छ। हामीलाई editorial@chautari.dk मा लेख्नुहोस्।",
          },
        ],
      },
    ],
  };
}

async function seedPublishedSample(input: {
  slug: string;
  title: string;
  dek: string;
  body: string;
  categorySlug: string;
  kind: "NEWS" | "OPINION";
  publishedAt: Date;
  authorId: string;
  columnistId?: string | null;
}) {
  const category = await db.query.categories.findFirst({
    where: eq(categories.slug, input.categorySlug),
  });

  const [article] = await db
    .insert(articles)
    .values({
      slug: input.slug,
      categoryId: category?.id ?? null,
      kind: input.kind,
      status: "PUBLISHED",
      title: input.title,
      dek: input.dek,
      body: docFromPlainText(input.body),
      authorId: input.authorId,
      editorId: input.authorId,
      columnistId: input.columnistId ?? null,
      publishedAt: input.publishedAt,
      firstPublishedAt: input.publishedAt,
      rightsStatus: "ORIGINAL",
      seoTitle: input.title,
      seoDescription: input.dek,
    })
    .onConflictDoNothing({ target: articles.slug })
    .returning();

  if (article) {
    await db.insert(articleRevisions).values({
      articleId: article.id,
      revisionNo: 1,
      categoryId: article.categoryId,
      kind: article.kind,
      title: article.title,
      dek: article.dek,
      body: article.body,
      columnistId: article.columnistId,
      sourceId: article.sourceId,
      heroMediaId: article.heroMediaId,
      seoTitle: article.seoTitle,
      seoDescription: article.seoDescription,
      canonicalUrl: article.canonicalUrl,
      rightsStatus: article.rightsStatus,
      allowComments: article.allowComments,
      changeReason: "Local development sample",
      createdById: input.authorId,
      approvedById: input.authorId,
      status: "PUBLISHED",
      version: 1,
      publishedAt: article.publishedAt,
      approvedAt: article.publishedAt,
      updatedAt: article.updatedAt,
    });
  }
}

async function main() {
  console.log("Seeding Chautari database...");

  const seedSampleContent =
    process.env.NODE_ENV !== "production" ||
    process.env.SEED_SAMPLE_CONTENT === "true";

  for (const category of categorySeed) {
    await db
      .insert(categories)
      .values(category)
      .onConflictDoNothing({ target: categories.slug });
  }

  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@example.com")
    .trim()
    .toLowerCase();
  const admin = await seedUser(adminEmail, "SUPER_ADMIN");

  const editorEmail = (process.env.SEED_EDITOR_EMAIL || "")
    .trim()
    .toLowerCase();
  if (editorEmail) {
    await seedUser(editorEmail, "ADMIN");
  } else if (process.env.NODE_ENV !== "production") {
    await seedUser("editor@example.com", "ADMIN");
  }

  const [provider] = await db
    .insert(aiProviders)
    .values({
      slug: "google",
      name: "Google Gemini",
      baseUrl: "https://generativelanguage.googleapis.com",
    })
    .onConflictDoNothing({ target: aiProviders.slug })
    .returning();

  const googleProvider =
    provider ??
    (await db.query.aiProviders.findFirst({
      where: eq(aiProviders.slug, "google"),
    }));

  if (googleProvider) {
    await db
      .insert(aiModels)
      .values({
        providerId: googleProvider.id,
        name: "Gemini 2.5 Flash",
        modelId: "gemini-2.5-flash",
        isDefault: true,
        config: { temperature: 0.2, maxOutputTokens: 8192 },
      })
      .onConflictDoNothing({
        target: [aiModels.providerId, aiModels.modelId],
      });
  }

  for (const slot of [
    {
      key: "home-leaderboard",
      name: "गृहपृष्ठ लिडरबोर्ड",
      placement: "home.leaderboard",
    },
    {
      key: "article-inline",
      name: "लेखभित्रको विज्ञापन",
      placement: "article.inline",
    },
    {
      key: "sidebar-box",
      name: "साइडबार बक्स",
      placement: "sidebar.box",
    },
  ]) {
    await db
      .insert(adSlots)
      .values(slot)
      .onConflictDoNothing({ target: adSlots.key });
  }

  await db
    .insert(translationProfiles)
    .values({
      name: "चौतारी समाचार शैली",
      styleGuide:
        "सरल, स्पष्ट र तथ्यपरक नेपाली। अंग्रेजी वा डेनिस शब्द आवश्यक भएमा कोष्ठकमा राख्नुहोस्। पाठकलाई सम्बोधन गर्दा 'तपाईं' प्रयोग गर्नुहोस्। शीर्षक छोटो र क्रियाशील राख्नुहोस्। डेनमार्कमा बस्ने नेपाली पाठकलाई के अर्थ राख्छ भन्ने कुरा डेक वा पहिलो २–३ अनुच्छेदमा स्वाभाविक रूपमा देखाउनुहोस्।",
      systemPrompt:
        "तपाईं चौतारी.dk का सम्पादक हुनुहुन्छ। डेनमार्कमा बस्ने नेपाली पाठकका लागि तथ्यपरक, उपयोगी नेपाली समाचार तयार गर्नुहोस्। स्रोतलाई शब्दशः अनुवाद नगरी सारांश, सन्दर्भ र छोटा उद्धरणमा रूपान्तरण गर्नुहोस्। हरेक समाचारमा नेपाली पाठकसँगको सान्दर्भिकता खोज्नुहोस्, तर स्रोतमा नभएको सम्बन्ध नबनाउनुहोस्।",
      isDefault: true,
    })
    .onConflictDoNothing({ target: translationProfiles.name });

  for (const term of [
    { sourceTerm: "Folketing", nepaliTerm: "डेनिस संसद (फोल्केटिङ)" },
    { sourceTerm: "CPR", nepaliTerm: "सीपीआर (नागरिक दर्ता नम्बर)" },
    { sourceTerm: "residence permit", nepaliTerm: "बसोबास अनुमति" },
    { sourceTerm: "permanent residence", nepaliTerm: "स्थायी बसोबास" },
  ]) {
    await db
      .insert(glossaryTerms)
      .values(term)
      .onConflictDoNothing({ target: glossaryTerms.sourceTerm });
  }

  await db
    .insert(promptTemplates)
    .values({
      key: "translate-news",
      name: "समाचार अनुवाद र पुनर्लेखन",
      version: "2",
      template:
        "स्रोत सामग्री:\n{{source}}\n\nमाथिको सामग्रीबाट चौतारी.dk का लागि नेपाली समाचार मस्यौदा बनाउनुहोस्। नेपाली एंगल (डेनमार्कमा बस्ने नेपाली पाठकका लागि सान्दर्भिकता) डेक र मुख्य पाठमा स्वाभाविक रूपमा समावेश गर्नुहोस्। शीर्षक, डेक, मुख्य पाठ, SEO शीर्षक, SEO विवरण र अंग्रेजी back-translation फर्काउनुहोस्।",
    })
    .onConflictDoNothing({ target: promptTemplates.key });

  for (const setting of [
    { key: "site.title", value: "चौतारी डट डिके" },
    {
      key: "site.tagline",
      value: "डेनमार्कका नेपालीहरूको साझा डिजिटल चौतारी",
    },
    {
      key: "features",
      value: { nepal: false, bahas: false, newsletter: false, comments: false },
    },
  ]) {
    await db
      .insert(settings)
      .values({ key: setting.key, value: setting.value })
      .onConflictDoNothing({ target: settings.key });
  }

  const kanunCategory = await db.query.categories.findFirst({
    where: eq(categories.slug, "kanun-visa"),
  });

  if (seedSampleContent && kanunCategory) {
    const [sample] = await db
      .insert(articles)
      .values({
        slug: "chautari-new-digital-edition",
        categoryId: kanunCategory.id,
        kind: "NEWS",
        status: "PUBLISHED",
        title: "चौतारी.dk को नयाँ डिजिटल संस्करण सुरु",
        dek: "डेनमार्कका नेपाली पाठकका लागि छिटो, भरपर्दो र नेपाली भाषाको समाचार मञ्च।",
        body: sampleBody(),
        authorId: admin.id,
        editorId: admin.id,
        publishedAt: new Date(),
        firstPublishedAt: new Date(),
        rightsStatus: "ORIGINAL",
        seoTitle: "चौतारी.dk को नयाँ डिजिटल संस्करण सुरु",
        seoDescription:
          "डेनमार्कमा रहेका नेपाली समुदायका लागि चौतारी.dk को नयाँ डिजिटल संस्करण सुरु भएको छ।",
      })
      .onConflictDoNothing({ target: articles.slug })
      .returning();

    if (sample) {
      await db.insert(articleRevisions).values({
        articleId: sample.id,
        revisionNo: 1,
        categoryId: sample.categoryId,
        kind: sample.kind,
        title: sample.title,
        dek: sample.dek,
        body: sample.body,
        columnistId: sample.columnistId,
        sourceId: sample.sourceId,
        heroMediaId: sample.heroMediaId,
        seoTitle: sample.seoTitle,
        seoDescription: sample.seoDescription,
        canonicalUrl: sample.canonicalUrl,
        rightsStatus: sample.rightsStatus,
        allowComments: sample.allowComments,
        changeReason: "Initial seed article",
        createdById: admin.id,
        approvedById: admin.id,
        status: "PUBLISHED",
        version: 1,
        publishedAt: sample.publishedAt,
        approvedAt: sample.publishedAt,
        updatedAt: sample.updatedAt,
      });
    }
  }

  if (seedSampleContent) {
    const [columnist] = await db
      .insert(columnists)
      .values({
        slug: "sushila-adhikari",
        name: "सुशीला अधिकारी",
        bio: "कोपनहेगनमा बसोबास गर्ने लेखिका र सामुदायिक कार्यकर्ता।",
      })
      .onConflictDoNothing({ target: columnists.slug })
      .returning();

    const opinionColumnist =
      columnist ??
      (await db.query.columnists.findFirst({
        where: eq(columnists.slug, "sushila-adhikari"),
      }));

    const now = Date.now();
    const hoursAgo = (hours: number) => new Date(now - hours * 60 * 60 * 1000);

    await seedPublishedSample({
      slug: "danish-tax-card-foreign-workers",
      title: "डेनमार्कमा नयाँ कर नियम: विदेशी कामदारको कर कार्डमा के फेरियो?",
      dek: "स्कट्रयाटमा लागू हुने नयाँ नियमले विदेशी कामदारको कर कार्ड र प्रतिवेदन प्रक्रियामा के फरक पार्छ?",
      categorySlug: "artha-banking",
      kind: "NEWS",
      publishedAt: hoursAgo(2),
      authorId: admin.id,
      body: `डेनमार्कको कर प्रशासनले विदेशी कामदारका लागि कर कार्ड र मासिक प्रतिवेदनसम्बन्धी नयाँ अभ्यास सुरु गरेको छ। यसले रोजगारदाता र कामदार दुवैको प्रक्रियामा केही परिवर्तन ल्याउनेछ।

## के फेरियो?

कर कार्डको विवरण रोजगारदाताले नियमित अद्यावधिक गर्नुपर्ने र कामदारको बैंक तथा ठेगाना विवरण मिल्नुपर्ने व्यवस्था थपिएको छ। गलत विवरण भएमा कर कटौतीमा ढिलाइ हुन सक्छ।

## कामदारले के गर्ने?

आफ्नो कर कार्डको प्रतिलिपि रोजगारदातासँग मिलाएर जाँच्नुहोस्। ठेगाना वा बैंक खाता परिवर्तन भएको छ भने सम्बन्धित निकायमा समयमै जानकारी दिनुहोस्।`,
    });

    await seedPublishedSample({
      slug: "denmark-nepal-remittance-30-billion",
      title: "डेनमार्कबाट नेपाल जाने रेमिट्यान्स ३० अर्ब नाघ्यो",
      dek: "वार्षिक रेमिट्यान्स बढे पनि स्थानान्तरण खर्च र विनिमय दरका कारण परिवारसम्म पुग्ने रकममा फरक पर्ने अवस्था छ।",
      categorySlug: "artha-banking",
      kind: "NEWS",
      publishedAt: hoursAgo(5),
      authorId: admin.id,
      body: `डेनमार्कबाट नेपाल पठाइने रेमिट्यान्सको वार्षिक रकम ३० अर्ब रुपैयाँ नाघेको छ। नेपाल राष्ट्र बैंकको पछिल्लो तथ्यांकअनुसार युरोपबाट हुने औपचारिक वित्तीय स्थानान्तरणमा वृद्धि भएको हो।

## खर्चको असर

रेमिट्यान्स सेवा शुल्क र विनिमय दर घटबढ हुँदा पठाइएको रकम र परिवारले पाउने रकममा फरक पर्छ। नियमित रूपमा पठाउनेले सेवा शुल्क तुलना गर्नु उपयोगी हुन्छ।

## वित्तीय साक्षरता

आफ्नो आम्दानीको केही भाग बचत, शिक्षा र दीर्घकालीन लगानीमा छुट्याउने अभ्यासले परिवारको वित्तीय सुरक्षामा सहयोग पुर्‍याउँछ।`,
    });

    await seedPublishedSample({
      slug: "copenhagen-chhath-festival-2026",
      title: "कोपनहेगनमा छठ पर्व: पाँच हजारभन्दा बढी नेपाली भेला हुने",
      dek: "आयोजकका अनुसार यस वर्षको छठ पर्वमा सहभागी संख्या बढ्ने र स्वयंसेवक व्यवस्थापनमा विशेष ध्यान दिइनेछ।",
      categorySlug: "samudaya",
      kind: "NEWS",
      publishedAt: hoursAgo(3),
      authorId: admin.id,
      body: `कोपनहेगनमा यस वर्षको छठ पर्व भव्य रूपमा मनाइने भएको छ। आयोजक समितिका अनुसार पाँच हजारभन्दा बढी नेपाली सहभागी हुने अनुमान छ।

## व्यवस्थापन

स्वयंसेवक, सुरक्षा, यातायात र प्रसाद वितरणका लागि छुट्टाछुट्टै समूह बनाइएको छ। सहभागीलाई सार्वजनिक यातायात प्रयोग गर्न र तोकिएको समयमा पुग्न आग्रह गरिएको छ।

## सांस्कृतिक महत्व

छठ पर्वले नेपाली समुदायबीच सामुदायिक एकता र सांस्कृतिक पहिचानलाई बलियो बनाउने आयोजकको विश्वास छ।`,
    });

    await seedPublishedSample({
      slug: "nepal-return-or-stay-young-professionals",
      title: "नेपाल फर्किने कि बस्ने? युवा नेपाली पेसाकर्मीको दोधार",
      dek: "डेनमार्कमा स्थिर जीवन बनाएकाहरू पनि नेपाल फर्किने योजना बुन्दै छन्। के भन्छ उनीहरूको अनुभव?",
      categorySlug: "shram-samaj",
      kind: "NEWS",
      publishedAt: hoursAgo(7),
      authorId: admin.id,
      body: `डेनमार्कमा वर्षौं काम गरेका युवा नेपाली पेसाकर्मी नेपाल फर्किने वा बस्ने भन्ने दोधारमा छन्। परिवार, करियर र सामाजिक सुरक्षा तीनवटै पक्षले यो निर्णयलाई जटिल बनाएको छ।

## निर्णयमा असर पार्ने कुरा

बालबच्चाको शिक्षा, आमाबाबुको हेरचाह, नेपालमा रोजगारीको अवसर र डेनमार्कको सामाजिक सुरक्षा प्रणाली मुख्य विषय बनेका छन्।

## दुवैतर्फको तयारी

धेरैले नेपालमा लगानी वा व्यवसाय सुरु गर्ने योजना बनाए पनि डेनमार्कको नागरिकता वा बसोबास अधिकार भने त्यागेका छैनन्।`,
    });

    await seedPublishedSample({
      slug: "language-is-not-only-grammar",
      title: "भाषा सिक्नु मात्र होइन, आफ्नो आवाज बनाउनु पनि हो",
      dek: "डेनिस भाषा सिक्दा व्याकरणभन्दा पनि आत्मविश्वास र सहभागिता किन महत्त्वपूर्ण हुन्छ।",
      categorySlug: "vichar",
      kind: "OPINION",
      publishedAt: hoursAgo(6),
      authorId: admin.id,
      columnistId: opinionColumnist?.id ?? null,
      body: `डेनमार्कमा बस्ने धेरै नेपालीका लागि डेनिस भाषा सिक्नु एउटा परीक्षा जस्तो बनेको छ। तर भाषा केवल परीक्षा पास गर्ने साधन होइन; यो आफ्नो आवाज बनाउने माध्यम पनि हो।

## व्याकरणभन्दा संवाद

किताबी व्याकरण महत्त्वपूर्ण छ, तर दैनिक संवादबिना भाषा जीवित हुँदैन। गल्ती गर्ने डरले मानिस चुप बस्न थाल्छ, अनि अवसर पनि कम हुँदै जान्छ।

## सामुदायिक सहयोग

भाषा सिकाइका लागि सुरक्षित समूह चाहिन्छ। त्यस्तो समूहमा गल्ती गर्दा हाँसोको पात्र होइन, सिकाइको अवसर बनाइनुपर्छ।`,
    });

    await seedPublishedSample({
      slug: "nepali-identity-second-generation",
      title: "डेनमार्कमा नेपाली पहिचान: दोस्रो पुस्ताको सवाल",
      dek: "दोस्रो पुस्ताले नेपाली र डेनिस दुवै पहिचान कसरी सन्तुलन गर्दै छ? अभिभावक र समुदायको भूमिका।",
      categorySlug: "vichar",
      kind: "OPINION",
      publishedAt: hoursAgo(26),
      authorId: admin.id,
      columnistId: opinionColumnist?.id ?? null,
      body: `डेनमार्कमा जन्मिएका वा सानैमा आएका नेपाली बालबालिकाको पहिचान एउटै पुस्ताको अनुभवभन्दा फरक छ। उनीहरूका लागि नेपाली भाषा, संस्कृति र डेनिस जीवनशैली सँगसँगै चल्छन्।

## दुवै पहिचानको ठाउँ

एउटा पहिचान रोज्दा अर्को त्याग्नुपर्छ भन्ने मान्यता सही होइन। भाषा र संस्कृतिलाई घरभित्र जीवित राख्ने, तर बाहिरको समाजमा पनि पूर्ण सहभागी हुने वातावरण बनाउन सकिन्छ।

## अभिभावकको भूमिका

अभिभावकले नेपाली भाषा बोल्न प्रोत्साहन गर्ने, सामुदायिक कार्यक्रममा सहभागी गराउने र प्रश्न सोध्न खुला वातावरण दिने हो भने दोस्रो पुस्ताले आफ्नो पहिचानलाई बोझ होइन, शक्ति मान्न सक्छ।`,
    });
  }

  console.log("Seed complete.");
}

main()
  .then(async () => {
    await client.end();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error(error);
    await client.end();
    process.exit(1);
  });
