import type { AdminUser } from "@/lib/admin/auth";
import { AdminLogoutButton } from "./admin-logout-button";

type AdminHeaderProps = {
  admin: AdminUser;
};

export function AdminHeader({ admin }: AdminHeaderProps) {
  return (
    <header className="h-16 border-b border-[rgba(236,237,238,0.08)] bg-[#221610] flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-4">
        <span className="text-sm text-[#c9a492]">
          {admin.displayName || admin.email}
        </span>
        <AdminLogoutButton />
      </div>
    </header>
  );
}
