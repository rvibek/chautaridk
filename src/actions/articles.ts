"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db";
import {
  articleRevisions,
  articles,
  sources,
} from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import { requireAdmin } from "@/lib/authz";
import { docFromPlainText } from "@/lib/content";
import {
  articlePatchFromRevision,
  ensureOpenRevision,
  ensureUniqueArticleSlug,
  getOpenRevision,
  OPEN_REVISION_STATUSES,
  revisionContentFromArticle,
} from "@/lib/revisions";

export type StoryFormState = {
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

const storySchema = z.object({
  title: z.string().trim().min(3, "शीर्षक कम्तीमा ३ अक्षरको हुनुपर्छ।"),
  slug: optionalText,
  categoryId: optionalText,
  kind: z.enum(["NEWS", "OPINION", "NEPAL"]).default("NEWS"),
  columnistId: optionalText,
  dek: optionalText,
  bodyText: z
    .string()
    .trim()
    .min(10, "लेखको मुख्य पाठ कम्तीमा १० अक्षरको हुनुपर्छ।"),
  seoTitle: optionalText,
  seoDescription: optionalText,
  canonicalUrl: optionalText,
  sourceUrl: optionalText,
  sourcePublisher: optionalText,
  sourceOriginalTitle: optionalText,
  sourceLanguage: optionalText,
  sourcePublishedAt: optionalText,
  rightsStatus: rightsEnum.default("ORIGINAL"),
});

const updateSchema = storySchema.extend({
  articleId: z.string().min(1),
  revisionId: z.string().min(1),
  version: z.coerce.number().int().min(1),
  changeReason: optionalText,
});

function parseSourceDate(value: string | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function createSourceIfNeeded(input: {
  sourceUrl?: string;
  sourcePublisher?: string;
  sourceOriginalTitle?: string;
  sourceLanguage?: string;
  sourcePublishedAt?: string;
  rightsStatus: z.infer<typeof rightsEnum>;
  userId: string;
}) {
  if (
    !input.sourceUrl &&
    !input.sourcePublisher &&
    !input.sourceOriginalTitle
  ) {
    return null;
  }

  const [source] = await db
    .insert(sources)
    .values({
      url: input.sourceUrl ?? null,
      publisher: input.sourcePublisher ?? null,
      originalTitle: input.sourceOriginalTitle ?? null,
      language: input.sourceLanguage ?? null,
      originalPublishedAt: parseSourceDate(input.sourcePublishedAt),
      rightsStatus: input.rightsStatus,
      createdById: input.userId,
    })
    .returning();

  return source ?? null;
}

function revalidateAdminArticle(articleId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/stories");
  revalidatePath("/admin/review");
  revalidatePath(`/admin/stories/${articleId}`);
  revalidatePath(`/admin/stories/${articleId}/preview`);
}

function revalidatePublicArticle(slug: string) {
  revalidatePath("/");
  revalidatePath("/samachar");
  revalidatePath("/vichar");
  revalidatePath(`/article/${slug}`);
}

export async function createDraft(
  _previousState: StoryFormState,
  formData: FormData,
): Promise<StoryFormState> {
  const user = await requireAdmin();
  const parsed = storySchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "फार्म जाँच गर्नुहोस्।",
    };
  }

  const data = parsed.data;
  const slug = await ensureUniqueArticleSlug(data.slug ?? data.title);
  const source = await createSourceIfNeeded({
    sourceUrl: data.sourceUrl,
    sourcePublisher: data.sourcePublisher,
    sourceOriginalTitle: data.sourceOriginalTitle,
    sourceLanguage: data.sourceLanguage,
    sourcePublishedAt: data.sourcePublishedAt,
    rightsStatus: data.rightsStatus,
    userId: user.id,
  });
  const body = docFromPlainText(data.bodyText);
  const columnistId = data.kind === "OPINION" ? data.columnistId ?? null : null;

  const article = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(articles)
      .values({
        slug,
        categoryId: data.categoryId ?? null,
        kind: data.kind,
        status: "DRAFT",
        title: data.title,
        dek: data.dek ?? null,
        body,
        authorId: user.id,
        editorId: user.id,
        columnistId,
        sourceId: source?.id ?? null,
        rightsStatus: data.rightsStatus,
        seoTitle: data.seoTitle ?? null,
        seoDescription: data.seoDescription ?? null,
        canonicalUrl: data.canonicalUrl ?? null,
      })
      .returning();

    if (!created) return null;

    await tx.insert(articleRevisions).values({
      articleId: created.id,
      revisionNo: 1,
      ...revisionContentFromArticle(created),
      changeReason: "Initial draft",
      createdById: user.id,
      status: "DRAFT",
      version: 1,
    });

    return created;
  });

  if (!article) {
    return { error: "मस्यौदा सुरु गर्न सकिएन। फेरि प्रयास गर्नुहोस्।" };
  }

  await writeAudit({
    actorId: user.id,
    action: "article.create",
    entityType: "article",
    entityId: article.id,
    metadata: {
      title: article.title,
      slug: article.slug,
      revisionNo: 1,
      source: "manual",
    },
  });

  revalidateAdminArticle(article.id);
  redirect(`/admin/stories/${article.id}`);
}

