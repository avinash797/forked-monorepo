import Link from "next/link";
import { ForkLogo } from "@/components/icons/fork-logo";
import { AdminNavLinks } from "./admin-nav-links";

export function AdminSidebar() {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#221610] border-r border-[rgba(236,237,238,0.08)] flex flex-col z-40">
      <div className="px-6 py-5 border-b border-[rgba(236,237,238,0.08)]">
        <Link href="/admin" className="flex items-center gap-3">
          <ForkLogo size={32} color="#FBBF24" />
          <span className="text-lg font-bold text-[#ECEDEE]">Forked Admin</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <AdminNavLinks />
      </nav>

      <div className="px-4 py-3 border-t border-[rgba(236,237,238,0.08)]">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-[#9BA1A6] hover:text-[#ECEDEE] transition-colors"
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
