import { asc, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import {
  adCampaigns,
  adSlots,
  aiModels,
  aiProviders,
  articleRevisions,
  articles,
  categories,
  columnists,
  settings,
  users,
} from "@/db/schema";

export async function getArticleRevisions(articleId: string) {
  return db
    .select({
      id: articleRevisions.id,
      revisionNo: articleRevisions.revisionNo,
      title: articleRevisions.title,
      changeReason: articleRevisions.changeReason,
      status: articleRevisions.status,
      version: articleRevisions.version,
      createdAt: articleRevisions.createdAt,
      updatedAt: articleRevisions.updatedAt,
      publishedAt: articleRevisions.publishedAt,
      approvedAt: articleRevisions.approvedAt,
      authorEmail: users.email,
    })
    .from(articleRevisions)
    .leftJoin(users, eq(articleRevisions.createdById, users.id))
    .where(eq(articleRevisions.articleId, articleId))
    .orderBy(desc(articleRevisions.revisionNo));
}

export async function getReviewQueue() {
  return db
    .select({
      articleId: articles.id,
      slug: articles.slug,
      articleStatus: articles.status,
      articleVersion: articles.version,
      revisionId: articleRevisions.id,
      revisionNo: articleRevisions.revisionNo,
      revisionVersion: articleRevisions.version,
      title: articleRevisions.title,
      revisionStatus: articleRevisions.status,
      updatedAt: articleRevisions.updatedAt,
      categoryName: categories.nameNp,
      authorEmail: users.email,
    })
    .from(articleRevisions)
    .innerJoin(articles, eq(articleRevisions.articleId, articles.id))
    .leftJoin(categories, eq(articleRevisions.categoryId, categories.id))
    .leftJoin(users, eq(articleRevisions.createdById, users.id))
    .where(inArray(articleRevisions.status, ["NEEDS_REVIEW", "APPROVED"]))
    .orderBy(desc(articleRevisions.updatedAt));
}


export async function getAiModels() {
  return db
    .select({
      id: aiModels.id,
      name: aiModels.name,
      modelId: aiModels.modelId,
      isDefault: aiModels.isDefault,
      isActive: aiModels.isActive,
      providerName: aiProviders.name,
      providerSlug: aiProviders.slug,
      createdAt: aiModels.createdAt,
    })
    .from(aiModels)
    .innerJoin(aiProviders, eq(aiModels.providerId, aiProviders.id))
    .orderBy(desc(aiModels.isDefault), asc(aiModels.name));
}

export async function getAdminUsers() {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(asc(users.email));
}

export async function getColumnists() {
  return db.query.columnists.findMany({
    orderBy: [asc(columnists.name)],
  });
}

export async function getSettings() {
  return db.query.settings.findMany({
    orderBy: [asc(settings.key)],
  });
}

export async function getAdSlotsWithCampaigns() {
  return db
    .select({
      slot: adSlots,
      campaign: adCampaigns,
    })
    .from(adSlots)
    .leftJoin(adCampaigns, eq(adCampaigns.slotId, adSlots.id))
    .orderBy(asc(adSlots.key));
}