export async function updateArticle(
  _previousState: StoryFormState,
  formData: FormData,
): Promise<StoryFormState> {
  const user = await requireAdmin();
  const parsed = updateSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "फारम जाँच गर्नुहोस्।",
    };
  }

  const data = parsed.data;
  const current = await db.query.articles.findFirst({
    where: eq(articles.id, data.articleId),
  });

  if (!current) {
    return { error: "लेख भेटिएन।" };
  }

  if (
    current.status === "PUBLISHED" &&
    data.slug &&
    data.slug !== current.slug
  ) {
    return {
      error:
        "प्रकाशित लेखको URL स्लग यहाँबाट परिवर्तन गर्न मिल्दैन। पहिले लेख अनपब्लिश गर्नुहोस्।",
    };
  }

  const openRevision = await ensureOpenRevision(
    current,
    user.id,
    "Working draft opened",
  );

  if (!openRevision || openRevision.id !== data.revisionId) {
    return {
      error:
        "यो मस्यौदा अर्को सम्पादकले परिवर्तन गरिसकेको छ। पृष्ठ पुनः लोड गरेर फेरि प्रयास गर्नुहोस्।",
    };
  }

  if (openRevision.version !== data.version) {
    return {
      error:
        "यो मस्यौदा अर्को सम्पादकले परिवर्तन गरिसकेको छ। पृष्ठ पुनः लोड गरेर फेरि प्रयास गर्नुहोस्।",
    };
  }

  const slug =
    current.status === "PUBLISHED"
      ? current.slug
      : await ensureUniqueArticleSlug(data.slug ?? current.slug, current.id);
  const body = docFromPlainText(data.bodyText);
  const columnistId = data.kind === "OPINION" ? data.columnistId ?? null : null;
  const nextStatus =
    openRevision.status === "NEEDS_REVIEW" ? "NEEDS_REVIEW" : "DRAFT";

  const result = await db.transaction(async (tx) => {
    const [lockedRevision] = await tx
      .select()
      .from(articleRevisions)
      .where(eq(articleRevisions.id, openRevision.id))
      .for("update");

    if (!lockedRevision || lockedRevision.version !== data.version) {
      return { kind: "conflict" as const };
    }

    if (!isOpen(lockedRevision.status)) {
      return { kind: "conflict" as const };
    }

    const [updatedRevision] = await tx
      .update(articleRevisions)
      .set({
        categoryId: data.categoryId ?? null,
        kind: data.kind,
        columnistId,
        title: data.title,
        dek: data.dek ?? null,
        body,
        seoTitle: data.seoTitle ?? null,
        seoDescription: data.seoDescription ?? null,
        canonicalUrl: data.canonicalUrl ?? null,
        rightsStatus: data.rightsStatus,
        changeReason: data.changeReason ?? "Editorial edit",
        version: lockedRevision.version + 1,
        status: nextStatus,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(articleRevisions.id, lockedRevision.id),
          eq(articleRevisions.version, data.version),
        ),
      )
      .returning();

    if (!updatedRevision) {
      return { kind: "conflict" as const };
    }

    if (current.status !== "PUBLISHED") {
      await tx
        .update(articles)
        .set({
          slug,
          categoryId: data.categoryId ?? null,
          kind: data.kind,
          columnistId,
          title: data.title,
          dek: data.dek ?? null,
          body,
          seoTitle: data.seoTitle ?? null,
          seoDescription: data.seoDescription ?? null,
          canonicalUrl: data.canonicalUrl ?? null,
          rightsStatus: data.rightsStatus,
          editorId: user.id,
          updatedAt: new Date(),
        })
        .where(eq(articles.id, current.id));
    }

    return {
      kind: "ok" as const,
      revision: updatedRevision,
    };
  });

  if (result.kind === "conflict") {
    return {
      error:
        "यो मस्यौदा अर्को सम्पादकले परिवर्तन गरिसकेको छ। पृष्ठ पुनः लोड गरेर फेरि प्रयास गर्नुहोस्।",
    };
  }

  await writeAudit({
    actorId: user.id,
    action: "article.revision_save",
    entityType: "article",
    entityId: current.id,
    metadata: {
      revisionId: result.revision.id,
      revisionNo: result.revision.revisionNo,
      revisionVersion: result.revision.version,
      title: result.revision.title,
      changeReason: data.changeReason ?? null,
      liveStatus: current.status,
    },
  });

  revalidateAdminArticle(current.id);
  if (current.status !== "PUBLISHED") {
    revalidatePublicArticle(slug);
  }

  return {
    success:
      current.status === "PUBLISHED"
        ? "मस्यौदा सुरक्षित भयो। प्रकाशित संस्करण भने अहिले पनि पुरानै छ।"
        : "परिवर्तन सुरक्षित भयो।",
  };
}

