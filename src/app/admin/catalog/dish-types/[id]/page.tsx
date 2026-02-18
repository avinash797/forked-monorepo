import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import {
  getDishTypeById,
  getDishTypeVariations,
  getTasteTagsForDishType,
} from "@/lib/admin/catalog-queries";
import { DishTypeForm } from "@/components/admin/catalog/dish-type-form";
import { VariationManager } from "@/components/admin/catalog/variation-manager";
import { TasteTagManager } from "@/components/admin/catalog/taste-tag-manager";

export const metadata = { title: "Edit Dish Type — Admin" };

export default async function EditDishTypePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [dishType, variations, tasteTags] = await Promise.all([
    getDishTypeById(id),
    getDishTypeVariations(id),
    getTasteTagsForDishType(id),
  ]);

  if (!dishType) notFound();

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/catalog/dish-types"
          className="flex items-center gap-1 text-sm text-[#9BA1A6] hover:text-[#ECEDEE] transition-colors mb-3"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Dish Types
        </Link>
        <h1 className="text-2xl font-bold text-[#ECEDEE]">
          {dishType.emoji && <span className="mr-2">{dishType.emoji}</span>}
          {dishType.name}
        </h1>
        <p className="text-sm text-[#9BA1A6] mt-1 font-mono">{dishType.slug}</p>
      </div>

      <div className="space-y-6">
        <div className="bg-[#342219] border border-[#4a3728] rounded-lg p-6">
          <h2 className="text-sm font-semibold text-[#c9a492] uppercase tracking-wider mb-4">
            Dish Type Details
          </h2>
          <DishTypeForm dishType={dishType} />
        </div>

        <div className="bg-[#342219] border border-[#4a3728] rounded-lg p-6">
          <VariationManager dishTypeId={id} variations={variations} />
        </div>

        <div className="bg-[#342219] border border-[#4a3728] rounded-lg p-6">
          <TasteTagManager dishTypeId={id} tags={tasteTags} />
        </div>
      </div>
    </div>
  );
}
