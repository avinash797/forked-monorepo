"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ContentReport } from "@/lib/admin/report-queries";
import type { Database } from "@/types/database.types";
import type { AnonymizeUserDataResponse } from "@/types/rpc.types";

type Json = Database["public"]["Tables"]["admin_actions"]["Insert"]["details"];

type ReportActionsPanelProps = {
  report: ContentReport;
  currentAdminId: string;
};

type ActionType =
  | "take_down_photo"
  | "warn_user"
  | "ban_user"
  | "delete_rating"
  | "dismiss"
  | "mark_reviewed";

type ActionConfig = {
  title: string;
  description: string;
  buttonLabel: string;
  confirmLabel: string;
  variant: "danger" | "primary" | "warning";
  needsRating: boolean;
  needsReportedUser: boolean;
};

const ACTION_CONFIGS: Record<ActionType, ActionConfig> = {
  take_down_photo: {
    title: "Take down photo",
    description:
      "Removes the photo from this rating (storage object deleted). Rating score and battle history are preserved.",
    buttonLabel: "Take down photo",
    confirmLabel: "Take down",
    variant: "danger",
    needsRating: true,
    needsReportedUser: false,
  },
  warn_user: {
    title: "Warn user",
    description:
      "Increments the user's warning counter and records the warning. They retain full access.",
    buttonLabel: "Warn user",
    confirmLabel: "Issue warning",
    variant: "warning",
    needsRating: false,
    needsReportedUser: true,
  },
  ban_user: {
    title: "Ban & anonymize account",
    description:
      "Treats as a forced account deletion: anonymizes personal info (name, email, avatar, bio, photos) while preserving rating scores for community leaderboards. User cannot sign back in. This action is not reversible.",
    buttonLabel: "Ban & anonymize",
    confirmLabel: "Ban & anonymize",
    variant: "danger",
    needsRating: false,
    needsReportedUser: true,
  },
  delete_rating: {
    title: "Delete rating",
    description:
      "Permanently deletes the entire rating (photo, score, battles). Use only when the rating itself is invalid — prefer 'Take down photo' for PII/inappropriate imagery.",
    buttonLabel: "Delete rating",
    confirmLabel: "Delete rating",
    variant: "danger",
    needsRating: true,
    needsReportedUser: false,
  },
  dismiss: {
    title: "Dismiss report",
    description:
      "Report is unfounded or duplicate. No action taken against user or content.",
    buttonLabel: "Dismiss",
    confirmLabel: "Dismiss report",
    variant: "primary",
    needsRating: false,
    needsReportedUser: false,
  },
  mark_reviewed: {
    title: "Mark reviewed",
    description:
      "Seen and evaluated, no action warranted at this time. Use 'Dismiss' if the report was clearly unfounded.",
    buttonLabel: "Mark reviewed",
    confirmLabel: "Mark reviewed",
    variant: "primary",
    needsRating: false,
    needsReportedUser: false,
  },
};

const VARIANT_CLASSES: Record<ActionConfig["variant"], string> = {
  danger: "bg-danger/15 text-danger hover:bg-danger/25",
  warning: "bg-warning/15 text-warning hover:bg-warning/25",
  primary: "bg-surface-2 text-text-primary hover:bg-surface-2/80",
};

const VARIANT_CONFIRM_CLASSES: Record<ActionConfig["variant"], string> = {
  danger: "bg-danger text-white hover:bg-danger/90",
  warning: "bg-warning text-white hover:bg-warning/90",
  primary: "bg-accent text-white hover:bg-accent/90",
};

