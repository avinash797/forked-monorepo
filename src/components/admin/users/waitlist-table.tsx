"use client";

import { useTransition } from "react";
import { removeFromWaitlist } from "@/app/admin/users/actions";
import type { WaitlistEntry } from "@/lib/admin/user-queries";

type WaitlistTableProps = {
  entries: WaitlistEntry[];
  allEmails: string[];
};

export function WaitlistTable({ entries, allEmails }: WaitlistTableProps) {
  const [isPending, startTransition] = useTransition();

  function handleExport() {
    const rows = entries.map(
      (e) =>
        `${e.email},${e.source ?? ""},${new Date(e.created_at).toLocaleDateString()}`
    );
    const csv = `email,source,signed_up\n${rows.join("\n")}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "waitlist.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleCopyEmails() {
    navigator.clipboard.writeText(allEmails.join(", "));
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-text-secondary">
        <p>No waitlist entries found.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-end gap-2 px-4 py-3 border-b border-border">
        <button
          onClick={handleCopyEmails}
          className="px-3 py-1.5 text-xs rounded-sm border border-border text-text-secondary hover:text-text-primary hover:border-border transition-colors"
        >
          Copy All Emails
        </button>
        <button
          onClick={handleExport}
          className="px-3 py-1.5 text-xs rounded-sm bg-accent text-white hover:bg-accent/90 transition-colors"
        >
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 font-medium text-text-tertiary">
                Email
              </th>
              <th className="text-left py-3 px-4 font-medium text-text-tertiary">
                Source
              </th>
              <th className="text-left py-3 px-4 font-medium text-text-tertiary">
                Signed Up
              </th>
              <th className="text-right py-3 px-4 font-medium text-text-tertiary">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr
                key={entry.id}
                className="border-b border-border hover:bg-surface-2/50"
              >
                <td className="py-3 px-4 text-text-primary font-medium">
                  {entry.email}
                </td>
                <td className="py-3 px-4">
                  {entry.source ? (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-pill bg-surface-2 text-text-secondary">
                      {entry.source}
                    </span>
                  ) : (
                    <span className="text-text-tertiary">—</span>
                  )}
                </td>
                <td className="py-3 px-4 text-text-secondary">
                  {new Date(entry.created_at).toLocaleDateString()}
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    disabled={isPending}
                    onClick={() =>
                      startTransition(() => removeFromWaitlist(entry.id))
                    }
                    className="text-xs text-danger hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
