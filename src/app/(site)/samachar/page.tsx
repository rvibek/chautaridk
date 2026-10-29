import type { Metadata } from "next";
import Link from "next/link";

import { ArticleCard } from "@/components/article-card";
import {
  getCategories,
  getPublishedArticlesByKind,
} from "@/lib/articles";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "समाचार",
  description: "डेनमार्क र नेपालसँग जोडिएका पछिल्ला समाचार।",
};

export default async function NewsIndexPage() {
  const [articles, categories] = await Promise.all([
    getPublishedArticlesByKind("NEWS", 40),
    getCategories("NEWS"),
  ]);

  return (
    <div className="container">
      <header className="page-head">
        <span className="kicker">चौतारी समाचार</span>
        <h1>समाचार</h1>
        <p>
          डेनमार्कको नीति, अध्यागमन, रोजगारी, अर्थ र नेपाली समुदायसँग
          जोडिएका तथ्यपरक समाचार।
        </p>
      </header>

      <nav className="category-pills" aria-label="समाचार खण्ड">
        <Link href="/samachar" className="active">
          सबै
        </Link>
        {categories.map((category) => (
          <Link href={`/samachar/${category.slug}`} key={category.id}>
            {category.nameNp}
          </Link>
        ))}
      </nav>

      {articles.length > 0 ? (
        <div className="card-grid card-grid--index">
          {articles.map((article) => (
            <ArticleCard article={article} key={article.id} />
          ))}
        </div>
      ) : (
        <p className="empty-state">अझै समाचार प्रकाशित भएका छैनन्।</p>
      )}
    </div>
  );
}
