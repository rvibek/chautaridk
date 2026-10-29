import { getSettings } from "@/lib/admin";
import { formatNepaliDateTime } from "@/lib/content";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>सेटिङ</h1>
          <p>साइट, फिचर फ्ल्याग र सम्पादकीय पूर्वनिर्धारण।</p>
        </div>
      </div>

      <section className="admin-card">
        {settings.length > 0 ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>कुञ्जी</th>
                <th>मान</th>
                <th>अद्यावधिक</th>
              </tr>
            </thead>
            <tbody>
              {settings.map((setting) => (
                <tr key={setting.key}>
                  <td>
                    <code>{setting.key}</code>
                  </td>
                  <td>
                    <pre style={{ margin: 0, fontSize: "0.7rem", whiteSpace: "pre-wrap" }}>
                      {JSON.stringify(setting.value, null, 2)}
                    </pre>
                  </td>
                  <td className="muted">{formatNepaliDateTime(setting.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="admin-empty">कुनै सेटिङ छैन।</p>
        )}
      </section>

      <section className="admin-card">
        <h2>फिचर फ्ल्याग</h2>
        <p className="admin-side-meta">
          नेपाल र बहस खण्ड R2/R3 सम्म लुकाइएका छन्। न्यूजलेटर र
          टिप्पणी पनि क्रमशः सक्रिय हुनेछन्। खाली खण्ड सार्वजनिक
          गरिँदैन।
        </p>
      </section>
    </>
  );
}
