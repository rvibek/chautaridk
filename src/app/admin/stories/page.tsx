import Link from "next/link";

import { StatusBadge } from "@/components/admin/status-badge";
import { getAdminArticles } from "@/lib/articles";
import { formatNepaliDateTime } from "@/lib/content";

const tabs = [
  { label: "सबै", value: "" },
  { label: "मस्यौदा", value: "DRAFT" },
  { label: "समीक्षामा", value: "NEEDS_REVIEW" },
  { label: "प्रकाशित", value: "PUBLISHED" },
  { label: "अभिलेख", value: "ARCHIVED" },
];

export default async function AdminStoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeStatus = status && status !== "all" ? status : undefined;
  const articles = await getAdminArticles(activeStatus);

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>स्टोरीहरू</h1>
          <p>मस्यौदा, समीक्षा र प्रकाशित सामग्रीको सूची।</p>
        </div>
        <Link href="/admin/stories/new" className="btn">
          + नयाँ स्टोरी
        </Link>
      </div>

      <nav className="category-pills" aria-label="स्थिति फिल्टर">
        {tabs.map((tab) => (
          <Link
            key={tab.value || "all"}
            href={tab.value ? `/admin/stories?status=${tab.value}` : "/admin/stories"}
            className={(activeStatus ?? "") === tab.value ? "active" : undefined}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <section className="admin-card">
        {articles.length > 0 ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>शीर्षक</th>
                <th>खण्ड</th>
                <th>स्थिति</th>
                <th>संस्करण</th>
                <th>अद्यावधिक</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr key={article.id}>
                  <td>
                    <Link href={`/admin/stories/${article.id}`}>
                      {article.revisionTitle ?? article.title}
                    </Link>
                    <div className="muted">
                      /{article.slug}
                      {article.status === "PUBLISHED" && article.revisionId
                        ? " · प्रकाशित लेखमा मस्यौदा परिवर्तन"
                        : ""}
                    </div>
                  </td>
                  <td>{article.categoryName ?? "—"}</td>
                  <td>
                    <StatusBadge
                      status={article.revisionStatus ?? article.status}
                    />
                    {article.revisionStatus && article.status === "PUBLISHED" ? (
                      <div className="muted">सार्वजनिक: प्रकाशित</div>
                    ) : null}
                  </td>
                  <td className="muted">
                    {article.revisionNo
                      ? `मस्यौदा v${article.revisionNo}`
                      : `v${article.version}`}
                  </td>
                  <td className="muted">
                    {formatNepaliDateTime(
                      article.revisionUpdatedAt ?? article.updatedAt,
                    )}
                  </td>
                  <td>
                    <Link href={`/admin/stories/${article.id}`}>खोल्नुहोस् →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="admin-empty">
            यो फिल्टरमा कुनै स्टोरी छैन।{" "}
            <Link href="/admin/stories/new">नयाँ स्टोरी सुरु गर्नुहोस्</Link>।
          </p>
        )}
      </section>
    </>
  );
}
