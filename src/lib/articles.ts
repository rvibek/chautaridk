import {
  and,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNull,
  lte,
  ne,
  or,
  sql,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db } from "@/db";
import {
  adCampaigns,
  adSlots,
  articleRevisions,
  articles,
  auditLogs,
  categories,
  columnists,
  sources,
  users,
} from "@/db/schema";
import { OPEN_REVISION_STATUSES } from "@/lib/revisions";

const openRevision = alias(articleRevisions, "open_revision");

const publicArticleFields = {
  id: articles.id,
  slug: articles.slug,
  title: articles.title,
  dek: articles.dek,
  body: articles.body,
  kind: articles.kind,
  publishedAt: articles.publishedAt,
  firstPublishedAt: articles.firstPublishedAt,
  updatedAt: articles.updatedAt,
  categoryName: categories.nameNp,
  categorySlug: categories.slug,
};

export type PublicArticleCard = Awaited<
  ReturnType<typeof getPublishedArticles>
>[number];

export async function getPublishedArticles(limit = 24) {
  return db
    .select(publicArticleFields)
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .where(
      and(
        eq(articles.status, "PUBLISHED"),
        lte(articles.publishedAt, new Date()),
      ),
    )
    .orderBy(desc(articles.publishedAt))
    .limit(limit);
}

export async function getPublishedArticlesByKind(
  kind: "NEWS" | "OPINION" | "NEPAL",
  limit = 12,
) {
  return db
    .select(publicArticleFields)
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .where(
      and(
        eq(articles.status, "PUBLISHED"),
        eq(articles.kind, kind),
        lte(articles.publishedAt, new Date()),
      ),
    )
    .orderBy(desc(articles.publishedAt))
    .limit(limit);
}

export async function getCategoryBySlug(slug: string) {
  return db.query.categories.findFirst({
    where: and(eq(categories.slug, slug), eq(categories.isActive, true)),
  });
}

export async function searchPublishedArticles(query: string, limit = 24) {
  const term = `%${query.trim()}%`;

  if (!query.trim()) return [];

  return db
    .select(publicArticleFields)
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .where(
      and(
        eq(articles.status, "PUBLISHED"),
        lte(articles.publishedAt, new Date()),
        or(
          ilike(articles.title, term),
          ilike(articles.dek, term),
          sql`${articles.body}::text ILIKE ${term}`,
        ),
      ),
    )
    .orderBy(desc(articles.publishedAt))
    .limit(limit);
}

export async function getPublishedArticlesByCategory(
  categorySlug: string,
  limit = 24,
) {
  return db
    .select(publicArticleFields)
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .where(
      and(
        eq(articles.status, "PUBLISHED"),
        eq(categories.slug, categorySlug),
        lte(articles.publishedAt, new Date()),
      ),
    )
    .orderBy(desc(articles.publishedAt))
    .limit(limit);
}

export async function getArticleBySlug(slug: string) {
  const [row] = await db
    .select({
      article: articles,
      category: categories,
      source: sources,
      columnist: columnists,
      author: users,
    })
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .leftJoin(sources, eq(articles.sourceId, sources.id))
    .leftJoin(columnists, eq(articles.columnistId, columnists.id))
    .leftJoin(users, eq(articles.authorId, users.id))
    .where(
      and(eq(articles.slug, slug), eq(articles.status, "PUBLISHED")),
    )
    .limit(1);

  return row ?? null;
}

export async function getRelatedArticles(
  categoryId: string | null,
  excludeId: string,
  limit = 4,
) {
  if (!categoryId) return [];

  return db
    .select(publicArticleFields)
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .where(
      and(
        eq(articles.status, "PUBLISHED"),
        eq(articles.categoryId, categoryId),
        ne(articles.id, excludeId),
        lte(articles.publishedAt, new Date()),
      ),
    )
    .orderBy(desc(articles.publishedAt))
    .limit(limit);
}

