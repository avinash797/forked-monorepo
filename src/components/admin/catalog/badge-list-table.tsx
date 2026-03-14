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
import {
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import type { BadgeRow } from "@/lib/admin/catalog-queries";

const CATEGORY_LABELS: Record<string, string> = {
  milestone: "Milestone",
  battle: "Battle",
  explorer: "Explorer",
  dish_type: "Dish Type",
};

const CATEGORY_COLORS: Record<string, string> = {
  milestone: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  battle: "bg-red-500/15 text-red-400 border-red-500/30",
  explorer: "bg-green-500/15 text-green-400 border-green-500/30",
  dish_type: "bg-purple-500/15 text-purple-400 border-purple-500/30",
};

const columnHelper = createColumnHelper<BadgeRow>();

export function BadgeListTable({ badges }: { badges: BadgeRow[] }) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<BadgeRow | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const columns = [
    columnHelper.accessor("name", {
      header: "Name",
      cell: (info) => (
        <div>
          <span className="font-medium text-text-primary">{info.getValue()}</span>
          {info.row.original.is_featured && (
            <span className="ml-2 text-xs text-yellow-400">Featured</span>
          )}
        </div>
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
    columnHelper.accessor("category", {
      header: "Category",
      cell: (info) => {
        const cat = info.getValue();
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${CATEGORY_COLORS[cat] ?? "bg-surface-2 text-text-secondary border-border"}`}
          >
            {CATEGORY_LABELS[cat] ?? cat}
          </span>
        );
      },
    }),
    columnHelper.accessor("rule_type", {
      header: "Rule Type",
      cell: (info) => (
        <span className="text-xs text-text-secondary font-mono">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor("threshold", {
      header: "Threshold",
      cell: (info) => (
        <span className="text-text-secondary">{info.getValue() ?? "—"}</span>
      ),
    }),
    columnHelper.accessor("sort_order", {
      header: "Order",
      cell: (info) => (
        <span className="text-text-secondary">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor("earned_count", {
      header: "Earned",
      cell: (info) => (
        <span className="text-text-secondary">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor("is_active", {
      header: "Status",
      cell: (info) => {
        const row = info.row.original;
        return (
          <ActiveToggle
            id={row.id}
            isActive={info.getValue()}
            onToggle={() => startTransition(() => router.refresh())}
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
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/catalog/badges/${row.id}`}
              className="p-1.5 text-text-secondary hover:text-accent transition-colors"
              title="Edit"
            >
              <Pencil className="w-4 h-4" />
            </Link>
            <button
              onClick={() => setDeleteTarget(row)}
              className="p-1.5 text-text-secondary hover:text-danger transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      },
    }),
  ];

  const table = useReactTable({
    data: badges,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  async function handleDelete(badge: BadgeRow) {
    const supabase = createClient();
    const { error: err } = await supabase
      .from("badge_definitions")
      .delete()
      .eq("id", badge.id);
    if (err) {
      setError(err.message);
    } else {
      setDeleteTarget(null);
      startTransition(() => router.refresh());
    }
  }

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search badges..."
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
                          header.getContext()
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
                  No badges found.
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
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
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

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Badge"
          message={`Are you sure you want to delete "${deleteTarget.name}"? This will also remove it from all users who have earned it.`}
          confirmLabel="Delete"
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

function ActiveToggle({
  id,
  isActive,
  onToggle,
}: {
  id: string;
  isActive: boolean;
  onToggle: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(isActive);

  async function toggle() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("badge_definitions")
      .update({ is_active: !current })
      .eq("id", id);
    if (!error) {
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
