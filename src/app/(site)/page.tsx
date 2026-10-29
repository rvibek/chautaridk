import Link from "next/link";

import { AdSlot } from "@/components/ad-slot";
import { ArticleCard } from "@/components/article-card";
import {
  getPublishedArticles,
  getPublishedArticlesByKind,
} from "@/lib/articles";
import {
  excerptFromDoc,
  formatRelativeNepali,
  readingMinutes,
} from "@/lib/content";

export const dynamic = "force-dynamic";

function SectionHead({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="section-head">
      <h2 className="section-title">{title}</h2>
      <Link className="section-link" href={href}>
        {linkLabel}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
    </div>
  );
}

export default async function HomePage() {
  const [latest, news, opinion] = await Promise.all([
    getPublishedArticles(24),
    getPublishedArticlesByKind("NEWS", 12),
    getPublishedArticlesByKind("OPINION", 4),
  ]);

  const lead = latest[0] ?? null;
  const sideLatest = latest.slice(1, 7);
  const newsCards = news
    .filter((article) => article.id !== lead?.id)
    .slice(0, 4);
  const economy = news.filter((article) => article.categorySlug === "artha-banking");
  const economyFeature = economy[0] ?? news[0] ?? null;
  const economyHeadlines = news
    .filter((article) => article.id !== economyFeature?.id)
    .slice(0, 4);
  const law = news.filter((article) => article.categorySlug === "kanun-visa").slice(0, 3);
  const lawCards = [
    ...law,
    ...news.filter((article) => !law.some((item) => item.id === article.id)),
  ].slice(0, 3);
  const popular = latest.slice(0, 5);

  return (
    <div className="container">
      {lead ? (
        <section className="hero" aria-labelledby="lead-title">
          <article className="lead-story">
            <Link
              href={`/article/${lead.slug}`}
              className="lead-media thumb thumb--navy"
            >
              <span className="thumb-tag">{lead.categoryName ?? "समाचार"}</span>
              <span className="thumb-word" aria-hidden="true">
                {(lead.categoryName ?? "चौतारी").split(" ")[0]}
              </span>
              <span className="thumb-credit">तस्बिर: चौतारी</span>
            </Link>
            <h1 id="lead-title">
              <Link href={`/article/${lead.slug}`}>{lead.title}</Link>
            </h1>
            <p className="lead-dek">
              {lead.dek ?? excerptFromDoc(lead.body, 240)}
            </p>
            <div className="meta">
              {lead.categoryName ? (
                <>
                  <span className="meta-red">{lead.categoryName}</span>
                  <span className="dot" aria-hidden="true" />
                </>
              ) : null}
              <span>चौतारी सम्पादकीय डेस्क, कोपनहेगन</span>
              <span className="dot" aria-hidden="true" />
              <time dateTime={lead.publishedAt?.toISOString()}>
                {formatRelativeNepali(lead.publishedAt)}
              </time>
              <span className="dot" aria-hidden="true" />
              <span>{readingMinutes(lead.body)} मिनेट पढाइ</span>
            </div>
          </article>

          <aside className="hero-side" aria-labelledby="latest-title">
            <div className="side-head">
              <h2 id="latest-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M13 2 4.5 13.5H11L9.5 22 19 9.5h-6.5L13 2z" strokeLinejoin="round" />
                </svg>
                ताजा अपडेट
              </h2>
              <Link href="/samachar">सबै →</Link>
            </div>

            <ul className="latest-list">
              {sideLatest.length > 0 ? (
                sideLatest.map((article) => (
                  <li className="latest-item" key={article.id}>
                    <Link href={`/article/${article.slug}`}>
                      <span className="latest-time">
                        {formatRelativeNepali(article.publishedAt)}
                      </span>
                      <span className="latest-title">{article.title}</span>
                    </Link>
                  </li>
                ))
              ) : (
                <li className="latest-item">
                  <span className="latest-title" style={{ padding: "0.8rem 0", display: "block" }}>
                    अझै थप समाचार प्रकाशित भएका छैनन्।
                  </span>
                </li>
              )}
            </ul>

            <div className="series-card">
              <span className="series-kicker">विशेष शृंखला</span>
              <h3>
                <Link href="/samachar/shram-samaj">
                  श्रम र समाज: डेनमार्कमा नेपाली कामदारको बदलिँदो जीवन
                </Link>
              </h3>
              <p>
                सफाइ कर्मदेखि आईटीसम्म — अधिकार, युनियन र पहिचानको कथा।
              </p>
              <Link className="series-link" href="/samachar/shram-samaj">
                शृंखला पढ्नुहोस् <span aria-hidden="true">→</span>
              </Link>
            </div>
          </aside>
        </section>
      ) : (
        <section className="empty-state" style={{ marginTop: "2rem" }}>
          <h1>चौतारीमा स्वागत छ</h1>
          <p>अझै कुनै समाचार प्रकाशित भएको छैन। सम्पादकीय टोलीले चाँडै सामग्री थप्नेछ।</p>
        </section>
      )}

      <AdSlot slotKey="home-leaderboard" label="AD 1" size="leaderboard" />

      <section className="block" id="news" aria-labelledby="news-title">
        <div className="section-head">
          <h2 className="section-title" id="news-title">
            समाचार
          </h2>
          <Link className="section-link" href="/samachar">
            सबै समाचार
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
        {newsCards.length > 0 ? (
          <div className="card-grid">
            {newsCards.map((article) => (
              <ArticleCard article={article} key={article.id} />
            ))}
          </div>
        ) : (
          <p className="empty-note">समाचार खण्डमा अझै सामग्री थपिएको छैन।</p>
        )}
      </section>

      <div className="content-layout">
        <div className="main-col">
          {economyFeature ? (
            <section className="block" id="economy" aria-labelledby="economy-title">
              <SectionHead
                title="अर्थ र बैंकिङ"
                href="/samachar/artha-banking"
                linkLabel="सबै हेर्नुहोस्"
              />
              <div className="split">
                <article className="feature-story">
                  <Link
                    href={`/article/${economyFeature.slug}`}
                    className="thumb thumb--navy"
                  >
                    <span className="thumb-tag">
                      {economyFeature.categoryName ?? "अर्थ"}
                    </span>
                    <span className="thumb-word" aria-hidden="true">
                      बैंक
                    </span>
                    <span className="thumb-credit">तस्बिर: चौतारी</span>
                  </Link>
                  <h3>
                    <Link href={`/article/${economyFeature.slug}`}>
                      {economyFeature.title}
                    </Link>
                  </h3>
                  <p>{economyFeature.dek ?? excerptFromDoc(economyFeature.body, 180)}</p>
                  <div className="meta">
                    <span className="meta-strong">विशेष रिपोर्ट</span>
                    <span className="dot" aria-hidden="true" />
                    <span>{formatRelativeNepali(economyFeature.publishedAt)}</span>
                  </div>
                </article>

                <ul className="headline-list">
                  {economyHeadlines.map((article, index) => (
                    <li className="headline-item" key={article.id}>
                      <Link href={`/article/${article.slug}`}>
                        <span className="headline-num">
                          {String(index + 1).padStart(2, "0").replace(/[0-9]/g, (digit) => "०१२३४५६७८९"[Number(digit)])}
                        </span>
                        <span>
                          <span className="headline-title">{article.title}</span>
                          <span className="headline-meta">
                            {article.categoryName ?? "समाचार"} ·{" "}
                            {formatRelativeNepali(article.publishedAt)}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ) : null}

          <section className="block" id="opinion" aria-labelledby="opinion-title">
            <SectionHead title="विचार" href="/vichar" linkLabel="सबै विचार" />
            {opinion.length > 0 ? (
              <div className="opinion-grid">
                {opinion.map((article) => (
                  <article className="opinion-card" key={article.id}>
                    <span className="kicker">विचार</span>
                    <div className="opinion-quote">
                      <Link href={`/article/${article.slug}`}>{article.title}</Link>
                    </div>
                    <p>{article.dek ?? excerptFromDoc(article.body, 150)}</p>
                    <div className="author">
                      <span className="avatar">चौ</span>
                      <span>
                        <span className="author-name">चौतारी विचार डेस्क</span>
                        <span className="author-role">लेखकको व्यक्तिगत विचार</span>
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="empty-note">
                विचार खण्डका लागि स्तम्भकारसँग लेख आउँदै छन्।
              </p>
            )}
          </section>

          <section className="block block--flush" id="law" aria-labelledby="law-title">
            <SectionHead
              title="कानुन र भिसा"
              href="/samachar/kanun-visa"
              linkLabel="सबै हेर्नुहोस्"
            />
            {lawCards.length > 0 ? (
              <div className="three-up">
                {lawCards.map((article) => (
                  <ArticleCard article={article} key={article.id} />
                ))}
              </div>
            ) : (
              <p className="empty-note">कानुन र भिसा खण्डमा अझै सामग्री थपिएको छैन।</p>
            )}
          </section>
        </div>

        <aside className="sidebar">
          <section className="widget" aria-labelledby="popular-title">
            <div className="widget-head">
              <h2 id="popular-title">लोकप्रिय</h2>
              <span className="count">ताजा</span>
            </div>
            <div className="popular-list">
              {popular.map((article, index) => (
                <div className="popular-item" key={article.id}>
                  <Link href={`/article/${article.slug}`}>
                    <span className="popular-num">{index + 1}</span>
                    <span>
                      <span className="popular-title">{article.title}</span>
                      <span className="popular-meta">
                        {article.categoryName ?? "समाचार"} ·{" "}
                        {formatRelativeNepali(article.publishedAt)}
                      </span>
                    </span>
                  </Link>
                </div>
              ))}
            </div>
          </section>

          <AdSlot slotKey="sidebar-box" label="AD 2" size="box" />

          <section className="widget newsletter" id="newsletter">
            <span className="kicker">चौतारी नेटवर्क</span>
            <h2>डेनमार्कका नेपाली समुदायको अपडेट</h2>
            <p>
              समाचार, कार्यक्रम र उपयोगी सूचना सिधै इनबक्समा पाउन
              न्यूजलेटर चाँडै सुरु हुँदै छ।
            </p>
            <Link className="btn" href="/contact" style={{ marginTop: "0.8rem" }}>
              सम्पर्कमा रहनुहोस्
            </Link>
          </section>

          <section className="widget">
            <div className="widget-head">
              <h2>चौतारीबारे</h2>
            </div>
            <p style={{ fontSize: "0.84rem", lineHeight: 1.7, color: "var(--muted)" }}>
              चौतारी.dk डेनमार्कमा रहेका नेपालीहरूका लागि स्वतन्त्र,
              नेपाली भाषाको समाचार मञ्च हो। हामी तथ्य, सन्दर्भ र
              समुदायको आवाजलाई प्राथमिकता दिन्छौं।
            </p>
            <Link className="section-link" href="/about" style={{ marginTop: "0.8rem" }}>
              थप पढ्नुहोस् →
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
