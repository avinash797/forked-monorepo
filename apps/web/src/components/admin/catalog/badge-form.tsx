"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FolderOpen, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type {
  BadgeDetail,
  BadgeCategory,
  BadgeRuleType,
  DishTypePickerItem,
} from "@/lib/admin/catalog-queries";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/(^_|_$)/g, "");
}

const CATEGORIES: { value: BadgeCategory; label: string }[] = [
  { value: "milestone", label: "Milestone" },
  { value: "battle", label: "Battle" },
  { value: "explorer", label: "Explorer" },
  { value: "dish_type", label: "Dish Type" },
];

const RULE_TYPES: { value: BadgeRuleType; label: string; description: string }[] = [
  { value: "total_ratings", label: "Total Ratings", description: "Awarded when user reaches a rating count threshold" },
  { value: "total_comparisons", label: "Total Comparisons", description: "Awarded when user reaches a battle count threshold" },
  { value: "cities_count", label: "Cities Count", description: "Awarded when user rates in multiple cities" },
  { value: "dish_types_count", label: "Dish Types Count", description: "Awarded when user rates multiple dish types" },
  { value: "dish_type_count", label: "Dish Type Count", description: "Awarded when user reaches ratings for a specific dish type" },
];

export function BadgeForm({
  badge,
  dishTypes,
}: {
  badge?: BadgeDetail | null;
  dishTypes: DishTypePickerItem[];
}) {
  const router = useRouter();
  const isEditing = !!badge;

  const [name, setName] = useState(badge?.name ?? "");
  const [slug, setSlug] = useState(badge?.slug ?? "");
  const [autoSlug, setAutoSlug] = useState(!isEditing);
  const [description, setDescription] = useState(badge?.description ?? "");
  const [imageUrl, setImageUrl] = useState(badge?.image_url ?? "");
  const [category, setCategory] = useState<BadgeCategory>(badge?.category ?? "milestone");
  const [ruleType, setRuleType] = useState<BadgeRuleType>(badge?.rule_type ?? "total_ratings");
  const [dishTypeId, setDishTypeId] = useState(badge?.dish_type_id ?? "");
  const [threshold, setThreshold] = useState(
    badge?.threshold != null ? String(badge.threshold) : ""
  );
  const [sortOrder, setSortOrder] = useState(String(badge?.sort_order ?? 0));
  const [isActive, setIsActive] = useState(badge?.is_active ?? true);
  const [isFeatured, setIsFeatured] = useState(badge?.is_featured ?? false);
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
        .from("badges")
        .list("", { limit: 200, sortBy: { column: "name", order: "asc" } });
      setBucketFiles((data ?? []).map((f) => f.name));
    } finally {
      setBucketLoading(false);
    }
  }

  function selectBucketFile(fileName: string) {
    const supabase = createClient();
    const { data } = supabase.storage.from("badges").getPublicUrl(fileName);
    setImageUrl(data.publicUrl);
    setBucketOpen(false);
  }

  useEffect(() => {
    if (autoSlug) {
      setSlug(slugify(name));
    }
  }, [name, autoSlug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const payload = {
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim(),
      image_url: imageUrl.trim(),
      category,
      rule_type: ruleType,
      dish_type_id: category === "dish_type" && dishTypeId ? dishTypeId : null,
      threshold: threshold ? parseInt(threshold, 10) : null,
      sort_order: parseInt(sortOrder, 10) || 0,
      is_active: isActive,
      is_featured: isFeatured,
    };

    try {
      if (isEditing) {
        const { error: err } = await supabase
          .from("badge_definitions")
          .update(payload)
          .eq("id", badge!.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase
          .from("badge_definitions")
          .insert(payload);
        if (err) throw err;
      }
      router.push("/admin/catalog/badges");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  const selectedRuleType = RULE_TYPES.find((r) => r.value === ruleType);

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
            placeholder="e.g. Foodie"
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
              placeholder="e.g. foodie"
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

        <div className="col-span-2">
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Description <span className="text-danger">*</span>
          </label>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-surface-2 border border-border rounded text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent resize-y"
            placeholder="What this badge means and how to earn it..."
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Image URL
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
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
          {imageUrl && (
            <div className="mt-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Badge preview"
                className="h-16 w-16 object-contain rounded border border-border bg-surface-2"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Category <span className="text-danger">*</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as BadgeCategory)}
            className="w-full px-3 py-2 bg-surface-2 border border-border rounded text-text-primary focus:outline-none focus:border-accent"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Sort Order
          </label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-full px-3 py-2 bg-surface-2 border border-border rounded text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
            placeholder="0"
            min="0"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Rule Type <span className="text-danger">*</span>
          </label>
          <select
            value={ruleType}
            onChange={(e) => setRuleType(e.target.value as BadgeRuleType)}
            className="w-full px-3 py-2 bg-surface-2 border border-border rounded text-text-primary focus:outline-none focus:border-accent"
          >
            {RULE_TYPES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          {selectedRuleType && (
            <p className="mt-1 text-xs text-text-tertiary">
              {selectedRuleType.description}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Threshold
            <span className="ml-1 text-xs font-normal text-text-tertiary">(required for most rules)</span>
          </label>
          <input
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            className="w-full px-3 py-2 bg-surface-2 border border-border rounded text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
            placeholder="e.g. 10"
            min="1"
          />
        </div>

        {category === "dish_type" && (
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Dish Type
            </label>
            <select
              value={dishTypeId}
              onChange={(e) => setDishTypeId(e.target.value)}
              className="w-full px-3 py-2 bg-surface-2 border border-border rounded text-text-primary focus:outline-none focus:border-accent"
            >
              <option value="">— None —</option>
              {dishTypes.map((dt) => (
                <option key={dt.id} value={dt.id}>
                  {dt.emoji ? `${dt.emoji} ` : ""}{dt.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              isActive ? "bg-accent" : "bg-surface-3"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isActive ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span className="text-sm text-text-secondary">
            {isActive ? "Active" : "Inactive"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsFeatured(!isFeatured)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              isFeatured ? "bg-yellow-500" : "bg-surface-3"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isFeatured ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span className="text-sm text-text-secondary">
            {isFeatured ? "Featured" : "Not featured"}
          </span>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 bg-accent hover:bg-accent/90 text-white font-medium rounded transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : isEditing ? "Update Badge" : "Create Badge"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/catalog/badges")}
          className="px-5 py-2 bg-surface border border-border hover:bg-surface-2 text-text-primary font-medium rounded transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
