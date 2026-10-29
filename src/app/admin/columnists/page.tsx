import Link from "next/link";

import { getColumnists } from "@/lib/admin";
import { formatNepaliDateTime } from "@/lib/content";

export default async function ColumnistsPage() {
  const columnists = await getColumnists();

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>स्तम्भकार</h1>
          <p>
            विचार खण्डका निमन्त्रित लेखक। सार्वजनिक आवेदन लिइँदैन।
          </p>
        </div>
      </div>

      <section className="admin-card">
        {columnists.length > 0 ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>नाम</th>
                <th>स्लग</th>
                <th>स्थिति</th>
                <th>थपिएको</th>
              </tr>
            </thead>
            <tbody>
              {columnists.map((columnist) => (
                <tr key={columnist.id}>
                  <td>{columnist.name}</td>
                  <td className="muted">/{columnist.slug}</td>
                  <td>{columnist.isActive ? "सक्रिय" : "निष्क्रिय"}</td>
                  <td className="muted">{formatNepaliDateTime(columnist.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="admin-empty">
            अझै स्तम्भकार दर्ता छैन। R1 मा स्तम्भकार प्रोफाइल थप्ने
            सम्पादकीय सुविधा सक्रिय हुनेछ।
          </p>
        )}
      </section>

      <section className="admin-card">
        <h2>R1 मा थपिने</h2>
        <p className="admin-side-meta">
          स्तम्भकारको नाम, फोटो, परिचय र बायलाइन व्यवस्थापन; लेखसँग
          स्तम्भकार जोड्ने; “लेखकको व्यक्तिगत विचार” लेबल स्वचालित
          देखाउने।
        </p>
        <Link href="/admin/stories/new" className="btn btn--outline btn--sm">
          विचार लेख सुरु गर्नुहोस्
        </Link>
      </section>
    </>
  );
}
