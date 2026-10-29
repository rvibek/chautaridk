import Link from "next/link";
import { notFound } from "next/navigation";

import {
  discardRevision,
  publishArticle,
  startRevision,
  submitForReview,
  unpublishArticle,
} from "@/actions/articles";
import { RepromptForm } from "@/components/admin/reprompt-form";
import { StatusBadge } from "@/components/admin/status-badge";
import { StoryForm } from "@/components/admin/story-form";
import { getArticleRevisions, getColumnists } from "@/lib/admin";
import {
  getAdminArticleById,
  getCategories,
} from "@/lib/articles";
import { requireAdmin } from "@/lib/authz";
import { formatNepaliDateTime } from "@/lib/content";
import {
  ensureOpenRevision,
  getSourceById,
} from "@/lib/revisions";

export default async function EditStoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    published?: string;
    unpublished?: string;
    discarded?: string;
    ai?: string;
    error?: string;
  }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const user = await requireAdmin();
  const [row, categories, revisions, columnists] = await Promise.all([
    getAdminArticleById(id),
    getCategories(),
    getArticleRevisions(id),
    getColumnists(),
  ]);

  if (!row) {
    notFound();
  }

  const { article } = row;
  let revision = row.openRevision;

  // Older drafts created before the revision workflow have no open revision.
  // Opening one keeps every edit on the same path.
  if (!revision && article.status !== "PUBLISHED") {
    revision = await ensureOpenRevision(
      article,
      user.id,
      "Working draft opened",
    );
  }

  const source = await getSourceById(revision?.sourceId ?? article.sourceId);
  const displayTitle = revision?.title ?? article.title;
  const displayStatus = revision?.status ?? article.status;
  const lockSlug = article.status === "PUBLISHED";

  const errorMessage =
    query.error === "conflict"
      ? "यो मस्यौदा अर्को सम्पादकले परिवर्तन गरिसकेको छ। पृष्ठ पुनः लोड गर्नुहोस्।"
      : query.error === "not-ready"
        ? "प्रकाशित गर्नुअघि मस्यौदा समीक्षामा पठाउनुपर्छ।"
        : query.error === "invalid-status"
          ? "यो स्थितिबाट यो कार्य गर्न मिल्दैन।"
          : query.error === "revision-failed"
            ? "नयाँ संस्करण सुरु गर्न सकिएन। फेरि प्रयास गर्नुहोस्।"
            : null;

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>{displayTitle}</h1>
          <p>
            {revision ? `मस्यौदा v${revision.revisionNo}` : `v${article.version}`} ·
            /{article.slug}
          </p>
        </div>
        <div className="admin-actions">
          <StatusBadge status={displayStatus} />
          {article.status === "PUBLISHED" && revision ? (
            <span className="status-badge status-PUBLISHED">
              प्रकाशित + मस्यौदा परिवर्तन
            </span>
          ) : null}
          <Link href="/admin/stories" className="btn btn--outline btn--sm">
            ← सूची
          </Link>
          {revision ? (
            <Link
              href={`/admin/stories/${article.id}/preview`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--outline btn--sm"
            >
              मस्यौदा पूर्वावलोकन ↗
            </Link>
          ) : null}
          {article.status === "PUBLISHED" ? (
            <Link
              href={`/article/${article.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--sm"
            >
              सार्वजनिक लेख हेर्नुहोस् ↗
            </Link>
          ) : null}
        </div>
      </div>

      {query.published === "1" ? (
        <div className="form-success" style={{ marginBottom: "1rem" }}>
          मस्यौदा स्वीकृत भयो र सार्वजनिक पृष्ठ अद्यावधिक भयो।
        </div>
      ) : null}
      {query.unpublished === "1" ? (
        <div className="form-success" style={{ marginBottom: "1rem" }}>
          लेख सार्वजनिक पृष्ठबाट हटाइयो। मस्यौदा सम्पादन गरेर फेरि समीक्षामा
          पठाउन सकिन्छ।
        </div>
      ) : null}
      {query.discarded === "1" ? (
        <div className="form-success" style={{ marginBottom: "1rem" }}>
          मस्यौदा खारेज गरियो। प्रकाशित संस्करणमा कुनै परिवर्तन भएन।
        </div>
      ) : null}
      {query.ai === "1" ? (
        <div className="form-success" style={{ marginBottom: "1rem" }}>
          एआई मस्यौदा तयार भयो। तथ्य, नाम, मिति र उद्धरण जाँचेर मात्र
          समीक्षामा पठाउनुहोस्।
        </div>
      ) : null}
      {errorMessage ? (
        <div className="form-error" style={{ marginBottom: "1rem" }}>
          {errorMessage}
        </div>
      ) : null}

      {article.status === "PUBLISHED" && revision ? (
        <div className="admin-card" style={{ marginBottom: "1rem" }}>
          <p className="admin-side-meta">
            यो लेख सार्वजनिक रूपमा प्रकाशित छ। तपाईं अहिले छुट्टै मस्यौदा
            संस्करण सम्पादन गर्दै हुनुहुन्छ; स्वीकृत नगरेसम्म पाठकले पुरानै
            संस्करण देख्नेछन्।
          </p>
        </div>
      ) : null}

      <div className="admin-split">
        <section className="admin-card">
          {revision ? (
            <StoryForm
              mode="edit"
              revision={{ id: revision.id, version: revision.version }}
              lockSlug={lockSlug}
              article={{
                id: article.id,
                title: revision.title,
                slug: article.slug,
                categoryId: revision.categoryId,
                kind: revision.kind,
                columnistId: revision.columnistId,
                dek: revision.dek,
                body: revision.body,
                seoTitle: revision.seoTitle,
                seoDescription: revision.seoDescription,
                canonicalUrl: revision.canonicalUrl,
                rightsStatus: revision.rightsStatus,
              }}
              source={
                source
                  ? {
                      url: source.url,
                      publisher: source.publisher,
                      originalTitle: source.originalTitle,
                      language: source.language,
                    }
                  : null
              }
              categories={categories.map((category) => ({
                id: category.id,
                slug: category.slug,
                nameNp: category.nameNp,
                kind: category.kind,
              }))}
              columnists={columnists.map((columnist) => ({
                id: columnist.id,
                name: columnist.name,
              }))}
            />
          ) : (
            <div>
              <h2>प्रकाशित लेख</h2>
              <p className="admin-side-meta">
                यो लेख प्रकाशित छ। सम्पादन गर्न नयाँ मस्यौदा संस्करण सुरु
                गर्नुहोस्। पाठकले स्वीकृतिअघि पुरानै संस्करण देख्नेछन्।
              </p>
              <form action={startRevision} style={{ marginTop: "1rem" }}>
                <input type="hidden" name="articleId" value={article.id} />
                <button type="submit" className="btn">
                  नयाँ संस्करण सुरु गर्नुहोस्
                </button>
              </form>
            </div>
          )}
        </section>

        <aside style={{ display: "grid", gap: "1rem" }}>
          <section className="admin-card">
            <h2>प्रकाशन कार्य</h2>
            <p className="admin-side-meta">
              सार्वजनिक स्थिति: <strong>{article.status}</strong>
              <br />
              {revision ? (
                <>
                  मस्यौदा: <strong>v{revision.revisionNo}</strong> ·{" "}
                  <strong>{revision.status}</strong>
                  <br />
                  मस्यौदा अद्यावधिक:{" "}
                  <strong>{formatNepaliDateTime(revision.updatedAt)}</strong>
                  <br />
                </>
              ) : (
                <>
                  लेख संस्करण: <strong>v{article.version}</strong>
                  <br />
                </>
              )}
              अन्तिम अद्यावधिक:{" "}
              <strong>{formatNepaliDateTime(article.updatedAt)}</strong>
            </p>

            <div className="admin-actions" style={{ marginTop: "0.8rem" }}>
              {revision &&
              ["DRAFT", "CHANGES_REQUESTED", "NEEDS_REVIEW"].includes(
                revision.status,
              ) ? (
                <form action={submitForReview}>
                  <input type="hidden" name="articleId" value={article.id} />
                  <input type="hidden" name="revisionId" value={revision.id} />
                  <input type="hidden" name="version" value={revision.version} />
                  <button type="submit" className="btn btn--dark">
                    समीक्षाका लागि पठाउनुहोस्
                  </button>
                </form>
              ) : null}

              {revision &&
              ["NEEDS_REVIEW", "APPROVED"].includes(revision.status) ? (
                <form action={publishArticle}>
                  <input type="hidden" name="articleId" value={article.id} />
                  <input type="hidden" name="revisionId" value={revision.id} />
                  <input type="hidden" name="version" value={revision.version} />
                  <button type="submit" className="btn">
                    स्वीकृत गरेर प्रकाशित गर्नुहोस्
                  </button>
                </form>
              ) : null}

              {revision ? (
                <form action={discardRevision}>
                  <input type="hidden" name="articleId" value={article.id} />
                  <input type="hidden" name="revisionId" value={revision.id} />
                  <input type="hidden" name="version" value={revision.version} />
                  <button type="submit" className="btn btn--danger">
                    मस्यौदा खारेज गर्नुहोस्
                  </button>
                </form>
              ) : null}

              {article.status === "PUBLISHED" ? (
                <form action={unpublishArticle}>
                  <input type="hidden" name="articleId" value={article.id} />
                  <button type="submit" className="btn btn--danger">
                    अनपब्लिश गर्नुहोस्
                  </button>
                </form>
              ) : null}
            </div>

            <p className="admin-side-meta" style={{ marginTop: "0.9rem" }}>
              समीक्षा, स्वीकृति, मस्यौदा सुरु र खारेजी सबै अडिट लगमा दर्ता
              हुन्छ। एउटै सम्पादकले लेख तयार गरी स्वीकृत गर्न सक्छ, तर त्यो
              कार्य स्पष्ट रूपमा अभिलेख गरिन्छ।
            </p>
          </section>

          <section className="admin-card">
            <h2>संस्करण इतिहास</h2>
            {revisions.length > 0 ? (
              <table className="admin-table">
                <tbody>
                  {revisions.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>v{item.revisionNo}</strong>
                        <div className="muted">
                          {item.authorEmail ?? "system"} ·{" "}
                          {formatNepaliDateTime(item.updatedAt)}
                        </div>
                        <div className="muted">
                          {item.changeReason ?? "कारण उल्लेख छैन"}
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={item.status} />
                        {item.publishedAt ? (
                          <div className="muted">
                            प्रकाशित: {formatNepaliDateTime(item.publishedAt)}
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="admin-empty">संस्करण इतिहास उपलब्ध छैन।</p>
            )}
          </section>

          {revision?.backTranslation ? (
            <section className="admin-card">
              <h2>एआई पृष्ठभूमि अनुवाद</h2>
              <details>
                <summary style={{ cursor: "pointer" }}>जाँचका लागि खोल्नुहोस्</summary>
                <p className="admin-side-meta" style={{ whiteSpace: "pre-wrap" }}>
                  {revision.backTranslation}
                </p>
              </details>
            </section>
          ) : null}

          {revision && source?.rawText ? (
            <section className="admin-card">
              <h2>एआई पुनः तयार</h2>
              <RepromptForm
                articleId={article.id}
                revisionId={revision.id}
                version={revision.version}
              />
            </section>
          ) : null}

          {source ? (
            <section className="admin-card">
              <h2>स्रोत</h2>
              <p className="admin-side-meta">
                <strong>{source.publisher ?? "प्रकाशक अज्ञात"}</strong>
                <br />
                {source.originalTitle ?? "मूल शीर्षक छैन"}
                <br />
                अधिकार: {source.rightsStatus}
                <br />
                {source.url ? (
                  <a href={source.url} target="_blank" rel="noopener noreferrer">
                    मूल लिङ्क खोल्नुहोस् ↗
                  </a>
                ) : null}
              </p>
            </section>
          ) : null}
        </aside>
      </div>
    </>
  );
}
