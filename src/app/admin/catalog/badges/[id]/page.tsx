import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getBadgeById, getAllDishTypesForPicker } from "@/lib/admin/catalog-queries";
import { BadgeForm } from "@/components/admin/catalog/badge-form";

export const metadata = { title: "Edit Badge — Admin" };

export default async function EditBadgePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [badge, dishTypes] = await Promise.all([
    getBadgeById(id),
    getAllDishTypesForPicker(),
  ]);

  if (!badge) notFound();

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/catalog/badges"
          className="flex items-center gap-1 text-sm text-text-tertiary hover:text-text-primary transition-colors mb-3"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Badges
        </Link>
        <h1 className="text-2xl font-bold text-text-primary">{badge.name}</h1>
        <p className="text-sm text-text-tertiary mt-1 font-mono">{badge.slug}</p>
      </div>

      <div className="bg-surface border border-border rounded-lg p-6">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
          Badge Details
        </h2>
        <BadgeForm badge={badge} dishTypes={dishTypes} />
      </div>
    </div>
  );
}
