"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import type { AdminUserDetail } from "@/lib/admin/user-queries";

type UserModerationPanelProps = {
  user: AdminUserDetail;
  currentAdminId: string;
};

type ActionType = "ban" | "unban" | "warn" | "make_admin" | "remove_admin";

export function UserModerationPanel({
  user,
  currentAdminId,
}: UserModerationPanelProps) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<ActionType | null>(null);
  const [banReason, setBanReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSelf = user.id === currentAdminId;

  async function executeAction() {
    if (!pendingAction) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();

    try {
      switch (pendingAction) {
        case "ban": {
          const { error: banError } = await supabase
            .from("profiles")
            .update({
              is_banned: true,
              banned_at: new Date().toISOString(),
              ban_reason: banReason || null,
            })
            .eq("id", user.id);
          if (banError) throw banError;
          break;
        }
        case "unban": {
          const { error: unbanError } = await supabase
            .from("profiles")
            .update({
              is_banned: false,
              banned_at: null,
              ban_reason: null,
            })
            .eq("id", user.id);
          if (unbanError) throw unbanError;
          break;
        }
        case "warn": {
          const { error: warnError } = await supabase
            .from("profiles")
            .update({
              warned_at: new Date().toISOString(),
              warn_count: user.warn_count + 1,
            })
            .eq("id", user.id);
          if (warnError) throw warnError;
          break;
        }
        case "make_admin": {
          const { error: roleError } = await supabase
            .from("profiles")
            .update({ role: "admin" })
            .eq("id", user.id);
          if (roleError) throw roleError;
          break;
        }
        case "remove_admin": {
          const { error: roleError } = await supabase
            .from("profiles")
            .update({ role: "user" })
            .eq("id", user.id);
          if (roleError) throw roleError;
          break;
        }
      }

      // Log the action
      await supabase.from("admin_actions").insert({
        admin_id: currentAdminId,
        action_type: pendingAction,
        target_type: "user",
        target_id: user.id,
        details: pendingAction === "ban" ? { reason: banReason } : null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Action failed";
      setError(message);
      setLoading(false);
      setPendingAction(null);
      return;
    }

    setLoading(false);
    setPendingAction(null);
    setBanReason("");
    router.refresh();
  }

  const actionConfigs: Record<
    ActionType,
    {
      title: string;
      message: string;
      label: string;
      variant: "danger" | "primary";
    }
  > = {
    ban: {
      title: "Ban User",
      message: `Are you sure you want to ban ${user.display_name || "this user"}?`,
      label: "Ban User",
      variant: "danger",
    },
    unban: {
      title: "Unban User",
      message: `Unban ${user.display_name || "this user"}? They will regain access.`,
      label: "Unban",
      variant: "primary",
    },
    warn: {
      title: "Issue Warning",
      message: `Issue a warning to ${user.display_name || "this user"}? (Current warnings: ${user.warn_count})`,
      label: "Warn",
      variant: "primary",
    },
    make_admin: {
      title: "Grant Admin",
      message: `Grant admin privileges to ${user.display_name || "this user"}?`,
      label: "Make Admin",
      variant: "primary",
    },
    remove_admin: {
      title: "Remove Admin",
      message: `Remove admin privileges from ${user.display_name || "this user"}?`,
      label: "Remove Admin",
      variant: "danger",
    },
  };

  return (
    <>
      {pendingAction && (
        <ConfirmDialog
          title={actionConfigs[pendingAction].title}
          message={actionConfigs[pendingAction].message}
          confirmLabel={
            loading ? "Processing..." : actionConfigs[pendingAction].label
          }
          confirmVariant={actionConfigs[pendingAction].variant}
          onConfirm={executeAction}
          onCancel={() => {
            setPendingAction(null);
            setBanReason("");
          }}
        />
      )}

      <div className="bg-surface border border-border rounded-sm p-5">
        <h3 className="text-lg font-semibold text-text-primary mb-4">
          Moderation Actions
        </h3>

        {error && (
          <div className="rounded-sm bg-danger/10 border border-danger/30 px-4 py-3 text-sm text-danger mb-4">
            {error}
          </div>
        )}

        {isSelf && (
          <p className="text-sm text-text-secondary mb-4">
            You cannot moderate your own account.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {!user.is_banned ? (
            <>
              <button
                type="button"
                onClick={() => setPendingAction("warn")}
                disabled={isSelf}
                className="px-4 py-2 rounded-sm text-sm font-medium bg-warning/15 text-warning hover:bg-warning/25 disabled:opacity-45 transition-colors cursor-pointer"
              >
                Warn
              </button>
              <button
                type="button"
                onClick={() => setPendingAction("ban")}
                disabled={isSelf}
                className="px-4 py-2 rounded-sm text-sm font-medium bg-danger/15 text-danger hover:bg-danger/25 disabled:opacity-45 transition-colors cursor-pointer"
              >
                Ban
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setPendingAction("unban")}
              disabled={isSelf}
              className="px-4 py-2 rounded-sm text-sm font-medium bg-success/15 text-success hover:bg-success/25 disabled:opacity-45 transition-colors cursor-pointer"
            >
              Unban
            </button>
          )}

          {user.role !== "admin" ? (
            <button
              type="button"
              onClick={() => setPendingAction("make_admin")}
              disabled={isSelf}
              className="px-4 py-2 rounded-sm text-sm font-medium bg-accent/15 text-accent hover:bg-accent/25 disabled:opacity-45 transition-colors cursor-pointer"
            >
              Make Admin
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setPendingAction("remove_admin")}
              disabled={isSelf}
              className="px-4 py-2 rounded-sm text-sm font-medium bg-danger/15 text-danger hover:bg-danger/25 disabled:opacity-45 transition-colors cursor-pointer"
            >
              Remove Admin
            </button>
          )}
        </div>

        {pendingAction === "ban" && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Ban Reason (optional)
            </label>
            <input
              type="text"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              className="w-full rounded-sm border border-border bg-surface-2 px-4 py-2.5 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40"
              placeholder="Reason for banning..."
            />
          </div>
        )}
      </div>
    </>
  );
}
