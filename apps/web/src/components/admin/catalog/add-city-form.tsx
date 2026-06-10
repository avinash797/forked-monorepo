"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function AddCityForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [autoSlug, setAutoSlug] = useState(true);
  const [state, setState] = useState("");
  const [country, setCountry] = useState("USA");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (autoSlug) {
      const parts = [name, state, country].filter(Boolean);
      setSlug(slugify(parts.join(" ")));
    }
  }, [name, state, country, autoSlug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const supabase = createClient();
    try {
      const { data, error: err } = await supabase
        .from("cities")
        .insert({
          name: name.trim(),
          slug: slug.trim(),
          state: state.trim() || null,
          country: country.trim() || null,
          is_active: isActive,
        })
        .select("id")
        .single();

      if (err) throw err;
      router.push(`/admin/catalog/cities/${data.id}`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      {error && (
        <div className="p-3 bg-danger/10 border border-danger/30 rounded text-danger text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-text-secondary mb-1">
            City Name <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-surface-2 border border-border rounded text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
            placeholder="e.g. New Orleans"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            State
          </label>
          <input
            type="text"
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="w-full px-3 py-2 bg-surface-2 border border-border rounded text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
            placeholder="e.g. Louisiana"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">
            Country
          </label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full px-3 py-2 bg-surface-2 border border-border rounded text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
            placeholder="e.g. USA"
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
              placeholder="new-orleans-louisiana"
            />
            <button
              type="button"
              onClick={() => setAutoSlug(true)}
              className="px-3 py-2 text-xs bg-surface border border-border rounded text-text-secondary hover:text-text-primary hover:border-accent transition-colors"
            >
              Auto
            </button>
          </div>
        </div>
      </div>

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

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 bg-accent hover:bg-accent/90 text-white font-medium rounded transition-colors disabled:opacity-50"
        >
          {saving ? "Creating..." : "Create City"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/catalog/cities")}
          className="px-5 py-2 bg-surface border border-border hover:bg-surface-2 text-text-primary font-medium rounded transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
