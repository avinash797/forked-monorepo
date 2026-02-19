"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import type { RestaurantForModeration } from "@/lib/admin/moderation-queries";

type RestaurantActionsProps = {
  restaurant: RestaurantForModeration;
};

export function RestaurantActions({ restaurant }: RestaurantActionsProps) {
  const router = useRouter();
  const [action, setAction] = useState<"verify" | "close" | null>(null);
  const [loading, setLoading] = useState(false);

  async function execute() {
    if (!action) return;
    setLoading(true);

    const supabase = createClient();

    if (action === "verify") {
      await supabase
        .from("restaurants")
        .update({ is_verified: true })
        .eq("id", restaurant.id);
    } else if (action === "close") {
      await supabase
        .from("restaurants")
        .update({
          is_closed: true,
          closed_at: new Date().toISOString(),
        })
        .eq("id", restaurant.id);
    }

    setLoading(false);
    setAction(null);
    router.refresh();
  }

  return (
    <>
      {action && (
        <ConfirmDialog
          title={action === "verify" ? "Verify Restaurant" : "Close Restaurant"}
          message={
            action === "verify"
              ? `Mark "${restaurant.name}" as verified?`
              : `Mark "${restaurant.name}" as permanently closed?`
          }
          confirmLabel={
            loading ? "Processing..." : action === "verify" ? "Verify" : "Close"
          }
          confirmVariant={action === "close" ? "danger" : "primary"}
          onConfirm={execute}
          onCancel={() => setAction(null)}
        />
      )}

      <div className="flex gap-2">
        {!restaurant.is_verified && (
          <button
            type="button"
            onClick={() => setAction("verify")}
            className="px-3 py-1 text-xs font-medium rounded-sm bg-success/15 text-success hover:bg-success/25 transition-colors cursor-pointer"
          >
            Verify
          </button>
        )}
        {!restaurant.is_closed && (
          <button
            type="button"
            onClick={() => setAction("close")}
            className="px-3 py-1 text-xs font-medium rounded-sm bg-danger/15 text-danger hover:bg-danger/25 transition-colors cursor-pointer"
          >
            Close
          </button>
        )}
      </div>
    </>
  );
}
