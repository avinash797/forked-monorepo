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
        <span className="font-medium text-[#ECEDEE]">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor("state", {
      header: "State",
      cell: (info) => (
        <span className="text-[#9BA1A6]">{info.getValue() ?? "—"}</span>
      ),
    }),
    columnHelper.accessor("country", {
      header: "Country",
      cell: (info) => (
        <span className="text-[#9BA1A6]">{info.getValue() ?? "—"}</span>
      ),
    }),
    columnHelper.accessor("slug", {
      header: "Slug",
      cell: (info) => (
        <code className="text-xs text-[#9BA1A6] bg-[#1a0f08] px-1.5 py-0.5 rounded">
          {info.getValue()}
        </code>
      ),
    }),
    columnHelper.accessor("known_dish_count", {
      header: "Known Dishes",
      cell: (info) => (
        <span className="text-[#c9a492]">{info.getValue()}</span>
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
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: (info) => {
        const row = info.row.original;
        return (
          <Link
            href={`/admin/catalog/cities/${row.id}`}
            className="p-1.5 text-[#9BA1A6] hover:text-[#ee6c2b] transition-colors inline-flex"
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
          className="w-full max-w-xs px-3 py-2 bg-[#1a0f08] border border-[#4a3728] rounded text-[#ECEDEE] placeholder-[#9BA1A6] text-sm focus:outline-none focus:border-[#ee6c2b]"
        />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-[#4a3728]">
        <table className="w-full text-sm">
          <thead className="bg-[#1a0f08]">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-semibold text-[#9BA1A6] uppercase tracking-wider whitespace-nowrap"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={
                          header.column.getCanSort()
                            ? "flex items-center gap-1 cursor-pointer select-none hover:text-[#ECEDEE] transition-colors"
                            : ""
                        }
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && (
                          <span className="text-[#4a3728]">
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
          <tbody className="divide-y divide-[#4a3728]">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-[#9BA1A6]"
                >
                  No cities found.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="bg-[#342219] hover:bg-[#3d2a1f] transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
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
        <p className="mt-2 text-xs text-[#9BA1A6]">Refreshing...</p>
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
          ? "bg-green-900/30 text-green-400 border border-green-700 hover:bg-green-900/50"
          : "bg-[#1a0f08] text-[#9BA1A6] border border-[#4a3728] hover:bg-[#342219]"
      } disabled:opacity-50`}
    >
      {current ? "Active" : "Inactive"}
    </button>
  );
}
