"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import type { DishTypeVariationRow } from "@/lib/admin/catalog-queries";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

type EditingVariation = {
  id: string | null;
  name: string;
  slug: string;
  emoji: string;
  is_active: boolean;
  autoSlug: boolean;
};

export function VariationManager({
  dishTypeId,
  variations,
}: {
  dishTypeId: string;
  variations: DishTypeVariationRow[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState<Record<string, EditingVariation>>({});
  const [addingNew, setAddingNew] = useState(false);
  const [newRow, setNewRow] = useState<EditingVariation>({
    id: null,
    name: "",
    slug: "",
    emoji: "",
    is_active: true,
    autoSlug: true,
  });
  const [deleteTarget, setDeleteTarget] = useState<DishTypeVariationRow | null>(
    null,
  );
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  function startEdit(variation: DishTypeVariationRow) {
    setEditing((prev) => ({
      ...prev,
      [variation.id]: {
        id: variation.id,
        name: variation.name,
        slug: variation.slug,
        emoji: variation.emoji ?? "",
        is_active: variation.is_active ?? true,
        autoSlug: false,
      },
    }));
  }

  function cancelEdit(id: string) {
    setEditing((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function updateEditing(
    id: string,
    field: keyof EditingVariation,
    value: string | boolean,
  ) {
    setEditing((prev) => {
      const current = prev[id];
      if (!current) return prev;
      const updated = { ...current, [field]: value };
      if (field === "name" && current.autoSlug) {
        updated.slug = slugify(value as string);
      }
      if (field === "slug") updated.autoSlug = false;
      return { ...prev, [id]: updated };
    });
  }

  async function saveEdit(id: string) {
    const item = editing[id];
    if (!item) return;
    setSavingIds((prev) => new Set(prev).add(id));
    setError(null);

    const supabase = createClient();
    const { error: err } = await supabase
      .from("dish_type_variations")
      .update({
        name: item.name.trim(),
        slug: item.slug.trim(),
        emoji: item.emoji.trim() || null,
        is_active: item.is_active,
      })
      .eq("id", id);

    setSavingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

    if (err) {
      setError(err.message);
    } else {
      cancelEdit(id);
      startTransition(() => router.refresh());
    }
  }

  async function saveNew() {
    setSavingIds((prev) => new Set(prev).add("new"));
    setError(null);

    const supabase = createClient();
    const { error: err } = await supabase.from("dish_type_variations").insert({
      dish_type_id: dishTypeId,
      name: newRow.name.trim(),
      slug: newRow.slug.trim(),
      emoji: newRow.emoji.trim() || null,
      is_active: newRow.is_active,
    });

    setSavingIds((prev) => {
      const next = new Set(prev);
      next.delete("new");
      return next;
    });

    if (err) {
      setError(err.message);
    } else {
      setAddingNew(false);
      setNewRow({
        id: null,
        name: "",
        slug: "",
        emoji: "",
        is_active: true,
        autoSlug: true,
      });
      startTransition(() => router.refresh());
    }
  }

  async function handleDelete(variation: DishTypeVariationRow) {
    const supabase = createClient();
    const { error: err } = await supabase
      .from("dish_type_variations")
      .delete()
      .eq("id", variation.id);
    if (err) {
      setError(err.message);
    } else {
      setDeleteTarget(null);
      startTransition(() => router.refresh());
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
          Variations
        </h3>
        {!addingNew && (
          <button
            onClick={() => setAddingNew(true)}
            className="flex items-center gap-1.5 text-sm text-accent hover:text-accent/80 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        )}
      </div>

      {error && (
        <div className="mb-3 p-2 bg-danger/10 border border-danger/30 rounded text-danger text-xs">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-2">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold text-text-secondary uppercase">
                Name
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-text-secondary uppercase">
                Slug
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-text-secondary uppercase">
                Emoji
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-text-secondary uppercase">
                Status
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-text-secondary uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {variations.length === 0 && !addingNew && (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-4 text-center text-text-secondary text-xs bg-surface"
                >
                  No variations yet.
                </td>
              </tr>
            )}

            {variations.map((v) => {
              const isEdit = !!editing[v.id];
              const item = editing[v.id];
              const isSaving = savingIds.has(v.id);

              return (
                <tr
                  key={v.id}
                  className="bg-surface hover:bg-surface-2 transition-colors"
                >
                  <td className="px-3 py-2">
                    {isEdit ? (
                      <input
                        value={item.name}
                        onChange={(e) =>
                          updateEditing(v.id, "name", e.target.value)
                        }
                        className="w-full px-2 py-1 bg-surface-2 border border-border rounded text-text-primary text-sm focus:outline-none focus:border-accent"
                      />
                    ) : (
                      <span className="text-text-primary">{v.name}</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {isEdit ? (
                      <input
                        value={item.slug}
                        onChange={(e) =>
                          updateEditing(v.id, "slug", e.target.value)
                        }
                        className="w-full px-2 py-1 bg-surface-2 border border-border rounded text-text-primary font-mono text-xs focus:outline-none focus:border-accent"
                      />
                    ) : (
                      <code className="text-xs text-text-secondary bg-surface-2 px-1.5 py-0.5 rounded">
                        {v.slug}
                      </code>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {isEdit ? (
                      <input
                        value={item.emoji}
                        onChange={(e) =>
                          updateEditing(v.id, "emoji", e.target.value)
                        }
                        className="w-16 px-2 py-1 bg-surface-2 border border-border rounded text-text-primary text-lg focus:outline-none focus:border-accent"
                        maxLength={4}
                      />
                    ) : (
                      <span>{v.emoji ?? "—"}</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {isEdit ? (
                      <button
                        type="button"
                        onClick={() =>
                          updateEditing(v.id, "is_active", !item.is_active)
                        }
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          item.is_active
                            ? "bg-success/15 text-success border border-success/30"
                            : "bg-surface-2 text-text-secondary border border-border"
                        }`}
                      >
                        {item.is_active ? "Active" : "Inactive"}
                      </button>
                    ) : (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          v.is_active
                            ? "bg-success/15 text-success border border-success/30"
                            : "bg-surface-2 text-text-secondary border border-border"
                        }`}
                      >
                        {v.is_active ? "Active" : "Inactive"}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      {isEdit ? (
                        <>
                          <button
                            onClick={() => saveEdit(v.id)}
                            disabled={isSaving}
                            className="p-1 text-success hover:text-success/80 disabled:opacity-50"
                            title="Save"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => cancelEdit(v.id)}
                            className="p-1 text-text-secondary hover:text-text-primary"
                            title="Cancel"
                          >
                            <span className="text-xs">✕</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(v)}
                            className="p-1 text-text-secondary hover:text-accent"
                            title="Edit"
                          >
                            <span className="text-xs">Edit</span>
                          </button>
                          <button
                            onClick={() => setDeleteTarget(v)}
                            className="p-1 text-text-secondary hover:text-danger"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {addingNew && (
              <tr className="bg-surface-2/50">
                <td className="px-3 py-2">
                  <input
                    value={newRow.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setNewRow((prev) => ({
                        ...prev,
                        name,
                        slug: prev.autoSlug ? slugify(name) : prev.slug,
                      }));
                    }}
                    className="w-full px-2 py-1 bg-surface-2 border border-border rounded text-text-primary text-sm focus:outline-none focus:border-accent"
                    placeholder="Name"
                    autoFocus
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    value={newRow.slug}
                    onChange={(e) =>
                      setNewRow((prev) => ({
                        ...prev,
                        slug: e.target.value,
                        autoSlug: false,
                      }))
                    }
                    className="w-full px-2 py-1 bg-surface-2 border border-border rounded text-text-primary font-mono text-xs focus:outline-none focus:border-accent"
                    placeholder="slug"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    value={newRow.emoji}
                    onChange={(e) =>
                      setNewRow((prev) => ({ ...prev, emoji: e.target.value }))
                    }
                    className="w-16 px-2 py-1 bg-surface-2 border border-border rounded text-text-primary text-lg focus:outline-none focus:border-accent"
                    placeholder="🍲"
                    maxLength={4}
                  />
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() =>
                      setNewRow((prev) => ({
                        ...prev,
                        is_active: !prev.is_active,
                      }))
                    }
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      newRow.is_active
                        ? "bg-success/15 text-success border border-success/30"
                        : "bg-surface-2 text-text-secondary border border-border"
                    }`}
                  >
                    {newRow.is_active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={saveNew}
                      disabled={
                        savingIds.has("new") || !newRow.name || !newRow.slug
                      }
                      className="p-1 text-success hover:text-success/80 disabled:opacity-50"
                      title="Save"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setAddingNew(false)}
                      className="p-1 text-text-secondary hover:text-text-primary"
                      title="Cancel"
                    >
                      <span className="text-xs">✕</span>
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Variation"
          message={`Delete variation "${deleteTarget.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
