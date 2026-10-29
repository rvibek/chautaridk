import { getAiModels } from "@/lib/admin";
import { requireSuperAdmin } from "@/lib/authz";
import { formatNepaliDateTime } from "@/lib/content";

export default async function ModelsPage() {
  await requireSuperAdmin();
  const models = await getAiModels();

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>एआई मोडेल</h1>
          <p>
            अनुवाद र पुनर्लेखनका लागि उपलब्ध मोडेलको रजिस्ट्री।
            Gemini पहिलो पूर्वनिर्धारित मोडेल हो।
          </p>
        </div>
      </div>

      <section className="admin-card">
        {models.length > 0 ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>मोडेल</th>
                <th>प्रदायक</th>
                <th>मोडेल ID</th>
                <th>पूर्वनिर्धारित</th>
                <th>स्थिति</th>
              </tr>
            </thead>
            <tbody>
              {models.map((model) => (
                <tr key={model.id}>
                  <td>
                    <strong>{model.name}</strong>
                    <div className="muted">
                      थपिएको: {formatNepaliDateTime(model.createdAt)}
                    </div>
                  </td>
                  <td>{model.providerName}</td>
                  <td className="muted">{model.modelId}</td>
                  <td>{model.isDefault ? "हो" : "—"}</td>
                  <td>{model.isActive ? "सक्रिय" : "निष्क्रिय"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="admin-empty">कुनै एआई मोडेल दर्ता छैन।</p>
        )}
      </section>

      <section className="admin-card">
        <h2>R1 मा थपिने</h2>
        <p className="admin-side-meta">
          नयाँ प्रदायक/मोडेल थप्ने, API कुञ्जी इन्क्रिप्ट गरेर
          सुरक्षित गर्ने, जडान परीक्षण, पूर्वनिर्धारित र फलब्याक
          क्रम बदल्ने, र मोडेल निष्क्रिय गर्ने (हटाउने होइन) सुविधा
          R1 मा सक्रिय हुनेछ। पुराना संस्करणको पुनरुत्पादनका लागि
          मोडेल हटाइँदैन।
        </p>
      </section>
    </>
  );
}