export async function startRevision(formData: FormData) {
  const user = await requireAdmin();
  const articleId = String(formData.get("articleId") ?? "");
  const current = await db.query.articles.findFirst({
    where: eq(articles.id, articleId),
  });

  if (!current) redirect("/admin/stories");

  const existing = await getOpenRevision(articleId);
  if (existing) {
    redirect(`/admin/stories/${articleId}`);
  }

  const revision = await ensureOpenRevision(
    current,
    user.id,
    "New revision started",
  );

  if (!revision) {
    redirect(`/admin/stories/${articleId}?error=revision-failed`);
  }

  await writeAudit({
    actorId: user.id,
    action: "article.revision_start",
    entityType: "article",
    entityId: articleId,
    metadata: {
      revisionId: revision.id,
      revisionNo: revision.revisionNo,
      basedOn: revision.baseRevisionId,
      title: revision.title,
    },
  });

  revalidateAdminArticle(articleId);
  redirect(`/admin/stories/${articleId}`);
}

export async function submitForReview(formData: FormData) {
  const user = await requireAdmin();
  const articleId = String(formData.get("articleId") ?? "");
  const revisionId = String(formData.get("revisionId") ?? "");
  const version = Number(formData.get("version") ?? 0);

  const current = await db.query.articleRevisions.findFirst({
    where: and(
      eq(articleRevisions.id, revisionId),
      eq(articleRevisions.articleId, articleId),
    ),
  });

  if (!current) redirect("/admin/stories");
  if (!isOpen(current.status)) {
    redirect(`/admin/stories/${articleId}?error=invalid-status`);
  }

  const [updated] = await db
    .update(articleRevisions)
    .set({
      status: "NEEDS_REVIEW",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(articleRevisions.id, revisionId),
        eq(articleRevisions.version, version),
        inArray(articleRevisions.status, OPEN_REVISION_STATUSES),
      ),
    )
    .returning();

  if (!updated) {
    redirect(`/admin/stories/${articleId}?error=conflict`);
  }

  await writeAudit({
    actorId: user.id,
    action: "article.revision_submit_review",
    entityType: "article",
    entityId: articleId,
    metadata: {
      revisionId,
      revisionNo: updated.revisionNo,
      revisionVersion: updated.version,
      title: updated.title,
    },
  });

  revalidateAdminArticle(articleId);
  redirect("/admin/review");
}

