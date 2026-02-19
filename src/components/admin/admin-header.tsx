import type { AdminUser } from "@/lib/admin/auth";
import { AdminLogoutButton } from "./admin-logout-button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

type AdminHeaderProps = {
  admin: AdminUser;
};

export function AdminHeader({ admin }: AdminHeaderProps) {
  return (
    <header className="h-16 border-b border-border bg-bg/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30">
      <div />
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <span className="text-sm text-text-secondary">
          {admin.displayName || admin.email}
        </span>
        <AdminLogoutButton />
      </div>
    </header>
  );
}
