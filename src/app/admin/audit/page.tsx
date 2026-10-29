import { getRecentAudit } from "@/lib/articles";
import { formatNepaliDateTime } from "@/lib/content";

export default async function AuditPage() {
  const entries = await getRecentAudit(100);

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>अडिट लग</h1>
          <p>
            प्रकाशन, सम्पादन, भूमिका परिवर्तन र अन्य संवेदनशील
            कार्यको अभिलेख।
          </p>
        </div>
      </div>

      <section className="admin-card">
        {entries.length > 0 ? (
          <table className="admin-table">
            <thead>
              <tr>
                <th>समय</th>
                <th>कार्य</th>
                <th>वस्तु</th>
                <th>प्रयोगकर्ता</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="muted">{formatNepaliDateTime(entry.createdAt)}</td>
                  <td>
                    <strong>{entry.action}</strong>
                  </td>
                  <td className="muted">
                    {entry.entityType}
                    {entry.entityId ? ` · ${entry.entityId}` : ""}
                  </td>
                  <td>{entry.actorEmail ?? "system"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="admin-empty">अडिट लग खाली छ।</p>
        )}
      </section>
    </>
  );
}
