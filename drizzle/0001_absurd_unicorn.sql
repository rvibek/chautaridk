ALTER TABLE "article_revisions" ADD COLUMN "base_revision_id" uuid;--> statement-breakpoint
ALTER TABLE "article_revisions" ADD COLUMN "category_id" uuid;--> statement-breakpoint
ALTER TABLE "article_revisions" ADD COLUMN "kind" "section_kind" DEFAULT 'NEWS' NOT NULL;--> statement-breakpoint
ALTER TABLE "article_revisions" ADD COLUMN "hero_media_id" uuid;--> statement-breakpoint
ALTER TABLE "article_revisions" ADD COLUMN "columnist_id" uuid;--> statement-breakpoint
ALTER TABLE "article_revisions" ADD COLUMN "source_id" uuid;--> statement-breakpoint
ALTER TABLE "article_revisions" ADD COLUMN "canonical_url" text;--> statement-breakpoint
ALTER TABLE "article_revisions" ADD COLUMN "rights_status" "rights_status" DEFAULT 'ORIGINAL' NOT NULL;--> statement-breakpoint
ALTER TABLE "article_revisions" ADD COLUMN "allow_comments" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "article_revisions" ADD COLUMN "approved_by_id" text;--> statement-breakpoint
ALTER TABLE "article_revisions" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "article_revisions" ADD COLUMN "published_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "article_revisions" ADD COLUMN "approved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "article_revisions" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "first_published_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "raw_text" text;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "fetched_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "article_revisions" ADD CONSTRAINT "article_revisions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_revisions" ADD CONSTRAINT "article_revisions_hero_media_id_media_id_fk" FOREIGN KEY ("hero_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_revisions" ADD CONSTRAINT "article_revisions_columnist_id_columnists_id_fk" FOREIGN KEY ("columnist_id") REFERENCES "public"."columnists"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_revisions" ADD CONSTRAINT "article_revisions_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article_revisions" ADD CONSTRAINT "article_revisions_approved_by_id_user_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "article_revisions_one_open_idx" ON "article_revisions" USING btree ("article_id") WHERE "article_revisions"."status" in ('DRAFT', 'NEEDS_REVIEW', 'CHANGES_REQUESTED');--> statement-breakpoint
CREATE INDEX "article_revisions_status_idx" ON "article_revisions" USING btree ("status","updated_at");--> statement-breakpoint
UPDATE "article_revisions" AS r
SET
  "category_id" = a."category_id",
  "kind" = a."kind",
  "hero_media_id" = a."hero_media_id",
  "columnist_id" = a."columnist_id",
  "source_id" = a."source_id",
  "canonical_url" = a."canonical_url",
  "rights_status" = a."rights_status",
  "allow_comments" = a."allow_comments",
  "updated_at" = r."created_at",
  "published_at" = CASE WHEN r."status" = 'PUBLISHED' THEN a."published_at" ELSE NULL END,
  "approved_at" = CASE WHEN r."status" = 'PUBLISHED' THEN a."published_at" ELSE NULL END,
  "approved_by_id" = CASE WHEN r."status" = 'PUBLISHED' THEN a."editor_id" ELSE NULL END
FROM "articles" AS a
WHERE r."article_id" = a."id";--> statement-breakpoint
UPDATE "articles"
SET "first_published_at" = "published_at"
WHERE "first_published_at" IS NULL AND "published_at" IS NOT NULL;