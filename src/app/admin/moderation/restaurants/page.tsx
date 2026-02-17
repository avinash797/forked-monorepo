import { getRestaurantsForModeration } from "@/lib/admin/moderation-queries";
import { RestaurantActions } from "@/components/admin/moderation/restaurant-actions";

type SearchParams = Promise<{
  search?: string;
  page?: string;
}>;

export default async function RestaurantModerationPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const search = params.search ?? "";
  const page = parseInt(params.page ?? "1", 10);

  const { restaurants, total } = await getRestaurantsForModeration({
    search,
    page,
    perPage: 25,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#ECEDEE]">Restaurants</h1>

      <div className="flex items-center gap-4">
        <form className="flex-1 max-w-sm">
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search restaurants..."
            className="w-full rounded-sm border border-[rgba(236,237,238,0.12)] bg-[#482f23] px-4 py-2 text-sm text-[#ECEDEE] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[rgba(238,108,43,0.40)]"
          />
        </form>
        <span className="text-sm text-[#9BA1A6]">{total} restaurants</span>
      </div>

      <div className="bg-[#342219] border border-[rgba(236,237,238,0.08)] rounded-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[rgba(236,237,238,0.08)]">
              <th className="text-left py-3 px-4 font-medium text-[#9BA1A6]">
                Name
              </th>
              <th className="text-left py-3 px-4 font-medium text-[#9BA1A6]">
                City
              </th>
              <th className="text-left py-3 px-4 font-medium text-[#9BA1A6]">
                Address
              </th>
              <th className="text-left py-3 px-4 font-medium text-[#9BA1A6]">
                Status
              </th>
              <th className="text-right py-3 px-4 font-medium text-[#9BA1A6]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {restaurants.map((r) => (
              <tr
                key={r.id}
                className="border-b border-[rgba(236,237,238,0.05)] hover:bg-[#3d2a1f]/50"
              >
                <td className="py-3 px-4 text-[#ECEDEE] font-medium">
                  {r.name}
                </td>
                <td className="py-3 px-4 text-[#c9a492]">
                  {r.city_name ?? "-"}
                </td>
                <td className="py-3 px-4 text-[#9BA1A6] max-w-xs truncate">
                  {r.address ?? "-"}
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-1.5">
                    {r.is_verified && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-pill bg-[#34D399]/15 text-[#34D399]">
                        Verified
                      </span>
                    )}
                    {r.is_closed && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-pill bg-[#EF4444]/15 text-[#F87171]">
                        Closed
                      </span>
                    )}
                    {!r.is_verified && !r.is_closed && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-pill bg-[#FBBF24]/15 text-[#FBBF24]">
                        Unverified
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 text-right">
                  <RestaurantActions restaurant={r} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {restaurants.length === 0 && (
          <div className="text-center py-12 text-[#9BA1A6]">
            <p>No restaurants found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
