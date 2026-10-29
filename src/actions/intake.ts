"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db";
import {
  aiUsageLogs,
  articleRevisions,
  articles,
  sources,
} from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { generateNepaliDraft } from "@/lib/ai/draft";
import { requireAdmin } from "@/lib/authz";
import { docFromPlainText } from "@/lib/content";
import {
  ensureUniqueArticleSlug,
  getOpenRevision,
  getSourceById,
  revisionContentFromArticle,
} from "@/lib/revisions";
import { extractSourceFromUrl } from "@/lib/source-extract";

export type IntakeFormState = {
  error?: string;
  success?: string;
};

const optionalText = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().optional(),
);

const rightsEnum = z.enum([
  "ORIGINAL",
  "LICENSED",
  "PERMISSION_GRANTED",
  "FAIR_USE_SUMMARY",
  "UNKNOWN",
]);

const commonFields = {
  categoryId: optionalText,
  kind: z.enum(["NEWS", "OPINION", "NEPAL"]).default("NEWS"),
  rightsStatus: rightsEnum.default("FAIR_USE_SUMMARY"),
  instruction: optionalText,
};

const urlIntakeSchema = z.object({
  url: z.string().trim().url("मान्य स्रोत लिङ्क राख्नुहोस्।"),
  sourcePublisher: optionalText,
  sourceLanguage: optionalText,
  ...commonFields,
});

const textIntakeSchema = z.object({
  sourceText: z
    .string()
    .trim()
    .min(80, "स्रोत पाठ कम्तीमा ८० अक्षरको हुनुपर्छ।"),
  sourceUrl: optionalText,
  sourcePublisher: optionalText,
  sourceOriginalTitle: optionalText,
  sourceLanguage: optionalText,
  ...commonFields,
});

const repromptSchema = z.object({
  articleId: z.string().min(1),
  revisionId: z.string().min(1),
  version: z.coerce.number().int().min(1),
  instruction: z.string().trim().min(3, "पुनः तयार गर्न निर्देशन लेख्नुहोस्।"),
});

function revalidateArticlePaths(articleId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/stories");
  revalidatePath("/admin/review");
  revalidatePath(`/admin/stories/${articleId}`);
  revalidatePath(`/admin/stories/${articleId}/preview`);
}

async function createAiArticle(input: {
  actorId: string;
  slugSource: string;
  categoryId?: string;
  kind: "NEWS" | "OPINION" | "NEPAL";
  rightsStatus: z.infer<typeof rightsEnum>;
  source: {
    url: string | null;
    publisher: string | null;
    originalTitle: string | null;
    language: string | null;
    publishedAt: Date | null;
    rawText: string;
    fetchedAt: Date | null;
  };
  generated: Awaited<ReturnType<typeof generateNepaliDraft>>;
  operation: string;
  changeReason: string;
}) {
  const slug = await ensureUniqueArticleSlug(input.slugSource);
  const generated = input.generated;
  const body = docFromPlainText(generated.bodyText);

  const result = await db.transaction(async (tx) => {
    const [source] = await tx
      .insert(sources)
      .values({
        url: input.source.url,
        publisher: input.source.publisher,
        originalTitle: input.source.originalTitle,
        language: input.source.language,
        originalPublishedAt: input.source.publishedAt,
        rawText: input.source.rawText,
        fetchedAt: input.source.fetchedAt,
        rightsStatus: input.rightsStatus,
        createdById: input.actorId,
      })
      .returning();

    const [article] = await tx
      .insert(articles)
      .values({
        slug,
        categoryId: input.categoryId ?? null,
        kind: input.kind,
        status: "DRAFT",
        title: generated.title,
        dek: generated.dek,
        body,
        authorId: input.actorId,
        editorId: input.actorId,
        sourceId: source?.id ?? null,
        rightsStatus: input.rightsStatus,
        seoTitle: generated.seoTitle,
        seoDescription: generated.seoDescription,
      })
      .returning();

    if (!article) return null;

    const [revision] = await tx
      .insert(articleRevisions)
      .values({
        articleId: article.id,
        revisionNo: 1,
        ...revisionContentFromArticle(article),
        changeReason: input.changeReason,
        createdById: input.actorId,
        aiModelId: generated.modelRowId,
        promptVersion: generated.promptVersion,
        tokenInput: generated.tokenInput,
        tokenOutput: generated.tokenOutput,
        backTranslation: generated.backTranslation,
        status: "DRAFT",
        version: 1,
      })
      .returning();

    await tx.insert(aiUsageLogs).values({
      modelId: generated.modelRowId,
      articleId: article.id,
      userId: input.actorId,
      operation: input.operation,
      tokenInput: generated.tokenInput,
      tokenOutput: generated.tokenOutput,
    });

    return { article, revision };
  });

  return result;
}

