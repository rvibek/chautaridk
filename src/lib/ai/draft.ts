import { and, desc, eq } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

import { db } from "@/db";
import {
  aiModels,
  aiProviders,
  glossaryTerms,
  promptTemplates,
  translationProfiles,
} from "@/db/schema";
import { env } from "@/lib/env";

const MAX_SOURCE_CHARS = 28_000;

const generatedDraftSchema = z.object({
  title: z.string().trim().min(3),
  dek: z.string().trim().min(3),
  bodyText: z.string().trim().min(50),
  seoTitle: z.string().trim().min(3),
  seoDescription: z.string().trim().min(3),
  backTranslation: z.string().trim().min(20),
});

export type GeneratedDraft = z.infer<typeof generatedDraftSchema> & {
  modelId: string | null;
  modelName: string;
  modelRowId: string | null;
  promptVersion: string;
  tokenInput: number | null;
  tokenOutput: number | null;
};

export type SourceForAi = {
  url: string | null;
  publisher: string | null;
  originalTitle: string | null;
  language: string | null;
  text: string;
};

function stripCodeFence(value: string): string {
  const trimmed = value.trim();
  if (!trimmed.startsWith("```")) return trimmed;
  return trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

export async function generateNepaliDraft(input: {
  source: SourceForAi;
  extraInstruction?: string | null;
}): Promise<GeneratedDraft> {
  if (!env.GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY सेट छैन। .env मा कुञ्जी थपेर सर्भर पुनः सुरु गर्नुहोस्।",
    );
  }

  const [modelRow] = await db
    .select({
      id: aiModels.id,
      name: aiModels.name,
      modelId: aiModels.modelId,
      config: aiModels.config,
      providerName: aiProviders.name,
    })
    .from(aiModels)
    .innerJoin(aiProviders, eq(aiModels.providerId, aiProviders.id))
    .where(
      and(
        eq(aiModels.isActive, true),
        eq(aiProviders.isActive, true),
        eq(aiProviders.slug, "google"),
      ),
    )
    .orderBy(desc(aiModels.isDefault), aiModels.name)
    .limit(1);

  if (!modelRow) {
    throw new Error("सक्रिय एआई मोडेल भेटिएन। एडमिनमा मोडेल जाँच्नुहोस्।");
  }

  const [profile, glossary, template] = await Promise.all([
    db.query.translationProfiles.findFirst({
      where: eq(translationProfiles.isDefault, true),
    }),
    db.query.glossaryTerms.findMany({
      orderBy: [glossaryTerms.sourceTerm],
    }),
    db.query.promptTemplates.findFirst({
      where: and(
        eq(promptTemplates.key, "translate-news"),
        eq(promptTemplates.isActive, true),
      ),
    }),
  ]);

  const sourceText = input.source.text.slice(0, MAX_SOURCE_CHARS);
  const glossaryBlock =
    glossary.length > 0
      ? glossary
          .map(
            (term) =>
              `- ${term.sourceTerm} → ${term.nepaliTerm}${term.note ? ` (${term.note})` : ""}`,
          )
          .join("\n")
      : "- विशेष शब्दावली उपलब्ध छैन।";

  const templateText = (
    template?.template ??
    "स्रोत: {{source}}\n\nतलको सामग्रीलाई चौतारी.dk को शैलीमा नेपाली समाचार बनाउनुहोस्।"
  ).replace("{{source}}", sourceText);

  const systemInstruction = [
    profile?.systemPrompt ??
      "तपाईं चौतारी.dk का सम्पादक हुनुहुन्छ। स्रोत सामग्रीलाई शब्दशः अनुवाद नगरी, तथ्य जोगाउँदै, स्वतन्त्र नेपाली समाचारमा रूपान्तरण गर्नुहोस्।",
    `शैली निर्देशन:\n${profile?.styleGuide ?? "सरल, स्पष्ट र तथ्यपरक नेपाली।"}`,
    `शब्दावली:\n${glossaryBlock}`,
    [
      "चौतारी.dk को सम्पादकीय नियम:",
      "- पाठक डेनमार्कमा बस्ने नेपाली हुन्। स्रोत जुनसुकै देशको भए पनि उनीहरूसँगको सान्दर्भिकता स्पष्ट पार्नुहोस्।",
      "- स्रोतको पूरा लेख शब्दशः अनुवाद नगर्नुहोस्; सारांश, सन्दर्भ र छोटा उद्धरण प्रयोग गर्नुहोस्।",
      "- तथ्य, नाम, मिति, संख्या र उद्धरण परिवर्तन नगर्नुहोस्।",
      "- स्रोतमा नभएको तथ्य, उद्धरण वा नेपाल–डेनमार्क सम्बन्ध नबनाउनुहोस्।",
      "- शीर्षक छोटो, स्पष्ट र क्रियाशील राख्नुहोस्।",
      "- bodyText मा खाली लाइनले अनुच्छेद छुट्याउनुहोस्; उपशीर्षकका लागि '## ' प्रयोग गर्नुहोस्; सूचीका लागि '- ' प्रयोग गर्नुहोस्।",
      "- JSON बाहेक अरू केही नलेख्नुहोस्।",
    ].join("\n"),
    [
      "नेपाली एंगल (अनिवार्य):",
      "- हरेक समाचारले डेनमार्कमा बस्ने नेपाली पाठकका लागि के अर्थ राख्छ भन्ने कुरा डेक वा पहिलो २–३ अनुच्छेदमा स्वाभाविक रूपमा देखाउनुपर्छ।",
      "- सम्बन्धको आधार यीमध्ये जुनसुकै हुन सक्छ: डेनमार्कको नियम वा नीति, काम र भिसा, पढाइ, कर र जीवनयापन खर्च, परिवार, स्वास्थ्य, स्थानीय सेवा, नेपाल–डेनमार्क सम्बन्ध, वा नेपाली समुदायमा पर्ने व्यावहारिक असर।",
      "- नेपालमा भएको घटना भए, डेनमार्कमा बस्ने नेपाली वा उनीहरूका परिवारसँगको सान्दर्भिकता खोज्नुहोस्। अन्तर्राष्ट्रिय समाचार भए, नेपाल र डेनमार्कसँगको वास्तविक जोड देखाउनुहोस्।",
      "- प्रत्यक्ष सम्बन्ध नभए वा स्रोतले पर्याप्त आधार नदिएको भए एक वाक्यमा इमानदारीपूर्वक भन्नुहोस्; काल्पनिक वा जबरजस्ती सम्बन्ध नबनाउनुहोस्।",
      "- 'नेपाली एंगल' भन्ने अलग शीर्षक हरेक लेखमा अनिवार्य छैन। आवश्यक परेमा मात्र प्रयोग गर्नुहोस्; अन्यथा डेक र मुख्य पाठभित्रै मिसाउनुहोस्।",
      "- backTranslation मा 'Nepali angle: ...' भन्ने एक लाइन राख्नुहोस्। सम्बन्ध कमजोर वा अनुपलब्ध भए त्यो पनि स्पष्ट लेख्नुहोस्।",
    ].join("\n"),
  ]
    .filter(Boolean)
    .join("\n\n");

  const prompt = [
    `स्रोत विवरण:\nप्रकाशक: ${input.source.publisher ?? "अज्ञात"}\nमूल शीर्षक: ${input.source.originalTitle ?? "अज्ञात"}\nमूल भाषा: ${input.source.language ?? "अज्ञात"}\nमूल लिङ्क: ${input.source.url ?? "छैन"}`,
    templateText,
    input.extraInstruction
      ? `थप सम्पादकीय निर्देशन: ${input.extraInstruction}`
      : "",
    `आवश्यक JSON ढाँचा:\n${JSON.stringify(
      {
        title: "नेपाली शीर्षक",
        dek: "एक वा दुई वाक्यको सारांश, नेपाली एंगलसहित",
        bodyText: "मुख्य नेपाली पाठ",
        seoTitle: "SEO शीर्षक",
        seoDescription: "SEO विवरण",
        backTranslation:
          "English fact-check summary. Include a line starting with 'Nepali angle:'.",
      },
      null,
      2,
    )}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const modelName = env.GEMINI_MODEL ?? modelRow.modelId;
  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

  let response;
  try {
    response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
        responseJsonSchema: {
          type: "object",
          properties: {
            title: { type: "string" },
            dek: { type: "string" },
            bodyText: { type: "string" },
            seoTitle: { type: "string" },
            seoDescription: { type: "string" },
            backTranslation: { type: "string" },
          },
          required: [
            "title",
            "dek",
            "bodyText",
            "seoTitle",
            "seoDescription",
            "backTranslation",
          ],
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/api key not valid|api_key_invalid|invalid api key/i.test(message)) {
      throw new Error(
        "GEMINI_API_KEY अमान्य छ। .env मा सही Gemini API कुञ्जी राखेर सर्भर पुनः सुरु गर्नुहोस्।",
      );
    }
    if (/quota|rate limit|resource_exhausted|429/i.test(message)) {
      throw new Error(
        "Gemini API कोटा वा दर सीमा पुग्यो। केही बेरपछि फेरि प्रयास गर्नुहोस्।",
      );
    }
    throw new Error(
      "एआई सेवासँग जडान हुन सकेन। इन्टरनेट, API कुञ्जी र मोडेल जाँच्नुहोस्।",
    );
  }

  const raw = response.text;
  if (!raw) {
    throw new Error("एआईले खाली प्रतिक्रिया फर्कायो। फेरि प्रयास गर्नुहोस्।");
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(stripCodeFence(raw));
  } catch {
    throw new Error("एआईको प्रतिक्रिया JSON ढाँचामा थिएन। फेरि प्रयास गर्नुहोस्।");
  }

  const parsed = generatedDraftSchema.safeParse(parsedJson);
  if (!parsed.success) {
    throw new Error(
      "एआईले अपूर्ण मस्यौदा फर्कायो। फेरि प्रयास गर्नुहोस् वा सामग्री टाँस्नुहोस्।",
    );
  }

  return {
    ...parsed.data,
    modelId: modelName,
    modelName: modelRow.name,
    modelRowId: modelRow.id,
    promptVersion: template?.version ?? "1",
    tokenInput: response.usageMetadata?.promptTokenCount ?? null,
    tokenOutput: response.usageMetadata?.candidatesTokenCount ?? null,
  };
}
