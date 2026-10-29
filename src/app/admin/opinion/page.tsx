import Link from "next/link";

import { StatusBadge } from "@/components/admin/status-badge";
import { getAdminArticles } from "@/lib/articles";
import { formatNepaliDateTime } from "@/lib/content";

export default async function AdminOpinionPage() {
  const articles = await getAdminArticles(undefined, "OPINION");

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>विचार</h1>
          <p>
            निमन्त्रित स्तम्भकारका लेख। सार्वजनिक रूपमा विचार लेख
            पेश गर्ने सुविधा छैन।
          </p>
        </div>
        <Link href="/admin/stories/new" className="btn">
          + नयाँ विचार
        </Link>
      </div>

      <section className="admin-card">
        {articles.length > 0 ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>शीर्षक</th>
                <th>स्थिति</th>
                <th>संस्करण</th>
                <th>अद्यावधिक</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr key={article.id}>
                  <td>
                    <Link href={`/admin/stories/${article.id}`}>
                      {article.title}
                    </Link>
                  </td>
                  <td>
                    <StatusBadge status={article.status} />
                  </td>
                  <td className="muted">v{article.version}</td>
                  <td className="muted">{formatNepaliDateTime(article.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="admin-empty">
            अझै विचार लेख छैन। नयाँ विचार सुरु गर्दा “विचार” खण्ड र
            स्तम्भकार विवरण थप्नुहोस्।
          </p>
        )}
      </section>
    </>
  );
}
