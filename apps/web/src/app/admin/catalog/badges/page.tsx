import Link from "next/link";
import { Plus } from "lucide-react";
import { getBadges } from "@/lib/admin/catalog-queries";
import { BadgeListTable } from "@/components/admin/catalog/badge-list-table";

export const metadata = { title: "Badges — Admin" };

export default async function BadgesPage() {
  const badges = await getBadges();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Badges</h1>
          <p className="text-sm text-text-secondary mt-1">
            {badges.length} total {badges.length === 1 ? "badge" : "badges"}
          </p>
        </div>
        <Link
          href="/admin/catalog/badges/new"
          className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/90 text-white font-medium rounded transition-colors text-sm"
        >
          <Plus className="w-4 h-4" /> New Badge
        </Link>
      </div>

      <BadgeListTable badges={badges} />
    </div>
  );
}
