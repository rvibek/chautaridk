import { and, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { articleRevisions, articles, sources } from "@/db/schema";
import { slugify } from "@/lib/content";

export const OPEN_REVISION_STATUSES = [
  "DRAFT",
  "NEEDS_REVIEW",
  "CHANGES_REQUESTED",
] as const;

export type OpenRevisionStatus = (typeof OPEN_REVISION_STATUSES)[number];

export function isOpenRevisionStatus(status: string): status is OpenRevisionStatus {
  return (OPEN_REVISION_STATUSES as readonly string[]).includes(status);
}

export async function getOpenRevision(articleId: string) {
  return db.query.articleRevisions.findFirst({
    where: and(
      eq(articleRevisions.articleId, articleId),
      inArray(articleRevisions.status, OPEN_REVISION_STATUSES),
    ),
    orderBy: [desc(articleRevisions.updatedAt)],
  });
}

export async function getRevisionById(revisionId: string) {
  return db.query.articleRevisions.findFirst({
    where: eq(articleRevisions.id, revisionId),
  });
}

export async function getLatestRevision(articleId: string) {
  return db.query.articleRevisions.findFirst({
    where: eq(articleRevisions.articleId, articleId),
    orderBy: [desc(articleRevisions.revisionNo)],
  });
}

export async function getSourceById(sourceId: string | null) {
  if (!sourceId) return null;

  return db.query.sources.findFirst({
    where: eq(sources.id, sourceId),
  });
}

type ArticleSnapshot = Pick<
  typeof articles.$inferSelect,
  | "categoryId"
  | "kind"
  | "title"
  | "dek"
  | "body"
  | "heroMediaId"
  | "columnistId"
  | "sourceId"
  | "seoTitle"
  | "seoDescription"
  | "canonicalUrl"
  | "rightsStatus"
  | "allowComments"
>;

export function revisionContentFromArticle(article: ArticleSnapshot) {
  return {
    categoryId: article.categoryId,
    kind: article.kind,
    title: article.title,
    dek: article.dek,
    body: article.body,
    heroMediaId: article.heroMediaId,
    columnistId: article.columnistId,
    sourceId: article.sourceId,
    seoTitle: article.seoTitle,
    seoDescription: article.seoDescription,
    canonicalUrl: article.canonicalUrl,
    rightsStatus: article.rightsStatus,
    allowComments: article.allowComments,
  };
}

export function articlePatchFromRevision(
  revision: typeof articleRevisions.$inferSelect,
) {
  return {
    categoryId: revision.categoryId,
    kind: revision.kind,
    title: revision.title,
    dek: revision.dek,
    body: revision.body,
    heroMediaId: revision.heroMediaId,
    columnistId: revision.columnistId,
    sourceId: revision.sourceId,
    seoTitle: revision.seoTitle,
    seoDescription: revision.seoDescription,
    canonicalUrl: revision.canonicalUrl,
    rightsStatus: revision.rightsStatus,
    allowComments: revision.allowComments,
  };
}

export async function ensureOpenRevision(
  article: typeof articles.$inferSelect,
  userId: string,
  changeReason: string,
) {
  const existing = await getOpenRevision(article.id);
  if (existing) return existing;

  const latest = await getLatestRevision(article.id);

  try {
    const [created] = await db
      .insert(articleRevisions)
      .values({
        articleId: article.id,
        revisionNo: (latest?.revisionNo ?? 0) + 1,
        baseRevisionId: latest?.id ?? null,
        ...revisionContentFromArticle(article),
        changeReason,
        createdById: userId,
        status: "DRAFT",
        version: 1,
      })
      .returning();

    return created ?? null;
  } catch (error) {
    // The partial unique index is the final guard when two editors start a
    // revision at the same time. The other transaction's revision wins.
    const raced = await getOpenRevision(article.id);
    if (raced) return raced;
    throw error;
  }
}

export async function ensureUniqueArticleSlug(
  input: string,
  excludeArticleId?: string,
): Promise<string> {
  const base = slugify(input);
  let candidate = base;
  let suffix = 2;

  while (true) {
    const [existing] = await db
      .select({ id: articles.id })
      .from(articles)
      .where(eq(articles.slug, candidate))
      .limit(1);

    if (!existing || existing.id === excludeArticleId) {
      return candidate;
    }

    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}
