import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export type TipTapMark = {
  type: string;
  attrs?: Record<string, unknown>;
};

export type TipTapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
  text?: string;
  marks?: TipTapMark[];
};

export type TipTapDoc = {
  type: "doc";
  content: TipTapNode[];
};

export const userRole = pgEnum("user_role", [
  "SUPER_ADMIN",
  "ADMIN",
  "PUBLIC_USER",
]);

export const sectionKind = pgEnum("section_kind", ["NEWS", "OPINION", "NEPAL"]);

export const articleStatus = pgEnum("article_status", [
  "DRAFT",
  "NEEDS_REVIEW",
  "CHANGES_REQUESTED",
  "APPROVED",
  "SCHEDULED",
  "PUBLISHED",
  "REJECTED",
  "ARCHIVED",
]);

export const rightsStatus = pgEnum("rights_status", [
  "ORIGINAL",
  "LICENSED",
  "PERMISSION_GRANTED",
  "FAIR_USE_SUMMARY",
  "UNKNOWN",
]);

export const adEventType = pgEnum("ad_event_type", ["IMPRESSION", "CLICK"]);

// ---------------------------------------------------------------------------
// Auth.js tables. Column names intentionally match the Drizzle adapter.
// ---------------------------------------------------------------------------

export const users = pgTable(
  "user",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name"),
    email: text("email").unique(),
    emailVerified: timestamp("emailVerified", { mode: "date" }),
    image: text("image"),
    role: userRole("role").notNull().default("ADMIN"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("user_role_idx").on(table.role)],
);

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => [
    primaryKey({ columns: [table.provider, table.providerAccountId] }),
    index("account_user_id_idx").on(table.userId),
  ],
);

export const sessions = pgTable(
  "session",
  {
    sessionToken: text("sessionToken").primaryKey(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.identifier, table.token] }),
  ],
);

// ---------------------------------------------------------------------------
// Editorial content
// ---------------------------------------------------------------------------

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    nameNp: text("name_np").notNull(),
    nameEn: text("name_en"),
    kind: sectionKind("kind").notNull().default("NEWS"),
    description: text("description"),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("categories_slug_idx").on(table.slug)],
);

export const media = pgTable("media", {
  id: uuid("id").primaryKey().defaultRandom(),
  url: text("url").notNull(),
  alt: text("alt"),
  caption: text("caption"),
  width: integer("width"),
  height: integer("height"),
  uploadedById: text("uploaded_by_id").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const columnists = pgTable(
  "columnists",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    photoUrl: text("photo_url"),
    bio: text("bio"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("columnists_slug_idx").on(table.slug)],
);

export const aiProviders = pgTable(
  "ai_providers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    baseUrl: text("base_url"),
    apiKeyEncrypted: text("api_key_encrypted"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("ai_providers_slug_idx").on(table.slug)],
);

export const aiModels = pgTable(
  "ai_models",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => aiProviders.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    modelId: text("model_id").notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    config: jsonb("config").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("ai_models_provider_model_idx").on(table.providerId, table.modelId)],
);

export const sources = pgTable("sources", {
  id: uuid("id").primaryKey().defaultRandom(),
  url: text("url"),
  publisher: text("publisher"),
  originalTitle: text("original_title"),
  originalPublishedAt: timestamp("original_published_at", {
    withTimezone: true,
  }),
  language: text("language"),
  rawText: text("raw_text"),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }),
  rightsStatus: rightsStatus("rights_status").notNull().default("UNKNOWN"),
  permissionNote: text("permission_note"),
  createdById: text("created_by_id").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const articles = pgTable(
  "articles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    kind: sectionKind("kind").notNull().default("NEWS"),
    status: articleStatus("status").notNull().default("DRAFT"),
    locale: text("locale").notNull().default("ne"),
    title: text("title").notNull(),
    dek: text("dek"),
    body: jsonb("body").$type<TipTapDoc>().notNull(),
    heroMediaId: uuid("hero_media_id").references(() => media.id, {
      onDelete: "set null",
    }),
    authorId: text("author_id").references(() => users.id, {
      onDelete: "set null",
    }),
    editorId: text("editor_id").references(() => users.id, {
      onDelete: "set null",
    }),
    columnistId: uuid("columnist_id").references(() => columnists.id, {
      onDelete: "set null",
    }),
    sourceId: uuid("source_id").references(() => sources.id, {
      onDelete: "set null",
    }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    firstPublishedAt: timestamp("first_published_at", { withTimezone: true }),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    canonicalUrl: text("canonical_url"),
    rightsStatus: rightsStatus("rights_status").notNull().default("ORIGINAL"),
    allowComments: boolean("allow_comments").notNull().default(true),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("articles_slug_idx").on(table.slug),
    index("articles_status_published_idx").on(table.status, table.publishedAt),
    index("articles_category_idx").on(table.categoryId),
    index("articles_kind_idx").on(table.kind),
  ],
);

export const articleRevisions = pgTable(
  "article_revisions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    articleId: uuid("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    revisionNo: integer("revision_no").notNull(),
    baseRevisionId: uuid("base_revision_id"),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    kind: sectionKind("kind").notNull().default("NEWS"),
    title: text("title").notNull(),
    dek: text("dek"),
    body: jsonb("body").$type<TipTapDoc>().notNull(),
    heroMediaId: uuid("hero_media_id").references(() => media.id, {
      onDelete: "set null",
    }),
    columnistId: uuid("columnist_id").references(() => columnists.id, {
      onDelete: "set null",
    }),
    sourceId: uuid("source_id").references(() => sources.id, {
      onDelete: "set null",
    }),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    canonicalUrl: text("canonical_url"),
    rightsStatus: rightsStatus("rights_status").notNull().default("ORIGINAL"),
    allowComments: boolean("allow_comments").notNull().default(true),
    changeReason: text("change_reason"),
    createdById: text("created_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    approvedById: text("approved_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    aiModelId: uuid("ai_model_id").references(() => aiModels.id, {
      onDelete: "set null",
    }),
    promptVersion: text("prompt_version"),
    tokenInput: integer("token_input"),
    tokenOutput: integer("token_output"),
    backTranslation: text("back_translation"),
    status: articleStatus("status").notNull().default("DRAFT"),
    version: integer("version").notNull().default(1),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("article_revisions_article_no_idx").on(
      table.articleId,
      table.revisionNo,
    ),
    uniqueIndex("article_revisions_one_open_idx")
      .on(table.articleId)
      .where(
        sql`${table.status} in ('DRAFT', 'NEEDS_REVIEW', 'CHANGES_REQUESTED')`,
      ),
    index("article_revisions_status_idx").on(table.status, table.updatedAt),
  ],
);

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("tags_slug_idx").on(table.slug)],
);

