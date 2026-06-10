import Link from "next/link";
import { ForkLogo } from "@/components/icons/fork-logo";
import { AdminNavLinks } from "./admin-nav-links";

type AdminSidebarProps = {
  pendingReportCount: number;
};

export function AdminSidebar({ pendingReportCount }: AdminSidebarProps) {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-surface border-r border-border flex flex-col z-40">
      <div className="px-6 py-5 border-b border-border">
        <Link href="/admin" className="flex items-center gap-3">
          <ForkLogo size={32} color="var(--gold)" />
          <span className="text-lg font-bold text-text-primary">
            Forked Admin
          </span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <AdminNavLinks pendingReportCount={pendingReportCount} />
      </nav>

      <div className="px-4 py-3 border-t border-border">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to site
        </Link>
      </div>
    </aside>
  );
}