export async function createDraftFromUrl(
  _previousState: IntakeFormState,
  formData: FormData,
): Promise<IntakeFormState> {
  const user = await requireAdmin();
  const parsed = urlIntakeSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "फारम जाँच गर्नुहोस्।",
    };
  }

  const data = parsed.data;
  let createdArticleId: string | null = null;

  try {
    const extracted = await extractSourceFromUrl(data.url);
    const generated = await generateNepaliDraft({
      source: {
        url: extracted.url,
        publisher: data.sourcePublisher ?? extracted.publisher,
        originalTitle: extracted.title,
        language: data.sourceLanguage ?? extracted.language,
        text: extracted.text,
      },
      extraInstruction: data.instruction,
    });

    const result = await createAiArticle({
      actorId: user.id,
      slugSource: generated.title,
      categoryId: data.categoryId,
      kind: data.kind,
      rightsStatus: data.rightsStatus,
      source: {
        url: extracted.url,
        publisher: data.sourcePublisher ?? extracted.publisher,
        originalTitle: extracted.title,
        language: data.sourceLanguage ?? extracted.language,
        publishedAt: extracted.publishedAt,
        rawText: extracted.text,
        fetchedAt: new Date(),
      },
      generated,
      operation: "translate_url",
      changeReason: "AI draft from source URL",
    });

    if (!result) {
      return { error: "मस्यौदा सुरु गर्न सकिएन। फेरि प्रयास गर्नुहोस्।" };
    }

    await writeAudit({
      actorId: user.id,
      action: "article.ai_generate",
      entityType: "article",
      entityId: result.article.id,
      metadata: {
        operation: "translate_url",
        sourceUrl: extracted.url,
        model: generated.modelName,
        modelId: generated.modelId,
        promptVersion: generated.promptVersion,
        tokenInput: generated.tokenInput,
        tokenOutput: generated.tokenOutput,
        revisionId: result.revision?.id ?? null,
      },
    });

    revalidateArticlePaths(result.article.id);
    createdArticleId = result.article.id;
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "स्रोत ल्याउँदा वा एआई मस्यौदा बनाउँदा समस्या आयो।",
    };
  }

  if (!createdArticleId) {
    return { error: "मस्यौदा सुरु गर्न सकिएन। फेरि प्रयास गर्नुहोस्।" };
  }

  redirect(`/admin/stories/${createdArticleId}?ai=1`);
}

export async function createDraftFromText(
  _previousState: IntakeFormState,
  formData: FormData,
): Promise<IntakeFormState> {
  const user = await requireAdmin();
  const parsed = textIntakeSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "फारम जाँच गर्नुहोस्।",
    };
  }

  const data = parsed.data;
  let createdArticleId: string | null = null;

  try {
    const generated = await generateNepaliDraft({
      source: {
        url: data.sourceUrl ?? null,
        publisher: data.sourcePublisher ?? null,
        originalTitle: data.sourceOriginalTitle ?? null,
        language: data.sourceLanguage ?? null,
        text: data.sourceText,
      },
      extraInstruction: data.instruction,
    });

    const result = await createAiArticle({
      actorId: user.id,
      slugSource: generated.title,
      categoryId: data.categoryId,
      kind: data.kind,
      rightsStatus: data.rightsStatus,
      source: {
        url: data.sourceUrl ?? null,
        publisher: data.sourcePublisher ?? null,
        originalTitle: data.sourceOriginalTitle ?? null,
        language: data.sourceLanguage ?? null,
        publishedAt: null,
        rawText: data.sourceText,
        fetchedAt: null,
      },
      generated,
      operation: "translate_pasted_text",
      changeReason: "AI draft from pasted source text",
    });

    if (!result) {
      return { error: "मस्यौदा सुरु गर्न सकिएन। फेरि प्रयास गर्नुहोस्।" };
    }

    await writeAudit({
      actorId: user.id,
      action: "article.ai_generate",
      entityType: "article",
      entityId: result.article.id,
      metadata: {
        operation: "translate_pasted_text",
        sourceUrl: data.sourceUrl ?? null,
        model: generated.modelName,
        modelId: generated.modelId,
        promptVersion: generated.promptVersion,
        tokenInput: generated.tokenInput,
        tokenOutput: generated.tokenOutput,
        revisionId: result.revision?.id ?? null,
      },
    });

    revalidateArticlePaths(result.article.id);
    createdArticleId = result.article.id;
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "एआई मस्यौदा बनाउँदा समस्या आयो।",
    };
  }

  if (!createdArticleId) {
    return { error: "मस्यौदा सुरु गर्न सकिएन। फेरि प्रयास गर्नुहोस्।" };
  }

  redirect(`/admin/stories/${createdArticleId}?ai=1`);
}

