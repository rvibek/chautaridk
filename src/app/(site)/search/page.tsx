import type { Metadata } from "next";

import { ArticleCard } from "@/components/article-card";
import { searchPublishedArticles } from "@/lib/articles";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "खोज",
  robots: { index: false, follow: true },
};

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const results = query ? await searchPublishedArticles(query) : [];

  return (
    <div className="container">
      <header className="page-head">
        <span className="kicker">खोज</span>
        <h1>समाचार खोज्नुहोस्</h1>
        <form className="search-page-form" action="/search">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="शीर्षक वा विषय लेख्नुहोस्..."
            aria-label="खोज शब्द"
          />
          <button type="submit" className="btn">
            खोज्नुहोस्
          </button>
        </form>
        {query ? (
          <p>
            “{query}” का लागि {results.length} परिणाम भेटिए।
          </p>
        ) : (
          <p>शीर्षक, विषय वा समाचारको सामग्रीमा खोज्नुहोस्।</p>
        )}
      </header>

      {results.length > 0 ? (
        <div className="card-grid card-grid--index">
          {results.map((article) => (
            <ArticleCard article={article} key={article.id} />
          ))}
        </div>
      ) : query ? (
        <p className="empty-state">
          यो शब्दसँग मिल्ने समाचार भेटिएन। अर्को शब्द प्रयास गर्नुहोस्।
        </p>
      ) : null}
    </div>
  );
}
