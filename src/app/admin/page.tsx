import Link from "next/link";

import { StatusBadge } from "@/components/admin/status-badge";
import {
  getAdminArticles,
  getDashboardCounts,
  getRecentAudit,
} from "@/lib/articles";
import { formatNepaliDateTime } from "@/lib/content";

export default async function AdminDashboardPage() {
  const [counts, recent, audit] = await Promise.all([
    getDashboardCounts(),
    getAdminArticles(),
    getRecentAudit(8),
  ]);

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>ड्यासबोर्ड</h1>
          <p>आजको सम्पादकीय स्थिति र पछिल्ला गतिविधि।</p>
        </div>
        <div className="admin-quick">
          <Link href="/admin/stories/new">+ नयाँ स्टोरी</Link>
          <Link href="/admin/review">समीक्षा ({counts.NEEDS_REVIEW ?? 0})</Link>
          <Link href="/admin/audit">अडिट लग</Link>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">मस्यौदा</span>
          <span className="stat-value">{counts.DRAFT ?? 0}</span>
          <span className="stat-note">सम्पादन जारी</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">समीक्षामा</span>
          <span className="stat-value">{counts.NEEDS_REVIEW ?? 0}</span>
          <span className="stat-note">स्वीकृतिको प्रतीक्षामा</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">प्रकाशित</span>
          <span className="stat-value">{counts.PUBLISHED ?? 0}</span>
          <span className="stat-note">सार्वजनिक रूपमा उपलब्ध</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">तालिकाबद्ध</span>
          <span className="stat-value">{counts.SCHEDULED ?? 0}</span>
          <span className="stat-note">R1 मा सक्रिय हुने</span>
        </div>
      </div>

      <div className="admin-grid-2">
        <section className="admin-card">
          <h2>पछिल्ला स्टोरी</h2>
          {recent.length > 0 ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>शीर्षक</th>
                  <th>स्थिति</th>
                  <th>अद्यावधिक</th>
                </tr>
              </thead>
              <tbody>
                {recent.slice(0, 8).map((article) => (
                  <tr key={article.id}>
                    <td>
                      <Link href={`/admin/stories/${article.id}`}>
                        {article.revisionTitle ?? article.title}
                      </Link>
                      <div className="muted">{article.categoryName ?? "खण्ड छैन"}</div>
                    </td>
                    <td>
                      <StatusBadge
                        status={article.revisionStatus ?? article.status}
                      />
                      {article.revisionStatus && article.status === "PUBLISHED" ? (
                        <div className="muted">सार्वजनिक: प्रकाशित</div>
                      ) : null}
                    </td>
                    <td className="muted">
                      {formatNepaliDateTime(
                        article.revisionUpdatedAt ?? article.updatedAt,
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="admin-empty">
              अझै कुनै स्टोरी छैन।{" "}
              <Link href="/admin/stories/new">पहिलो मस्यौदा सुरु गर्नुहोस्</Link>।
            </p>
          )}
        </section>

        <section className="admin-card">
          <h2>पछिल्ला गतिविधि</h2>
          {audit.length > 0 ? (
            <table className="admin-table">
              <tbody>
                {audit.map((entry) => (
                  <tr key={entry.id}>
                    <td>
                      <strong style={{ fontSize: "0.76rem" }}>{entry.action}</strong>
                      <div className="muted">
                        {entry.actorEmail ?? "system"} · {entry.entityType}
                        {entry.entityId ? ` · ${entry.entityId.slice(0, 8)}` : ""}
                      </div>
                      <div className="muted">{formatNepaliDateTime(entry.createdAt)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="admin-empty">अडिट लग खाली छ।</p>
          )}
        </section>
      </div>
    </>
  );
}
