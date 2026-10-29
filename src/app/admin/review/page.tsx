import Link from "next/link";

import { publishArticle } from "@/actions/articles";
import { StatusBadge } from "@/components/admin/status-badge";
import { getReviewQueue } from "@/lib/admin";
import { formatNepaliDateTime } from "@/lib/content";

export default async function ReviewPage() {
  const rows = await getReviewQueue();

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>समीक्षा पालो</h1>
          <p>
            समीक्षाका लागि पठाइएका मस्यौदा संस्करण। स्वीकृत गरेपछि मात्र
            सार्वजनिक लेख अद्यावधिक हुन्छ।
          </p>
        </div>
        <Link href="/admin/stories" className="btn btn--outline">
          सबै स्टोरी
        </Link>
      </div>

      <section className="admin-card">
        {rows.length > 0 ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>शीर्षक</th>
                <th>खण्ड</th>
                <th>स्थिति</th>
                <th>पठाइएको</th>
                <th>कार्य</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.revisionId}>
                  <td>
                    <Link href={`/admin/stories/${row.articleId}`}>
                      {row.title}
                    </Link>
                    <div className="muted">
                      /{row.slug} · मस्यौदा v{row.revisionNo}
                      {row.articleStatus === "PUBLISHED"
                        ? " · प्रकाशित लेखको अद्यावधिक"
                        : ""}
                    </div>
                    <div className="muted">
                      {row.authorEmail ?? "system"}
                    </div>
                  </td>
                  <td>{row.categoryName ?? "—"}</td>
                  <td>
                    <StatusBadge status={row.revisionStatus} />
                  </td>
                  <td className="muted">
                    {formatNepaliDateTime(row.updatedAt)}
                  </td>
                  <td>
                    <form action={publishArticle}>
                      <input type="hidden" name="articleId" value={row.articleId} />
                      <input type="hidden" name="revisionId" value={row.revisionId} />
                      <input
                        type="hidden"
                        name="version"
                        value={row.revisionVersion}
                      />
                      <button type="submit" className="btn btn--sm">
                        स्वीकृत र प्रकाशित
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="admin-empty">
            अहिले समीक्षाको प्रतीक्षामा कुनै मस्यौदा छैन।{" "}
            <Link href="/admin/stories/new">नयाँ स्टोरी सुरु गर्नुहोस्</Link>।
          </p>
        )}
      </section>

      <section className="admin-card">
        <h2>समीक्षा अभ्यास</h2>
        <p className="admin-side-meta">
          प्रकाशनअघि शीर्षक, डेक, स्रोत, मिति, नाम र उद्धरण जाँच्नुहोस्।
          एउटै सम्पादकले लेख तयार गरेको भए पनि स्वीकृति स्पष्ट रूपमा
          अडिट लगमा जान्छ। शंका भएमा मस्यौदा खारेज गरेर पुनः तयार गर्नुहोस्।
        </p>
      </section>
    </>
  );
}
