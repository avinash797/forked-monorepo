import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getAllDishTypesForPicker } from "@/lib/admin/catalog-queries";
import { BadgeForm } from "@/components/admin/catalog/badge-form";

export const metadata = { title: "New Badge — Admin" };

export default async function NewBadgePage() {
  const dishTypes = await getAllDishTypesForPicker();

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/catalog/badges"
          className="flex items-center gap-1 text-sm text-text-tertiary hover:text-text-primary transition-colors mb-3"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Badges
        </Link>
        <h1 className="text-2xl font-bold text-text-primary">New Badge</h1>
      </div>

      <div className="bg-surface border border-border rounded-lg p-6">
        <BadgeForm dishTypes={dishTypes} />
      </div>
    </div>
  );
}
