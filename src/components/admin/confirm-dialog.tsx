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
      <div className="bg-[#342219] border border-[rgba(236,237,238,0.08)] rounded-sm p-6 w-full max-w-sm">
        <h3 className="text-lg font-semibold text-[#ECEDEE] mb-2">{title}</h3>
        <p className="text-sm text-[#9BA1A6] mb-6">{message}</p>
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-sm text-sm text-[#9BA1A6] hover:bg-[#482f23] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-sm text-sm font-medium transition-all cursor-pointer ${
              confirmVariant === "danger"
                ? "bg-[#EF4444] text-white hover:bg-[#DC2626]"
                : "bg-[#ee6c2b] text-white hover:brightness-110"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
