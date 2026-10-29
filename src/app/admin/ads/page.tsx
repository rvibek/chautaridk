import { getAdSlotsWithCampaigns } from "@/lib/admin";
import { requireSuperAdmin } from "@/lib/authz";

export default async function AdsPage() {
  await requireSuperAdmin();
  const rows = await getAdSlotsWithCampaigns();

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>विज्ञापन</h1>
          <p>
            प्रत्यक्ष हाउस विज्ञापनका स्लट र क्याम्पेन। सुपर एडमिन
            मात्र व्यवस्थापन गर्न सक्छ।
          </p>
        </div>
      </div>

      <section className="admin-card">
        {rows.length > 0 ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>स्लट</th>
                <th>स्थान</th>
                <th>क्याम्पेन</th>
                <th>लक्ष्य</th>
                <th>स्थिति</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={`${row.slot.id}-${row.campaign?.id ?? index}`}>
                  <td>
                    <strong>{row.slot.name}</strong>
                    <div className="muted">{row.slot.key}</div>
                  </td>
                  <td className="muted">{row.slot.placement}</td>
                  <td>{row.campaign?.name ?? "—"}</td>
                  <td className="muted">{row.campaign?.targetUrl ?? "—"}</td>
                  <td>
                    {row.slot.isActive && (row.campaign?.isActive ?? true)
                      ? "सक्रिय"
                      : "निष्क्रिय"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="admin-empty">कुनै विज्ञापन स्लट छैन।</p>
        )}
      </section>

      <section className="admin-card">
        <h2>R1 मा थपिने</h2>
        <p className="admin-side-meta">
          क्याम्पेन सिर्जना, तस्बिर/लिङ्क, सुरु–अन्त्य मिति, स्लट
          असाइन, प्रतिस्थापन र प्रदर्शन गणना। सबै विज्ञापन “AD 1”,
          “AD 2” जस्तै स्पष्ट लेबलसहित देखिन्छन्।
        </p>
      </section>
    </>
  );
}
