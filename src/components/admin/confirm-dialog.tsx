"use client";

type ConfirmDialogProps = {
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  confirmVariant = "primary",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-surface border border-border rounded-sm p-6 w-full max-w-sm">
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          {title}
        </h3>
        <p className="text-sm text-text-secondary mb-6">{message}</p>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-sm text-sm text-text-secondary hover:bg-surface-2 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-sm text-sm font-medium transition-all cursor-pointer ${
              confirmVariant === "danger"
                ? "bg-danger text-white hover:bg-danger/90"
                : "bg-accent text-white hover:bg-accent/90"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
