"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { track } from "@vercel/analytics";

interface Category {
  name: string;
  slug: string;
}

export function BlogCategoryFilter({
  categories,
}: {
  categories: Category[];
}) {
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category");

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/blog"
        onClick={() => track("blog_category_filter", { category: "all" })}
        className={`inline-flex items-center px-4 py-2 rounded-pill text-sm font-medium transition-colors ${
          !activeCategory
            ? "bg-accent text-accent-on"
            : "bg-surface-2 text-text-secondary hover:text-text-primary hover:bg-surface"
        }`}
      >
        All
      </Link>
      {categories.map((cat) => (
        <Link
          key={cat.slug}
          href={`/blog?category=${cat.slug}`}
          onClick={() => track("blog_category_filter", { category: cat.slug })}
          className={`inline-flex items-center px-4 py-2 rounded-pill text-sm font-medium transition-colors ${
            activeCategory === cat.slug
              ? "bg-accent text-accent-on"
              : "bg-surface-2 text-text-secondary hover:text-text-primary hover:bg-surface"
          }`}
        >
          {cat.name}
        </Link>
      ))}
    </div>
  );
}