export async function getAdminArticles(
  status?: string,
  kind?: "NEWS" | "OPINION" | "NEPAL",
) {
  const validStatuses = [
    "DRAFT",
    "NEEDS_REVIEW",
    "CHANGES_REQUESTED",
    "APPROVED",
    "SCHEDULED",
    "PUBLISHED",
    "REJECTED",
    "ARCHIVED",
  ] as const;

  const statusFilter = validStatuses.includes(status as never)
    ? status === "DRAFT"
      ? or(
          eq(articles.status, "DRAFT"),
          eq(openRevision.status, "DRAFT"),
        )
      : ["NEEDS_REVIEW", "CHANGES_REQUESTED", "APPROVED"].includes(
            status as string,
          )
        ? eq(
            openRevision.status,
            status as "NEEDS_REVIEW" | "CHANGES_REQUESTED" | "APPROVED",
          )
        : eq(articles.status, status as (typeof validStatuses)[number])
    : undefined;
  const kindFilter = kind ? eq(articles.kind, kind) : undefined;

  return db
    .select({
      id: articles.id,
      slug: articles.slug,
      title: articles.title,
      status: articles.status,
      kind: articles.kind,
      updatedAt: articles.updatedAt,
      publishedAt: articles.publishedAt,
      version: articles.version,
      categoryName: categories.nameNp,
      revisionId: openRevision.id,
      revisionTitle: openRevision.title,
      revisionStatus: openRevision.status,
      revisionNo: openRevision.revisionNo,
      revisionVersion: openRevision.version,
      revisionUpdatedAt: openRevision.updatedAt,
    })
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .leftJoin(
      openRevision,
      and(
        eq(openRevision.articleId, articles.id),
        inArray(openRevision.status, OPEN_REVISION_STATUSES),
      ),
    )
    .where(and(statusFilter, kindFilter))
    .orderBy(
      desc(sql`coalesce(${openRevision.updatedAt}, ${articles.updatedAt})`),
    )
    .limit(100);
}

export async function getAdminArticleById(id: string) {
  const [row] = await db
    .select({
      article: articles,
      category: categories,
      source: sources,
      openRevision,
    })
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .leftJoin(sources, eq(articles.sourceId, sources.id))
    .leftJoin(
      openRevision,
      and(
        eq(openRevision.articleId, articles.id),
        inArray(openRevision.status, OPEN_REVISION_STATUSES),
      ),
    )
    .where(eq(articles.id, id))
    .limit(1);

  return row ?? null;
}

export async function getDashboardCounts() {
  const [articleRows, revisionRows] = await Promise.all([
    db
      .select({ status: articles.status, total: count() })
      .from(articles)
      .groupBy(articles.status),
    db
      .select({ status: articleRevisions.status, total: count() })
      .from(articleRevisions)
      .where(inArray(articleRevisions.status, OPEN_REVISION_STATUSES))
      .groupBy(articleRevisions.status),
  ]);

  const counts: Record<string, number> = {};
  for (const row of articleRows) {
    counts[row.status] = Number(row.total);
  }

  const revisionCounts: Record<string, number> = {};
  for (const row of revisionRows) {
    revisionCounts[row.status] = Number(row.total);
  }

  counts.DRAFT = revisionCounts.DRAFT ?? 0;
  counts.NEEDS_REVIEW = revisionCounts.NEEDS_REVIEW ?? 0;
  counts.CHANGES_REQUESTED = revisionCounts.CHANGES_REQUESTED ?? 0;

  return counts;
}

export async function getRecentAudit(limit = 12) {
  return db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      createdAt: auditLogs.createdAt,
      actorEmail: users.email,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.actorId, users.id))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}

export async function getCategories(kind?: "NEWS" | "OPINION" | "NEPAL") {
  return db.query.categories.findMany({
    where: kind
      ? and(eq(categories.isActive, true), eq(categories.kind, kind))
      : eq(categories.isActive, true),
    orderBy: [categories.sortOrder, categories.nameNp],
  });
}

export async function getAdForSlot(slotKey: string) {
  const now = new Date();

  const [row] = await db
    .select({
      id: adCampaigns.id,
      name: adCampaigns.name,
      imageUrl: adCampaigns.imageUrl,
      targetUrl: adCampaigns.targetUrl,
      altText: adCampaigns.altText,
      slotName: adSlots.name,
      slotPlacement: adSlots.placement,
    })
    .from(adCampaigns)
    .innerJoin(adSlots, eq(adCampaigns.slotId, adSlots.id))
    .where(
      and(
        eq(adSlots.key, slotKey),
        eq(adSlots.isActive, true),
        eq(adCampaigns.isActive, true),
        or(isNull(adCampaigns.startsAt), lte(adCampaigns.startsAt, now)),
        or(isNull(adCampaigns.endsAt), gte(adCampaigns.endsAt, now)),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function getAllAdSlots() {
  return db.query.adSlots.findMany({
    where: eq(adSlots.isActive, true),
    orderBy: [adSlots.key],
  });
}
