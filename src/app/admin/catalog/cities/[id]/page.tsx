import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import {
  getCityById,
  getCityKnownDishes,
  getAllDishTypesForPicker,
} from "@/lib/admin/catalog-queries";
import { CityKnownDishesManager } from "@/components/admin/catalog/city-known-dishes-manager";

export const metadata = { title: "Edit City — Admin" };

export default async function EditCityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [city, knownDishes, allDishTypes] = await Promise.all([
    getCityById(id),
    getCityKnownDishes(id),
    getAllDishTypesForPicker(),
  ]);

  if (!city) notFound();

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/catalog/cities"
          className="flex items-center gap-1 text-sm text-[#9BA1A6] hover:text-[#ECEDEE] transition-colors mb-3"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Cities
        </Link>
        <h1 className="text-2xl font-bold text-[#ECEDEE]">{city.name}</h1>
        <p className="text-sm text-[#9BA1A6] mt-1">
          {[city.state, city.country].filter(Boolean).join(", ")}
          {" · "}
          <code className="font-mono text-xs">{city.slug}</code>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-[#342219] border border-[#4a3728] rounded-lg p-4">
            <h2 className="text-sm font-semibold text-[#c9a492] uppercase tracking-wider mb-3">
              Details
            </h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-[#9BA1A6]">Status</dt>
                <dd>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      city.is_active
                        ? "bg-green-900/30 text-green-400 border border-green-700"
                        : "bg-[#1a0f08] text-[#9BA1A6] border border-[#4a3728]"
                    }`}
                  >
                    {city.is_active ? "Active" : "Inactive"}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#9BA1A6]">State</dt>
                <dd className="text-[#ECEDEE]">{city.state ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#9BA1A6]">Country</dt>
                <dd className="text-[#ECEDEE]">{city.country ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#9BA1A6]">Slug</dt>
                <dd className="text-[#ECEDEE] font-mono text-xs">{city.slug}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-[#342219] border border-[#4a3728] rounded-lg p-6">
            <CityKnownDishesManager
              cityId={id}
              knownDishes={knownDishes}
              allDishTypes={allDishTypes}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
