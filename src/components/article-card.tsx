import Link from "next/link";

import type { PublicArticleCard } from "@/lib/articles";
import {
  formatRelativeNepali,
  readingMinutes,
} from "@/lib/content";

const variants = [
  "navy",
  "amber",
  "green",
  "indigo",
  "slate",
  "rose",
  "teal",
  "maroon",
];

function variantFor(slug: string | null | undefined) {
  const value = slug ?? "chautari";
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 997;
  }
  return variants[hash % variants.length];
}

export function ArticleCard({ article }: { article: PublicArticleCard }) {
  const category = article.categoryName ?? "समाचार";
  const word = category.split(" ")[0] || "समाचार";

  return (
    <article className="story-card">
      <Link
        href={`/article/${article.slug}`}
        className={`thumb thumb--${variantFor(article.categorySlug)}`}
      >
        <span className="thumb-tag">{category}</span>
        <span className="thumb-word" aria-hidden="true">
          {word}
        </span>
      </Link>
      <div className="story-card-body">
        <h3>
          <Link href={`/article/${article.slug}`}>{article.title}</Link>
        </h3>
        {article.dek ? <p>{article.dek}</p> : null}
        <div className="meta">
          <span>{formatRelativeNepali(article.publishedAt)}</span>
          <span className="dot" aria-hidden="true" />
          <span>{readingMinutes(article.body)} मिनेट</span>
        </div>
      </div>
    </article>
  );
}
