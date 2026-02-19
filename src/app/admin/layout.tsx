import { requireAdmin } from "@/lib/admin/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen bg-bg">
      <AdminSidebar />
      <div className="ml-64">
        <AdminHeader admin={admin} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
