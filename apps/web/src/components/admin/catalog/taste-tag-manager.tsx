"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import type { TasteTagRow } from "@/lib/admin/catalog-queries";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

type EditingTag = {
  name: string;
  slug: string;
  autoSlug: boolean;
};

export function TasteTagManager({
  dishTypeId,
  tags,
}: {
  dishTypeId: string;
  tags: TasteTagRow[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [editing, setEditing] = useState<Record<string, EditingTag>>({});
  const [addingNew, setAddingNew] = useState(false);
  const [newRow, setNewRow] = useState<EditingTag>({
    name: "",
    slug: "",
    autoSlug: true,
  });
  const [deleteTarget, setDeleteTarget] = useState<TasteTagRow | null>(null);
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  function startEdit(tag: TasteTagRow) {
    setEditing((prev) => ({
      ...prev,
      [tag.id]: { name: tag.name, slug: tag.slug, autoSlug: false },
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
    field: keyof EditingTag,
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
      .from("taste_tags")
      .update({ name: item.name.trim(), slug: item.slug.trim() })
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
    const { error: err } = await supabase.from("taste_tags").insert({
      dish_type_id: dishTypeId,
      name: newRow.name.trim(),
      slug: newRow.slug.trim(),
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
      setNewRow({ name: "", slug: "", autoSlug: true });
      startTransition(() => router.refresh());
    }
  }

  async function handleDelete(tag: TasteTagRow) {
    const supabase = createClient();
    const { error: err } = await supabase
      .from("taste_tags")
      .delete()
      .eq("id", tag.id);
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
          Taste Tags
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
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tags.length === 0 && !addingNew && (
              <tr>
                <td
                  colSpan={3}
                  className="px-3 py-4 text-center text-text-secondary text-xs bg-surface"
                >
                  No taste tags yet.
                </td>
              </tr>
            )}

            {tags.map((tag) => {
              const isEdit = !!editing[tag.id];
              const item = editing[tag.id];
              const isSaving = savingIds.has(tag.id);

              return (
                <tr
                  key={tag.id}
                  className="bg-surface hover:bg-surface-2 transition-colors"
                >
                  <td className="px-3 py-2">
                    {isEdit ? (
                      <input
                        value={item.name}
                        onChange={(e) =>
                          updateEditing(tag.id, "name", e.target.value)
                        }
                        className="w-full px-2 py-1 bg-surface-2 border border-border rounded text-text-primary text-sm focus:outline-none focus:border-accent"
                      />
                    ) : (
                      <span className="text-text-primary">{tag.name}</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {isEdit ? (
                      <input
                        value={item.slug}
                        onChange={(e) =>
                          updateEditing(tag.id, "slug", e.target.value)
                        }
                        className="w-full px-2 py-1 bg-surface-2 border border-border rounded text-text-primary font-mono text-xs focus:outline-none focus:border-accent"
                      />
                    ) : (
                      <code className="text-xs text-text-secondary bg-surface-2 px-1.5 py-0.5 rounded">
                        {tag.slug}
                      </code>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      {isEdit ? (
                        <>
                          <button
                            onClick={() => saveEdit(tag.id)}
                            disabled={isSaving}
                            className="p-1 text-success hover:text-success/80 disabled:opacity-50"
                            title="Save"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => cancelEdit(tag.id)}
                            className="p-1 text-text-secondary hover:text-text-primary"
                          >
                            <span className="text-xs">✕</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(tag)}
                            className="p-1 text-text-secondary hover:text-accent text-xs"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteTarget(tag)}
                            className="p-1 text-text-secondary hover:text-danger"
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
                    placeholder="Tag name"
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
                    placeholder="tag-slug"
                  />
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={saveNew}
                      disabled={
                        savingIds.has("new") || !newRow.name || !newRow.slug
                      }
                      className="p-1 text-success hover:text-success/80 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setAddingNew(false)}
                      className="p-1 text-text-secondary hover:text-text-primary"
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
          title="Delete Taste Tag"
          message={`Delete taste tag "${deleteTarget.name}"? This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={() => handleDelete(deleteTarget)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
