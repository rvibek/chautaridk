import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArticleCard } from "@/components/article-card";
import {
  getCategoryBySlug,
  getPublishedArticlesByCategory,
} from "@/lib/articles";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ category: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) return { title: "खण्ड भेटिएन" };

  return {
    title: category.nameNp,
    description:
      category.description ??
      `${category.nameNp} खण्डका पछिल्ला समाचार।`,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category: slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const articles = await getPublishedArticlesByCategory(slug, 40);

  return (
    <div className="container">
      <header className="page-head">
        <span className="kicker">समाचार खण्ड</span>
        <h1>{category.nameNp}</h1>
        <p>
          {category.description ??
            `${category.nameNp} सम्बन्धी चौतारीका पछिल्ला समाचार र विश्लेषण।`}
        </p>
      </header>

      <nav className="category-pills" aria-label="समाचार खण्ड">
        <Link href="/samachar">सबै</Link>
        <Link href={`/samachar/${category.slug}`} className="active">
          {category.nameNp}
        </Link>
        <Link href="/vichar">विचार</Link>
      </nav>

      {articles.length > 0 ? (
        <div className="card-grid card-grid--index">
          {articles.map((article) => (
            <ArticleCard article={article} key={article.id} />
          ))}
        </div>
      ) : (
        <p className="empty-state">
          यो खण्डमा अझै सामग्री प्रकाशित भएको छैन।
        </p>
      )}
    </div>
  );
}