export async function repromptArticle(
  _previousState: IntakeFormState,
  formData: FormData,
): Promise<IntakeFormState> {
  const user = await requireAdmin();
  const parsed = repromptSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "फारम जाँच गर्नुहोस्।",
    };
  }

  const data = parsed.data;
  const [article, revision] = await Promise.all([
    db.query.articles.findFirst({ where: eq(articles.id, data.articleId) }),
    db.query.articleRevisions.findFirst({
      where: and(
        eq(articleRevisions.id, data.revisionId),
        eq(articleRevisions.articleId, data.articleId),
      ),
    }),
  ]);

  if (!article || !revision) {
    return { error: "लेख वा मस्यौदा भेटिएन।" };
  }

  if (revision.version !== data.version) {
    return {
      error:
        "यो मस्यौदा अर्को सम्पादकले परिवर्तन गरिसकेको छ। पृष्ठ पुनः लोड गर्नुहोस्।",
    };
  }

  const openRevision = await getOpenRevision(article.id);
  if (!openRevision || openRevision.id !== revision.id) {
    return { error: "यो मस्यौदा अब खुला छैन।" };
  }

  const source = await getSourceById(revision.sourceId ?? article.sourceId);
  if (!source?.rawText) {
    return {
      error:
        "यो मस्यौदाको स्रोत पाठ सुरक्षित छैन। पुनः तयार गर्न सकिँदैन; म्यानुअल सम्पादन गर्नुहोस्।",
    };
  }

  try {
    const generated = await generateNepaliDraft({
      source: {
        url: source.url,
        publisher: source.publisher,
        originalTitle: source.originalTitle,
        language: source.language,
        text: source.rawText,
      },
      extraInstruction: data.instruction,
    });

    const body = docFromPlainText(generated.bodyText);

    const updated = await db.transaction(async (tx) => {
      const [row] = await tx
        .update(articleRevisions)
        .set({
          title: generated.title,
          dek: generated.dek,
          body,
          seoTitle: generated.seoTitle,
          seoDescription: generated.seoDescription,
          aiModelId: generated.modelRowId,
          promptVersion: generated.promptVersion,
          tokenInput: generated.tokenInput,
          tokenOutput: generated.tokenOutput,
          backTranslation: generated.backTranslation,
          status: "DRAFT",
          version: revision.version + 1,
          changeReason: "AI reprompt",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(articleRevisions.id, revision.id),
            eq(articleRevisions.version, data.version),
          ),
        )
        .returning();

      if (!row) return null;

      await tx.insert(aiUsageLogs).values({
        modelId: generated.modelRowId,
        articleId: article.id,
        userId: user.id,
        operation: "reprompt",
        tokenInput: generated.tokenInput,
        tokenOutput: generated.tokenOutput,
      });

      return row;
    });

    if (!updated) {
      return {
        error:
          "यो मस्यौदा अर्को सम्पादकले परिवर्तन गरिसकेको छ। पृष्ठ पुनः लोड गर्नुहोस्।",
      };
    }

    await writeAudit({
      actorId: user.id,
      action: "article.ai_reprompt",
      entityType: "article",
      entityId: article.id,
      metadata: {
        revisionId: revision.id,
        model: generated.modelName,
        modelId: generated.modelId,
        promptVersion: generated.promptVersion,
        tokenInput: generated.tokenInput,
        tokenOutput: generated.tokenOutput,
        instruction: data.instruction,
      },
    });

    revalidateArticlePaths(article.id);
    return {
      success:
        "एआईले मस्यौदा पुनः तयार गर्‍यो। तथ्य, नाम र मिति फेरि जाँच्नुहोस्।",
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "पुनः तयार गर्दा समस्या आयो।",
    };
  }
}
