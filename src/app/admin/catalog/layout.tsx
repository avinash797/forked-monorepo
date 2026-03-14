"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Dish Types", href: "/admin/catalog/dish-types" },
  { label: "Cities", href: "/admin/catalog/cities" },
  { label: "Badges", href: "/admin/catalog/badges" },
];

export default function CatalogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div>
      <div className="flex items-center gap-1 mb-6 border-b border-[#4a3728]">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                isActive
                  ? "border-[#ee6c2b] text-[#ee6c2b]"
                  : "border-transparent text-[#9BA1A6] hover:text-[#ECEDEE] hover:border-[#4a3728]"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
      {children}
    </div>
  );
}
