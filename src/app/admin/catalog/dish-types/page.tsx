import Link from "next/link";
import { Plus } from "lucide-react";
import { getDishTypes } from "@/lib/admin/catalog-queries";
import { DishTypeListTable } from "@/components/admin/catalog/dish-type-list-table";

export const metadata = { title: "Dish Types — Admin" };

export default async function DishTypesPage() {
  const dishTypes = await getDishTypes();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#ECEDEE]">Dish Types</h1>
          <p className="text-sm text-[#9BA1A6] mt-1">
            {dishTypes.length} total dish {dishTypes.length === 1 ? "type" : "types"}
          </p>
        </div>
        <Link
          href="/admin/catalog/dish-types/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#ee6c2b] hover:bg-[#f07d3a] text-white font-medium rounded transition-colors text-sm"
        >
          <Plus className="w-4 h-4" /> New Dish Type
        </Link>
      </div>

      <DishTypeListTable dishTypes={dishTypes} />
    </div>
  );
}