export function ReportActionsPanel({
  report,
  currentAdminId,
}: ReportActionsPanelProps) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<ActionType | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rating = report.rating;
  const reportedUser = rating?.reported_user ?? null;
  const alreadyResolved = report.status !== "pending";

  async function execute() {
    if (!pendingAction) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const now = new Date().toISOString();

    try {
      const actionDetails: { [key: string]: Json | undefined } = {
        resolution_action: pendingAction,
        reason: report.reason,
        reported_rating_id: report.reported_rating_id,
        reported_user_id: reportedUser?.id ?? null,
      };
      if (notes.trim()) actionDetails.admin_notes = notes.trim();

      switch (pendingAction) {
        case "take_down_photo": {
          if (!rating) throw new Error("Rating missing from report");
          if (rating.photo_storage_path) {
            const { error: storageError } = await supabase.storage
              .from("ratings")
              .remove([rating.photo_storage_path]);
            // Don't abort on storage errors — the DB update is the
            // source of truth. Log via admin notes if this happens.
            if (storageError) {
              actionDetails.storage_error = storageError.message;
            }
          }
          const { error: ratingErr } = await supabase
            .from("personal_ratings")
            .update({ photo_url: null, photo_storage_path: null })
            .eq("id", rating.id);
          if (ratingErr) throw ratingErr;
          break;
        }

        case "warn_user": {
          if (!reportedUser) throw new Error("Reported user missing");
          const { error: warnErr } = await supabase
            .from("profiles")
            .update({
              warned_at: now,
              warn_count: reportedUser.warn_count + 1,
            })
            .eq("id", reportedUser.id);
          if (warnErr) throw warnErr;
          break;
        }

        case "ban_user": {
          if (!reportedUser) throw new Error("Reported user missing");
          // Anonymize first (strips PII + photos, preserves rating scores).
          const { data: rpcData, error: rpcErr } = await supabase.rpc(
            "anonymize_user_data",
            { p_user_id: reportedUser.id },
          );
          if (rpcErr) throw rpcErr;
          const rpcResponse = rpcData as AnonymizeUserDataResponse | null;
          actionDetails.anonymize_result = rpcResponse as Json;

          // Then flip is_banned so auth session is blocked from returning.
          const { error: banErr } = await supabase
            .from("profiles")
            .update({
              is_banned: true,
              banned_at: now,
              ban_reason: notes.trim() || "Account banned via report review",
            })
            .eq("id", reportedUser.id);
          if (banErr) throw banErr;
          break;
        }

        case "delete_rating": {
          if (!rating) throw new Error("Rating missing from report");
          if (rating.photo_storage_path) {
            const { error: storageError } = await supabase.storage
              .from("ratings")
              .remove([rating.photo_storage_path]);
            if (storageError) {
              actionDetails.storage_error = storageError.message;
            }
          }
          const { error: delErr } = await supabase
            .from("personal_ratings")
            .delete()
            .eq("id", rating.id);
          if (delErr) throw delErr;
          break;
        }

        case "dismiss":
        case "mark_reviewed":
          // No side effects beyond updating the report itself.
          break;
      }

      // Update the report row with resolution metadata. The new resolution
      // columns are added via migration 20260405000000; until DB types are
      // regenerated, cast the payload.
      const newStatus =
        pendingAction === "dismiss"
          ? "dismissed"
          : pendingAction === "mark_reviewed"
            ? "reviewed"
            : "actioned";

      const reportUpdate = {
        status: newStatus,
        reviewed_by: currentAdminId,
        reviewed_at: now,
        resolution_action: pendingAction,
        admin_notes: notes.trim() || null,
      };
      const { error: reportErr } = await supabase
        .from("content_reports")
        .update(reportUpdate as never)
        .eq("id", report.id);
      if (reportErr) throw reportErr;

      // Audit log.
      const { error: auditErr } = await supabase.from("admin_actions").insert({
        admin_id: currentAdminId,
        action_type: pendingAction,
        target_type: "content_report",
        target_id: report.id,
        details: actionDetails as Json,
      });
      if (auditErr) throw auditErr;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Action failed";
      setError(message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setPendingAction(null);
    setNotes("");
    router.refresh();
  }

  function openAction(action: ActionType) {
    setError(null);
    setPendingAction(action);
  }

  function cancelAction() {
    setPendingAction(null);
    setNotes("");
    setError(null);
  }

  const config = pendingAction ? ACTION_CONFIGS[pendingAction] : null;

  return (
    <div className="bg-surface border border-border rounded-sm p-5">
      <h3 className="text-lg font-semibold text-text-primary mb-1">
        Moderation Actions
      </h3>
      <p className="text-sm text-text-secondary mb-4">
        {alreadyResolved
          ? `This report was already ${report.status}. Re-opening will overwrite the prior resolution.`
          : "Choose the action that matches this report."}
      </p>

      {error && (
        <div className="rounded-sm bg-danger/10 border border-danger/30 px-4 py-3 text-sm text-danger mb-4">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {(Object.keys(ACTION_CONFIGS) as ActionType[]).map((action) => {
          const cfg = ACTION_CONFIGS[action];
          const disabled =
            (cfg.needsRating && !rating) ||
            (cfg.needsReportedUser && !reportedUser) ||
            (cfg.needsReportedUser && reportedUser?.id === currentAdminId) ||
            (action === "ban_user" && reportedUser?.is_banned === true);
          return (
            <button
              key={action}
              type="button"
              onClick={() => openAction(action)}
              disabled={disabled}
              className={`px-4 py-2 rounded-sm text-sm font-medium transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${VARIANT_CLASSES[cfg.variant]}`}
            >
              {cfg.buttonLabel}
            </button>
          );
        })}
      </div>

      {config && (
        <div className="border-t border-border pt-4 space-y-3">
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-1">
              {config.title}
            </h4>
            <p className="text-sm text-text-secondary">{config.description}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              {pendingAction === "ban_user"
                ? "Ban reason (shown to user, stored in profile)"
                : "Admin notes (optional, stored on the report)"}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-sm border border-border bg-surface-2 px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/40"
              placeholder={
                pendingAction === "ban_user"
                  ? "Reason for banning this user..."
                  : "Context for the audit log..."
              }
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={cancelAction}
              disabled={loading}
              className="px-4 py-2 rounded-sm text-sm text-text-secondary hover:bg-surface-2 disabled:opacity-45 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={execute}
              disabled={loading}
              className={`px-4 py-2 rounded-sm text-sm font-medium transition-colors cursor-pointer disabled:opacity-45 ${VARIANT_CONFIRM_CLASSES[config.variant]}`}
            >
              {loading ? "Processing..." : config.confirmLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
