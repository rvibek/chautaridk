import Link from "next/link";
import { notFound } from "next/navigation";

import { ArticleBody } from "@/components/article-body";
import { getAdminArticleById } from "@/lib/articles";
import { requireAdmin } from "@/lib/authz";
import { formatNepaliDateTime, readingMinutes } from "@/lib/content";
import { getSourceById } from "@/lib/revisions";

export default async function DraftPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdmin();
  const row = await getAdminArticleById(id);

  if (!row) notFound();

  const { article, openRevision } = row;
  if (!openRevision) {
    return (
      <div className="admin-card">
        <h1>मस्यौदा पूर्वावलोकन</h1>
        <p className="admin-side-meta">
          यो लेखको कुनै खुला मस्यौदा छैन।{" "}
          <Link href={`/admin/stories/${article.id}`}>सम्पादन पृष्ठमा फर्कनुहोस्</Link>।
        </p>
      </div>
    );
  }

  const source = await getSourceById(
    openRevision.sourceId ?? article.sourceId,
  );

  return (
    <div className="container">
      <div className="form-error" style={{ margin: "1rem 0" }}>
        निजी मस्यौदा पूर्वावलोकन — यो पृष्ठ सार्वजनिक छैन। मस्यौदा v
        {openRevision.revisionNo} · अद्यावधिक{" "}
        {formatNepaliDateTime(openRevision.updatedAt)}
      </div>

      <div className="article-layout">
        <article className="article-card">
          <h1 className="article-title">{openRevision.title}</h1>
          {openRevision.dek ? (
            <p className="article-lead">{openRevision.dek}</p>
          ) : null}

          <div className="article-meta">
            <div className="meta-time">
              <span>{readingMinutes(openRevision.body)} मिनेट पढाइ</span>
              <span>•</span>
              <span>मस्यौदा v{openRevision.revisionNo}</span>
            </div>
          </div>

          <ArticleBody doc={openRevision.body} />

          {source ? (
            <div className="source-box">
              <h2>स्रोत र सन्दर्भ</h2>
              <p>
                <strong>प्रकाशक:</strong>{" "}
                {source.publisher ?? "उपलब्ध छैन"}
              </p>
              {source.originalTitle ? (
                <p>
                  <strong>मूल शीर्षक:</strong> {source.originalTitle}
                </p>
              ) : null}
              {source.url ? (
                <p>
                  <strong>मूल लिङ्क:</strong>{" "}
                  <a href={source.url} target="_blank" rel="noopener noreferrer">
                    {source.url}
                  </a>
                </p>
              ) : null}
            </div>
          ) : null}

          <p style={{ marginTop: "1.5rem" }}>
            <Link href={`/admin/stories/${article.id}`}>
              ← सम्पादन पृष्ठमा फर्कनुहोस्
            </Link>
          </p>
        </article>
      </div>
    </div>
  );
}
