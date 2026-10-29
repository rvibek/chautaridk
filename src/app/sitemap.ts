import type { MetadataRoute } from "next";

import { getCategories, getPublishedArticles } from "@/lib/articles";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const [articles, categories] = await Promise.all([
    getPublishedArticles(100),
    getCategories(),
  ]);

  const staticRoutes = [
    "",
    "/samachar",
    "/vichar",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/editorial-policy",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  const categoryRoutes = categories.map((category) => ({
    url: `${base}/samachar/${category.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  const articleRoutes = articles.map((article) => ({
    url: `${base}/article/${article.slug}`,
    lastModified: article.publishedAt ?? new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...categoryRoutes, ...articleRoutes];
}
