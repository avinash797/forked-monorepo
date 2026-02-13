import Link from "next/link";

interface DishType {
  slug: string;
  name: string;
  emoji: string | null;
}

export function DishTypeTabs({
  dishTypes,
  citySlug,
  activeSlug,
}: {
  dishTypes: DishType[];
  citySlug: string;
  activeSlug?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={`/leaderboard/${citySlug}`}
        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-pill text-sm font-medium transition-colors ${
          !activeSlug
            ? "bg-accent text-accent-on"
            : "bg-surface-2 text-text-secondary hover:text-text-primary hover:bg-surface"
        }`}
      >
        All
      </Link>
      {dishTypes.map((dt) => (
        <Link
          key={dt.slug}
          href={`/leaderboard/${citySlug}/${dt.slug}`}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-pill text-sm font-medium transition-colors ${
            activeSlug === dt.slug
              ? "bg-accent text-accent-on"
              : "bg-surface-2 text-text-secondary hover:text-text-primary hover:bg-surface"
          }`}
        >
          {dt.emoji && <span>{dt.emoji}</span>}
          {dt.name}
        </Link>
      ))}
    </div>
  );
}
