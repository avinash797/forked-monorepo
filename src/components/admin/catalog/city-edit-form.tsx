"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { CityDetail } from "@/lib/admin/catalog-queries";

export function CityEditForm({ city }: { city: CityDetail }) {
  const router = useRouter();
  const [name, setName] = useState(city.name);
  const [state, setState] = useState(city.state ?? "");
  const [country, setCountry] = useState(city.country ?? "");
  const [isActive, setIsActive] = useState(city.is_active ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const supabase = createClient();
    const { error: err } = await supabase
      .from("cities")
      .update({
        name: name.trim(),
        state: state.trim() || null,
        country: country.trim() || null,
        is_active: isActive,
      })
      .eq("id", city.id);

    setSaving(false);

    if (err) {
      setError(err.message);
    } else {
      setSuccess(true);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-2 bg-red-900/20 border border-red-700 rounded text-red-400 text-xs">
          {error}
        </div>
      )}
      {success && (
        <div className="p-2 bg-green-900/20 border border-green-700 rounded text-green-400 text-xs">
          City updated successfully.
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-[#9BA1A6] mb-1">Name</label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 bg-[#1a0f08] border border-[#4a3728] rounded text-[#ECEDEE] text-sm focus:outline-none focus:border-[#ee6c2b]"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[#9BA1A6] mb-1">State</label>
        <input
          type="text"
          value={state}
          onChange={(e) => setState(e.target.value)}
          className="w-full px-3 py-2 bg-[#1a0f08] border border-[#4a3728] rounded text-[#ECEDEE] text-sm focus:outline-none focus:border-[#ee6c2b]"
          placeholder="e.g. Louisiana"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[#9BA1A6] mb-1">Country</label>
        <input
          type="text"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="w-full px-3 py-2 bg-[#1a0f08] border border-[#4a3728] rounded text-[#ECEDEE] text-sm focus:outline-none focus:border-[#ee6c2b]"
          placeholder="e.g. USA"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[#9BA1A6] mb-2">Slug</label>
        <code className="block px-3 py-2 bg-[#1a0f08] border border-[#4a3728] rounded text-[#9BA1A6] text-xs font-mono">
          {city.slug}
        </code>
        <p className="mt-1 text-xs text-[#9BA1A6]">Slug is read-only (changing it would break URLs).</p>
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              isActive ? "bg-[#ee6c2b]" : "bg-[#4a3728]"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isActive ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span className="text-sm text-[#c9a492]">
            {isActive ? "Active" : "Inactive"}
          </span>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-[#ee6c2b] hover:bg-[#f07d3a] text-white text-sm font-medium rounded transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
