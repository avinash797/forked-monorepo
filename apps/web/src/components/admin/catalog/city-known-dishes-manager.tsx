"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type {
  CityKnownDishRow,
  DishTypePickerItem,
} from "@/lib/admin/catalog-queries";

type CheckedItem = {
  dishTypeId: string;
  displayOrder: string;
};

export function CityKnownDishesManager({
  cityId,
  knownDishes,
  allDishTypes,
}: {
  cityId: string;
  knownDishes: CityKnownDishRow[];
  allDishTypes: DishTypePickerItem[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const initialChecked: Record<string, CheckedItem> = {};
  for (const kd of knownDishes) {
    initialChecked[kd.dish_type_id] = {
      dishTypeId: kd.dish_type_id,
      displayOrder: kd.display_order != null ? String(kd.display_order) : "",
    };
  }

  const [checked, setChecked] =
    useState<Record<string, CheckedItem>>(initialChecked);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [, startRefresh] = useTransition();

  function toggleDish(dishTypeId: string) {
    setChecked((prev) => {
      if (prev[dishTypeId]) {
        const next = { ...prev };
        delete next[dishTypeId];
        return next;
      }
      return {
        ...prev,
        [dishTypeId]: { dishTypeId, displayOrder: "" },
      };
    });
  }

  function updateOrder(dishTypeId: string, value: string) {
    setChecked((prev) => ({
      ...prev,
      [dishTypeId]: { ...prev[dishTypeId], displayOrder: value },
    }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(false);

    const supabase = createClient();

    try {
      const { error: deleteErr } = await supabase
        .from("city_known_dishes")
        .delete()
        .eq("city_id", cityId);

      if (deleteErr) throw deleteErr;

      const rows = Object.values(checked).map((item) => ({
        city_id: cityId,
        dish_type_id: item.dishTypeId,
        display_order: item.displayOrder
          ? parseInt(item.displayOrder, 10)
          : null,
      }));

      if (rows.length > 0) {
        const { error: insertErr } = await supabase
          .from("city_known_dishes")
          .insert(rows);
        if (insertErr) throw insertErr;
      }

      setSuccess(true);
      startRefresh(() => {});
      startTransition(() => router.refresh());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const checkedCount = Object.keys(checked).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
            Known Dishes
          </h3>
          <p className="text-xs text-text-tertiary mt-0.5">
            {checkedCount} of {allDishTypes.length} selected
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent/90 text-white text-sm font-medium rounded transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-danger/10 border border-danger/30 rounded text-danger text-xs">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-3 p-2 bg-success/15 border border-success/30 rounded text-success text-xs">
          Known dishes saved successfully.
        </div>
      )}

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-2">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold text-text-secondary uppercase w-10">
                <span className="sr-only">Checked</span>
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-text-secondary uppercase">
                Dish Type
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-text-secondary uppercase w-32">
                Display Order
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {allDishTypes.map((dt) => {
              const isChecked = !!checked[dt.id];
              return (
                <tr
                  key={dt.id}
                  className={`transition-colors cursor-pointer ${
                    isChecked
                      ? "bg-surface-2/50"
                      : "bg-surface hover:bg-surface-2"
                  }`}
                  onClick={() => toggleDish(dt.id)}
                >
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleDish(dt.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded border-border bg-surface-2 text-accent focus:ring-accent focus:ring-offset-0"
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-text-primary">
                      {dt.emoji && <span className="mr-1.5">{dt.emoji}</span>}
                      {dt.name}
                    </span>
                  </td>
                  <td
                    className="px-3 py-2.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isChecked && (
                      <input
                        type="number"
                        value={checked[dt.id].displayOrder}
                        onChange={(e) => updateOrder(dt.id, e.target.value)}
                        className="w-20 px-2 py-1 bg-surface-2 border border-border rounded text-text-primary text-xs focus:outline-none focus:border-accent"
                        placeholder="1"
                        min="1"
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
