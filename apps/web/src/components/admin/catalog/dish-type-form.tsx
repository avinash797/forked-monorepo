"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, FolderOpen, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { DishTypeDetail } from "@/lib/admin/catalog-queries";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function DishTypeForm({
  dishType,
}: {
  dishType?: DishTypeDetail | null;
}) {
  const router = useRouter();
  const isEditing = !!dishType;

  const [name, setName] = useState(dishType?.name ?? "");
  const [slug, setSlug] = useState(dishType?.slug ?? "");
  const [autoSlug, setAutoSlug] = useState(!isEditing);
  const [emoji, setEmoji] = useState(dishType?.emoji ?? "");
  const [icon, setIcon] = useState(dishType?.icon ?? "");
  const [placeholderPhotoUrl, setPlaceholderPhotoUrl] = useState(
    dishType?.placeholder_photo_url ?? "",
  );
  const [aliases, setAliases] = useState<string[]>(dishType?.aliases ?? []);
  const [launchOrder, setLaunchOrder] = useState(
    dishType?.launch_order != null ? String(dishType.launch_order) : "",
  );
  const [isActive, setIsActive] = useState(dishType?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [bucketFiles, setBucketFiles] = useState<string[]>([]);
  const [bucketOpen, setBucketOpen] = useState(false);
  const [bucketLoading, setBucketLoading] = useState(false);
  const bucketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!bucketOpen) return;
    const handle = (e: MouseEvent) => {
      if (bucketRef.current && !bucketRef.current.contains(e.target as Node)) {
        setBucketOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [bucketOpen]);

  async function openBucket() {
    setBucketOpen(true);
    if (bucketFiles.length > 0) return;
    setBucketLoading(true);
    try {
      const supabase = createClient();
      const { data } = await supabase.storage
        .from("dish_placeholders")
        .list("", { limit: 200, sortBy: { column: "name", order: "asc" } });
      console.log(data);
      setBucketFiles((data ?? []).map((f) => f.name));
    } finally {
      setBucketLoading(false);
    }
  }

  function selectBucketFile(fileName: string) {
    const supabase = createClient();
    const { data } = supabase.storage
      .from("dish_placeholders")
      .getPublicUrl(fileName);
    setPlaceholderPhotoUrl(data.publicUrl);
    setBucketOpen(false);
  }

  useEffect(() => {
    if (autoSlug) {
      setSlug(slugify(name));
    }
  }, [name, autoSlug]);

  function addAlias() {
    setAliases((prev) => [...prev, ""]);
  }

  function updateAlias(index: number, value: string) {
    setAliases((prev) => prev.map((a, i) => (i === index ? value : a)));
  }

  function removeAlias(index: number) {
    setAliases((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const payload = {
      name: name.trim(),
      slug: slug.trim(),
      emoji: emoji.trim() || null,
      icon: icon.trim() || null,
      placeholder_photo_url: placeholderPhotoUrl.trim() || null,
      aliases: aliases.filter((a) => a.trim() !== ""),
      launch_order: launchOrder ? parseInt(launchOrder, 10) : null,
      is_active: isActive,
    };

    try {
      if (isEditing) {
        const { error: err } = await supabase
          .from("dish_types")
          .update(payload)
          .eq("id", dishType!.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase
          .from("dish_types")
          .insert(payload);
        if (err) throw err;
      }
      router.push("/admin/catalog/dish-types");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="p-3 bg-danger/10 border border-danger/30 rounded text-danger text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Name <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-surface-2 border border-border rounded text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
            placeholder="e.g. Gumbo"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Slug <span className="text-danger">*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => {
                setAutoSlug(false);
                setSlug(e.target.value);
              }}
              className="flex-1 px-3 py-2 bg-surface-2 border border-border rounded text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent font-mono text-sm"
              placeholder="e.g. gumbo"
            />
            <button
              type="button"
              onClick={() => {
                setAutoSlug(true);
                setSlug(slugify(name));
              }}
              className="px-3 py-2 text-xs bg-surface border border-border rounded text-text-secondary hover:text-text-primary hover:border-accent transition-colors"
            >
              Auto
            </button>
          </div>
          {autoSlug && (
            <p className="mt-1 text-xs text-text-secondary">
              Auto-generated from name
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Emoji
          </label>
          <input
            type="text"
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            className="w-full px-3 py-2 bg-surface-2 border border-border rounded text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent text-2xl"
            placeholder="🍲"
            maxLength={4}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Launch Order
          </label>
          <input
            type="number"
            value={launchOrder}
            onChange={(e) => setLaunchOrder(e.target.value)}
            className="w-full px-3 py-2 bg-surface-2 border border-border rounded text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
            placeholder="1"
            min="1"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Icon <span className="text-text-tertiary text-xs">(SVG markup)</span>
          </label>
          <textarea
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            rows={5}
            className="w-full px-3 py-2 bg-surface-2 border border-border rounded text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent font-mono text-xs resize-y"
            placeholder="<svg xmlns=&quot;http://www.w3.org/2000/svg&quot; ...>...</svg>"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Placeholder Photo URL
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={placeholderPhotoUrl}
              onChange={(e) => setPlaceholderPhotoUrl(e.target.value)}
              className="flex-1 px-3 py-2 bg-surface-2 border border-border rounded text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent text-sm"
              placeholder="https://..."
            />
            <div className="relative" ref={bucketRef}>
              <button
                type="button"
                onClick={openBucket}
                className="flex items-center gap-1 px-3 py-2 text-xs bg-surface border border-border rounded text-text-secondary hover:text-text-primary hover:border-accent transition-colors whitespace-nowrap"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                Browse
                <ChevronDown className="w-3 h-3" />
              </button>
              {bucketOpen && (
                <div className="absolute right-0 top-full mt-1 z-50 w-72 bg-surface border border-border rounded shadow-lg max-h-64 overflow-y-auto">
                  {bucketLoading ? (
                    <p className="px-3 py-2 text-xs text-text-secondary">Loading...</p>
                  ) : bucketFiles.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-text-secondary">No files found.</p>
                  ) : (
                    bucketFiles.map((file) => (
                      <button
                        key={file}
                        type="button"
                        onClick={() => selectBucketFile(file)}
                        className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-surface-2 transition-colors truncate"
                      >
                        {file}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
          {placeholderPhotoUrl && (
            <div className="mt-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={placeholderPhotoUrl}
                alt="Placeholder preview"
                className="h-20 w-20 object-cover rounded border border-border"
              />
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-text-secondary">
            Aliases
          </label>
          <button
            type="button"
            onClick={addAlias}
            className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors"
          >
            <Plus className="w-3 h-3" /> Add alias
          </button>
        </div>
        <div className="space-y-2">
          {aliases.map((alias, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={alias}
                onChange={(e) => updateAlias(i, e.target.value)}
                className="flex-1 px-3 py-2 bg-surface-2 border border-border rounded text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent text-sm"
                placeholder="Alternative name..."
              />
              <button
                type="button"
                onClick={() => removeAlias(i)}
                className="p-2 text-text-secondary hover:text-danger transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          {aliases.length === 0 && (
            <p className="text-xs text-text-secondary italic">
              No aliases added yet.
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsActive(!isActive)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isActive ? "bg-accent" : "bg-surface-3"
            }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isActive ? "translate-x-6" : "translate-x-1"
              }`}
          />
        </button>
        <span className="text-sm text-text-secondary">
          {isActive ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 bg-accent hover:bg-accent/90 text-white font-medium rounded transition-colors disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : isEditing
              ? "Update Dish Type"
              : "Create Dish Type"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/catalog/dish-types")}
          className="px-5 py-2 bg-surface border border-border hover:bg-surface-2 text-text-primary font-medium rounded transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
