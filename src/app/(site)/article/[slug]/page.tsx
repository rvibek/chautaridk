import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdSlot } from "@/components/ad-slot";
import { ArticleBody } from "@/components/article-body";
import { getArticleBySlug, getRelatedArticles } from "@/lib/articles";
import {
  excerptFromDoc,
  formatNepaliDate,
  readingMinutes,
} from "@/lib/content";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const row = await getArticleBySlug(slug);

  if (!row) {
    return { title: "लेख भेटिएन" };
  }

  const { article } = row;

  return {
    title: article.seoTitle ?? article.title,
    description:
      article.seoDescription ??
      article.dek ??
      excerptFromDoc(article.body, 160),
    alternates: {
      canonical: article.canonicalUrl ?? `/article/${article.slug}`,
    },
    openGraph: {
      title: article.seoTitle ?? article.title,
      description:
        article.seoDescription ??
        article.dek ??
        excerptFromDoc(article.body, 160),
      type: "article",
      publishedTime: (
        article.firstPublishedAt ?? article.publishedAt
      )?.toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
      locale: "ne_NP",
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const row = await getArticleBySlug(slug);

  if (!row) {
    notFound();
  }

  const { article, category, source, columnist, author } = row;
  const related = await getRelatedArticles(
    article.categoryId,
    article.id,
    4,
  );
  const shareUrl = `${process.env.APP_URL ?? "http://localhost:3000"}/article/${article.slug}`;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(article.title);

  const byline =
    columnist?.name ??
    author?.name ??
    "चौतारी सम्पादकीय डेस्क";
  const firstPublishedAt = article.firstPublishedAt ?? article.publishedAt;
  const updatedSincePublish =
    firstPublishedAt &&
    article.updatedAt.getTime() - firstPublishedAt.getTime() > 60_000;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description:
      article.seoDescription ??
      article.dek ??
      excerptFromDoc(article.body, 160),
    datePublished: (
      article.firstPublishedAt ?? article.publishedAt
    )?.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    inLanguage: "ne",
    mainEntityOfPage: shareUrl,
    author: {
      "@type": "Person",
      name: byline,
    },
    publisher: {
      "@type": "Organization",
      name: "चौतारी डट डिके",
      url: process.env.APP_URL ?? "http://localhost:3000",
    },
  };

  return (
    <div className="container">
      <nav className="breadcrumbs" aria-label="ब्रेडक्रम्ब">
        <Link href="/">गृहपृष्ठ</Link>
        <span>/</span>
        {category ? (
          <>
            <Link href={`/samachar/${category.slug}`}>{category.nameNp}</Link>
            <span>/</span>
          </>
        ) : null}
        <span>लेख</span>
      </nav>

      <div className="article-layout">
        <article className="article-card">
          <span className="badge-category">
            {category?.nameNp ?? "समाचार"}
            {article.kind === "OPINION" ? " · विचार" : ""}
          </span>

          <h1 className="article-title">{article.title}</h1>

          {article.dek ? <p className="article-lead">{article.dek}</p> : null}

          <div className="article-meta">
            <div className="meta-author">
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{byline}</span>
            </div>
            <div className="meta-time">
              <span>प्रकाशित: {formatNepaliDate(firstPublishedAt)}</span>
              {updatedSincePublish ? (
                <>
                  <span>•</span>
                  <span>
                    अद्यावधिक: {formatNepaliDate(article.updatedAt)}
                  </span>
                </>
              ) : null}
              <span>•</span>
              <span>{readingMinutes(article.body)} मिनेट पढाइ</span>
            </div>
            <div className="share-buttons">
              <a
                className="share-btn"
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Facebook मा शेयर गर्नुहोस्"
              >
                f
              </a>
              <a
                className="share-btn"
                href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
                target="_blank"
                rel="noopener noreferrer"
                title="X मा शेयर गर्नुहोस्"
              >
                𝕏
              </a>
              <a
                className="share-btn"
                href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                title="WhatsApp मा शेयर गर्नुहोस्"
              >
                W
              </a>
            </div>
          </div>

          <div className="article-hero">
            <div className="thumb thumb--navy">
              <span className="thumb-tag">{category?.nameNp ?? "समाचार"}</span>
              <span className="thumb-word" aria-hidden="true">
                {(category?.nameNp ?? "चौतारी").split(" ")[0]}
              </span>
              <span className="thumb-credit">तस्बिर: चौतारी</span>
            </div>
          </div>

          {article.kind === "OPINION" ? (
            <p className="opinion-disclaimer">
              यो लेख लेखकको व्यक्तिगत विचार हो। चौतारी.dk को सम्पादकीय
              अडानसँग यो सधैं मिल्नुपर्ने छैन।
            </p>
          ) : null}

          <ArticleBody doc={article.body} />

          <AdSlot slotKey="article-inline" label="AD 2" size="inline" />

          {source ? (
            <div className="source-box">
              <h2>स्रोत र सन्दर्भ</h2>
              <p>
                <strong>प्रकाशक:</strong> {source.publisher ?? "उपलब्ध छैन"}
              </p>
              {source.originalTitle ? (
                <p>
                  <strong>मूल शीर्षक:</strong> {source.originalTitle}
                </p>
              ) : null}
              {source.originalPublishedAt ? (
                <p>
                  <strong>मूल प्रकाशन मिति:</strong>{" "}
                  {formatNepaliDate(source.originalPublishedAt)}
                </p>
              ) : null}
              {source.url ? (
                <p>
                  <strong>मूल लिङ्क:</strong>{" "}
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {source.url}
                  </a>
                </p>
              ) : null}
              <p className="source-note">
                यो सामग्री स्रोतको सन्दर्भसहित नेपाली पाठकका लागि
                सम्पादकीय रूपमा तयार गरिएको हो। सम्पादकीय नीति हेर्नुहोस्।
              </p>
            </div>
          ) : (
            <div className="source-box source-box--original">
              <h2>सम्पादकीय नोट</h2>
              <p>
                यो चौतारी.dk को मौलिक सामग्री हो। स्रोत उल्लेख गरेर
                साभार गर्न सकिन्छ।
              </p>
            </div>
          )}
        </article>

        <aside className="sidebar">
          <div className="sidebar-widget">
            <h3 className="widget-title">सम्बन्धित सामग्री</h3>
            {related.length > 0 ? (
              <ul className="related-links">
                {related.map((item) => (
                  <li key={item.id}>
                    <Link href={`/article/${item.slug}`}>{item.title}</Link>
                    <span className="related-meta">
                      {item.categoryName ?? "समाचार"} ·{" "}
                      {formatNepaliDate(item.publishedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-note">अझै सम्बन्धित सामग्री उपलब्ध छैन।</p>
            )}
          </div>

          <AdSlot slotKey="sidebar-box" label="AD 3" size="box" />

          <div className="community-card">
            <h4>चौतारी डेनमार्क नेटवर्क</h4>
            <p>
              डेनमार्कका कोपनहेगन, आरहुस, ओडेन्सेलगायतका सहरमा रहेका
              नेपाली समुदायका गतिविधिमा जोडिनुहोस्।
            </p>
            <Link href="/contact" className="btn-comm">
              सम्पर्क गर्नुहोस्
            </Link>
          </div>
        </aside>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
