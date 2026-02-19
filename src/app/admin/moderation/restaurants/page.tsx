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
      <h1 className="text-2xl font-bold text-text-primary">Restaurants</h1>

      <div className="flex items-center gap-4">
        <form className="flex-1 max-w-sm">
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search restaurants..."
            className="w-full rounded-sm border border-input-border bg-input-bg px-4 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </form>
        <span className="text-sm text-text-secondary">{total} restaurants</span>
      </div>

      <div className="bg-surface border border-border rounded-sm overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-border">
              <th className="py-3 px-4 font-medium text-text-secondary">
                Name
              </th>
              <th className="py-3 px-4 font-medium text-text-secondary">
                City
              </th>
              <th className="py-3 px-4 font-medium text-text-secondary">
                Address
              </th>
              <th className="py-3 px-4 font-medium text-text-secondary">
                Status
              </th>
              <th className="text-right py-3 px-4 font-medium text-text-secondary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {restaurants.map((r) => (
              <tr
                key={r.id}
                className="border-b border-border/50 hover:bg-surface-2 transition-colors"
              >
                <td className="py-3 px-4 text-text-primary font-medium">
                  {r.name}
                </td>
                <td className="py-3 px-4 text-text-secondary">
                  {r.city_name ?? "-"}
                </td>
                <td className="py-3 px-4 text-text-tertiary max-w-xs truncate">
                  {r.address ?? "-"}
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-1.5">
                    {r.is_verified ? (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-pill bg-success/15 text-success">
                        Verified
                      </span>
                    ) : r.is_closed ? (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-pill bg-danger/15 text-danger">
                        Closed
                      </span>
                    ) : (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-pill bg-warning/15 text-warning">
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
          <div className="text-center py-12 text-text-secondary">
            <p>No restaurants found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
