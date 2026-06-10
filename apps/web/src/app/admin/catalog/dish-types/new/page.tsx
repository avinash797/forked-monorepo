import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { DishTypeForm } from "@/components/admin/catalog/dish-type-form";

export const metadata = { title: "New Dish Type — Admin" };

export default function NewDishTypePage() {
  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/catalog/dish-types"
          className="flex items-center gap-1 text-sm text-text-tertiary hover:text-text-primary transition-colors mb-3"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Dish Types
        </Link>
        <h1 className="text-2xl font-bold text-text-primary">New Dish Type</h1>
      </div>

      <div className="bg-surface border border-border rounded-lg p-6">
        <DishTypeForm />
      </div>
    </div>
  );
}