export async function publishArticle(formData: FormData) {
  const user = await requireAdmin();
  const articleId = String(formData.get("articleId") ?? "");
  const revisionId = String(formData.get("revisionId") ?? "");
  const version = Number(formData.get("version") ?? 0);

  const current = await db.query.articles.findFirst({
    where: eq(articles.id, articleId),
  });
  const revision = await db.query.articleRevisions.findFirst({
    where: and(
      eq(articleRevisions.id, revisionId),
      eq(articleRevisions.articleId, articleId),
    ),
  });

  if (!current || !revision) {
    redirect("/admin/review");
  }

  if (!["NEEDS_REVIEW", "APPROVED"].includes(revision.status)) {
    redirect(`/admin/stories/${articleId}?error=not-ready`);
  }

  if (revision.version !== version) {
    redirect(`/admin/stories/${articleId}?error=conflict`);
  }

  const publishedAt = new Date();

  const result = await db.transaction(async (tx) => {
    const [lockedArticle] = await tx
      .select()
      .from(articles)
      .where(eq(articles.id, articleId))
      .for("update");
    const [lockedRevision] = await tx
      .select()
      .from(articleRevisions)
      .where(eq(articleRevisions.id, revisionId))
      .for("update");

    if (
      !lockedArticle ||
      !lockedRevision ||
      !["NEEDS_REVIEW", "APPROVED"].includes(lockedRevision.status) ||
      lockedRevision.version !== version
    ) {
      return null;
    }

    const [updatedArticle] = await tx
      .update(articles)
      .set({
        ...articlePatchFromRevision(lockedRevision),
        status: "PUBLISHED",
        publishedAt,
        firstPublishedAt: lockedArticle.firstPublishedAt ?? publishedAt,
        editorId: user.id,
        version: lockedArticle.version + 1,
        updatedAt: publishedAt,
      })
      .where(eq(articles.id, articleId))
      .returning();

    if (!updatedArticle) return null;

    await tx
      .update(articleRevisions)
      .set({
        status: "PUBLISHED",
        publishedAt,
        approvedAt: publishedAt,
        approvedById: user.id,
        updatedAt: publishedAt,
        version: lockedRevision.version + 1,
      })
      .where(eq(articleRevisions.id, revisionId));

    return {
      article: updatedArticle,
      revision: lockedRevision,
    };
  });

  if (!result) {
    redirect(`/admin/stories/${articleId}?error=conflict`);
  }

  await writeAudit({
    actorId: user.id,
    action: "article.revision_publish",
    entityType: "article",
    entityId: result.article.id,
    metadata: {
      title: result.article.title,
      revisionId,
      revisionNo: result.revision.revisionNo,
      articleVersion: result.article.version,
      publishedAt: publishedAt.toISOString(),
      selfApproved: result.revision.createdById === user.id,
    },
  });

  revalidatePublicArticle(result.article.slug);
  revalidateAdminArticle(result.article.id);
  redirect(`/admin/stories/${result.article.id}?published=1`);
}

export async function discardRevision(formData: FormData) {
  const user = await requireAdmin();
  const articleId = String(formData.get("articleId") ?? "");
  const revisionId = String(formData.get("revisionId") ?? "");
  const version = Number(formData.get("version") ?? 0);

  const revision = await db.query.articleRevisions.findFirst({
    where: and(
      eq(articleRevisions.id, revisionId),
      eq(articleRevisions.articleId, articleId),
    ),
  });

  if (!revision) redirect(`/admin/stories/${articleId}`);
  if (!isOpen(revision.status)) {
    redirect(`/admin/stories/${articleId}?error=invalid-status`);
  }
  if (revision.version !== version) {
    redirect(`/admin/stories/${articleId}?error=conflict`);
  }

  const deleted = await db
    .delete(articleRevisions)
    .where(
      and(
        eq(articleRevisions.id, revisionId),
        eq(articleRevisions.version, version),
        inArray(articleRevisions.status, OPEN_REVISION_STATUSES),
      ),
    )
    .returning({ id: articleRevisions.id });

  if (deleted.length === 0) {
    redirect(`/admin/stories/${articleId}?error=conflict`);
  }

  await writeAudit({
    actorId: user.id,
    action: "article.revision_discard",
    entityType: "article",
    entityId: articleId,
    metadata: {
      revisionId,
      revisionNo: revision.revisionNo,
      title: revision.title,
      status: revision.status,
    },
  });

  revalidateAdminArticle(articleId);
  redirect(`/admin/stories/${articleId}?discarded=1`);
}

export async function unpublishArticle(formData: FormData) {
  const user = await requireAdmin();
  const articleId = String(formData.get("articleId") ?? "");

  const current = await db.query.articles.findFirst({
    where: eq(articles.id, articleId),
  });

  if (!current) {
    redirect("/admin/stories");
  }

  await db
    .update(articles)
    .set({ status: "DRAFT", updatedAt: new Date() })
    .where(eq(articles.id, articleId));

  const revision = await ensureOpenRevision(
    current,
    user.id,
    "Article unpublished; working draft opened",
  );

  await writeAudit({
    actorId: user.id,
    action: "article.unpublish",
    entityType: "article",
    entityId: articleId,
    metadata: {
      title: current.title,
      fromStatus: current.status,
      toStatus: "DRAFT",
      revisionId: revision?.id ?? null,
    },
  });

  revalidatePublicArticle(current.slug);
  revalidateAdminArticle(articleId);
  redirect(`/admin/stories/${articleId}?unpublished=1`);
}

function isOpen(status: string) {
  return (OPEN_REVISION_STATUSES as readonly string[]).includes(status);
}
