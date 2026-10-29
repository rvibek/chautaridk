import type { Metadata } from "next";
import Link from "next/link";

import { getPublishedArticlesByKind } from "@/lib/articles";
import { excerptFromDoc, formatRelativeNepali } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "विचार",
  description:
    "डेनमार्कका नेपाली समुदायसँग जोडिएका विचार, विश्लेषण र स्तम्भ।",
};

export default async function OpinionIndexPage() {
  const articles = await getPublishedArticlesByKind("OPINION", 40);

  return (
    <div className="container">
      <header className="page-head">
        <span className="kicker">विचार</span>
        <h1>विचार र विश्लेषण</h1>
        <p>
          स्तम्भकार र अतिथि लेखकका व्यक्तिगत विचार। प्रकाशित लेख
          चौतारीको सम्पादकीय अडान हुँदैन।
        </p>
      </header>

      {articles.length > 0 ? (
        <div className="opinion-grid opinion-grid--index">
          {articles.map((article) => (
            <article className="opinion-card" key={article.id}>
              <span className="kicker">विचार</span>
              <div className="opinion-quote">
                <Link href={`/article/${article.slug}`}>{article.title}</Link>
              </div>
              <p>{article.dek ?? excerptFromDoc(article.body, 180)}</p>
              <div className="author">
                <span className="avatar avatar--red">चौ</span>
                <span>
                  <span className="author-name">चौतारी विचार डेस्क</span>
                  <span className="author-role">
                    लेखकको व्यक्तिगत विचार ·{" "}
                    {formatRelativeNepali(article.publishedAt)}
                  </span>
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="empty-state">
          विचार खण्डका लागि स्तम्भकारसँग लेख आउँदै छन्।
        </p>
      )}
    </div>
  );
}