export const articleTags = pgTable(
  "article_tags",
  {
    articleId: uuid("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.articleId, table.tagId] })],
);

// ---------------------------------------------------------------------------
// Operations
// ---------------------------------------------------------------------------

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: text("actor_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("audit_logs_entity_idx").on(table.entityType, table.entityId),
    index("audit_logs_created_idx").on(table.createdAt),
  ],
);

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<unknown>().notNull(),
  updatedById: text("updated_by_id").references(() => users.id, {
    onDelete: "set null",
  }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const adSlots = pgTable(
  "ad_slots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: text("key").notNull(),
    name: text("name").notNull(),
    placement: text("placement").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("ad_slots_key_idx").on(table.key)],
);

export const adCampaigns = pgTable("ad_campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  slotId: uuid("slot_id")
    .notNull()
    .references(() => adSlots.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  imageUrl: text("image_url"),
  targetUrl: text("target_url").notNull(),
  altText: text("alt_text"),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const adEvents = pgTable(
  "ad_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => adCampaigns.id, { onDelete: "cascade" }),
    type: adEventType("type").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("ad_events_campaign_idx").on(table.campaignId, table.createdAt)],
);

export const translationProfiles = pgTable(
  "translation_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    styleGuide: text("style_guide"),
    systemPrompt: text("system_prompt"),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("translation_profiles_name_idx").on(table.name)],
);

export const glossaryTerms = pgTable(
  "glossary_terms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceTerm: text("source_term").notNull(),
    nepaliTerm: text("nepali_term").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("glossary_terms_source_idx").on(table.sourceTerm)],
);

export const promptTemplates = pgTable(
  "prompt_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: text("key").notNull(),
    name: text("name").notNull(),
    version: text("version").notNull().default("1"),
    template: text("template").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("prompt_templates_key_idx").on(table.key)],
);

export const aiUsageLogs = pgTable("ai_usage_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  modelId: uuid("model_id").references(() => aiModels.id, {
    onDelete: "set null",
  }),
  articleId: uuid("article_id").references(() => articles.id, {
    onDelete: "set null",
  }),
  userId: text("user_id").references(() => users.id, {
    onDelete: "set null",
  }),
  operation: text("operation").notNull(),
  tokenInput: integer("token_input"),
  tokenOutput: integer("token_output"),
  costEstimate: text("cost_estimate"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const staticPages = pgTable(
  "static_pages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    body: jsonb("body").$type<TipTapDoc>().notNull(),
    isPublished: boolean("is_published").notNull().default(false),
    updatedById: text("updated_by_id").references(() => users.id, {
      onDelete: "set null",
    }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("static_pages_slug_idx").on(table.slug)],
);

export const newsletterSubscribers = pgTable(
  "newsletter_subscribers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    status: text("status").notNull().default("PENDING"),
    confirmToken: text("confirm_token"),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("newsletter_subscribers_email_idx").on(table.email)],
);
