import { requireAdmin } from "@/lib/admin/auth";

export default async function AdminDashboard() {
  const admin = await requireAdmin();

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Welcome, {admin.displayName || admin.email}</p>
    </div>
  );
}
