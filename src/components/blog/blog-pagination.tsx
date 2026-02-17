import Link from "next/link";
import { Button } from "@/components/ui/button";

interface BlogPaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
  categorySlug?: string;
}

function buildPageUrl(basePath: string, page: number, categorySlug?: string) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (categorySlug) params.set("category", categorySlug);
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function BlogPagination({
  currentPage,
  totalPages,
  basePath,
  categorySlug,
}: BlogPaginationProps) {
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 1 && i <= currentPage + 1)
    ) {
      pages.push(i);
    }
  }

  return (
    <nav aria-label="Blog pagination" className="flex items-center justify-center gap-2 mt-12">
      {currentPage > 1 && (
        <Link href={buildPageUrl(basePath, currentPage - 1, categorySlug)}>
          <Button variant="ghost" size="sm">
            Previous
          </Button>
        </Link>
      )}

      {pages.map((page, i) => {
        const prevPage = pages[i - 1];
        const showEllipsis = prevPage !== undefined && page - prevPage > 1;

        return (
          <span key={page} className="flex items-center gap-2">
            {showEllipsis && (
              <span className="text-text-tertiary px-1">...</span>
            )}
            <Link href={buildPageUrl(basePath, page, categorySlug)}>
              <Button
                variant={page === currentPage ? "primary" : "ghost"}
                size="sm"
              >
                {page}
              </Button>
            </Link>
          </span>
        );
      })}

      {currentPage < totalPages && (
        <Link href={buildPageUrl(basePath, currentPage + 1, categorySlug)}>
          <Button variant="ghost" size="sm">
            Next
          </Button>
        </Link>
      )}
    </nav>
  );
}
