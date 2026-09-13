"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { Pencil, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { CityRow } from "@/lib/admin/catalog-queries";

const columnHelper = createColumnHelper<CityRow>();

export function CityListTable({ cities }: { cities: CityRow[] }) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const columns = [
    columnHelper.accessor("name", {
      header: "City",
      cell: (info) => (
        <span className="font-medium text-text-primary">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor("state", {
      header: "State",
      cell: (info) => (
        <span className="text-text-secondary">{info.getValue() ?? "—"}</span>
      ),
    }),
    columnHelper.accessor("country", {
      header: "Country",
      cell: (info) => (
        <span className="text-text-secondary">{info.getValue() ?? "—"}</span>
      ),
    }),
    columnHelper.accessor("slug", {
      header: "Slug",
      cell: (info) => (
        <code className="text-xs text-text-secondary bg-surface-2 px-1.5 py-0.5 rounded">
          {info.getValue()}
        </code>
      ),
    }),
    columnHelper.accessor("known_dish_count", {
      header: "Known Dishes",
      cell: (info) => (
        <span className="text-text-secondary">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor("is_active", {
      header: "Status",
      cell: (info) => {
        const row = info.row.original;
        return (
          <CityActiveToggle
            id={row.id}
            isActive={info.getValue() ?? false}
            onToggle={() => startTransition(() => router.refresh())}
            onError={setError}
          />
        );
      },
    }),
    columnHelper.accessor("unlocked_at", {
      header: "Unlocked",
      cell: (info) => {
        const value = info.getValue();
        return (
          <span
            className="text-text-secondary"
            title="Set when the city was activated (nightly threshold unlock or manual toggle)"
          >
            {value ? new Date(value).toLocaleDateString() : "—"}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: (info) => {
        const row = info.row.original;
        return (
          <Link
            href={`/admin/catalog/cities/${row.id}`}
            className="p-1.5 text-text-secondary hover:text-accent transition-colors inline-flex"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </Link>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: cities,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search cities..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full max-w-xs px-3 py-2 bg-surface-2 border border-border rounded text-text-primary placeholder:text-text-tertiary text-sm focus:outline-none focus:border-accent"
        />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded text-danger text-sm">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface-2">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider whitespace-nowrap"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={
                          header.column.getCanSort()
                            ? "flex items-center gap-1 cursor-pointer select-none hover:text-text-primary transition-colors"
                            : ""
                        }
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {header.column.getCanSort() && (
                          <span className="text-text-tertiary">
                            {header.column.getIsSorted() === "asc" ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : header.column.getIsSorted() === "desc" ? (
                              <ChevronDown className="w-3 h-3" />
                            ) : (
                              <ChevronsUpDown className="w-3 h-3" />
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-text-secondary"
                >
                  No cities found.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="bg-surface hover:bg-surface-2 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isPending && (
        <p className="mt-2 text-xs text-text-secondary">Refreshing...</p>
      )}
    </div>
  );
}

function CityActiveToggle({
  id,
  isActive,
  onToggle,
  onError,
}: {
  id: string;
  isActive: boolean;
  onToggle: () => void;
  onError: (msg: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(isActive);

  async function toggle() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("cities")
      .update({ is_active: !current })
      .eq("id", id);
    if (error) {
      onError(error.message);
    } else {
      setCurrent(!current);
      onToggle();
    }
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-colors ${
        current
          ? "bg-success/15 text-success border border-success/30 hover:bg-success/25"
          : "bg-surface-2 text-text-secondary border border-border hover:bg-surface-3"
      } disabled:opacity-50`}
    >
      {current ? "Active" : "Inactive"}
    </button>
  );
}
