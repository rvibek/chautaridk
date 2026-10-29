import { getAdminUsers } from "@/lib/admin";
import { requireSuperAdmin } from "@/lib/authz";
import { formatNepaliDateTime } from "@/lib/content";

const roleLabels = {
  SUPER_ADMIN: "सुपर एडमिन",
  ADMIN: "एडमिन",
  PUBLIC_USER: "पाठक",
};

export default async function UsersPage() {
  await requireSuperAdmin();
  const users = await getAdminUsers();

  return (
    <>
      <div className="admin-page-head">
        <div>
          <h1>प्रयोगकर्ता</h1>
          <p>
            सम्पादकीय पहुँच भएका खाता। नयाँ खाता Google लगइनपछि
            स्वीकृत इमेल सूचीबाट बन्छ।
          </p>
        </div>
      </div>

      <section className="admin-card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>नाम</th>
              <th>इमेल</th>
              <th>भूमिका</th>
              <th>स्थिति</th>
              <th>सिर्जना</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name ?? "—"}</td>
                <td>{user.email}</td>
                <td>{roleLabels[user.role]}</td>
                <td>{user.isActive ? "सक्रिय" : "निष्क्रिय"}</td>
                <td className="muted">{formatNepaliDateTime(user.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="admin-card">
        <h2>पहुँच नियन्त्रण</h2>
        <p className="admin-side-meta">
          प्रवेश अनुमति <code>ADMIN_ALLOWED_EMAILS</code> इन्भायरनमेन्ट
          सूचीबाट नियन्त्रित हुन्छ। सुपर एडमिन <code>SUPER_ADMIN_EMAILS</code>
          बाट तोकिन्छ। UI लुकाउनु सुरक्षा होइन — हरेक परिवर्तन सर्भरमा
          भूमिका जाँचपछि मात्र हुन्छ।
        </p>
      </section>
    </>
  );
}
