import { getCities } from "@/lib/admin/catalog-queries";
import { CityListTable } from "@/components/admin/catalog/city-list-table";
import { AddCityForm } from "@/components/admin/catalog/add-city-form";

export const metadata = { title: "Cities — Admin" };

export default async function CitiesPage() {
  const cities = await getCities();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#ECEDEE]">Cities</h1>
        <p className="text-sm text-[#9BA1A6] mt-1">
          {cities.length} total {cities.length === 1 ? "city" : "cities"}
        </p>
      </div>

      <CityListTable cities={cities} />

      <div className="mt-8">
        <div className="bg-[#342219] border border-[#4a3728] rounded-lg p-6">
          <h2 className="text-sm font-semibold text-[#c9a492] uppercase tracking-wider mb-4">
            Add City Manually
          </h2>
          <p className="text-xs text-[#9BA1A6] mb-4">
            Cities normally enter via the mobile app&apos;s Google Places API flow. Use this form for admin-manual additions.
          </p>
          <AddCityForm />
        </div>
      </div>
    </div>
  );
}
