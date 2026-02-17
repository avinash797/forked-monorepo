"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

type ImageUploadProps = {
  onUpload: (url: string) => void;
  onClose: () => void;
};

export function ImageUpload({ onUpload, onClose }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File must be under 5MB.");
      return;
    }

    setUploading(true);
    setError(null);

    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("blog-images")
      .upload(fileName, file);

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("blog-images")
      .getPublicUrl(fileName);

    setUploading(false);
    onUpload(urlData.publicUrl);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#342219] border border-[rgba(236,237,238,0.08)] rounded-sm p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#ECEDEE]">
            Upload Image
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[#9BA1A6] hover:text-[#ECEDEE] transition-colors cursor-pointer"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-sm p-8 text-center cursor-pointer transition-colors ${
            dragOver
              ? "border-[#ee6c2b] bg-[#ee6c2b]/10"
              : "border-[rgba(236,237,238,0.12)] hover:border-[#ee6c2b]/50"
          }`}
        >
          {uploading ? (
            <p className="text-sm text-[#9BA1A6]">Uploading...</p>
          ) : (
            <>
              <p className="text-sm text-[#ECEDEE] mb-1">
                Drop an image here or click to select
              </p>
              <p className="text-xs text-[#9BA1A6]">
                JPEG, PNG, WebP, GIF (max 5MB)
              </p>
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
        />

        {error && (
          <p className="mt-3 text-sm text-[#F87171]">{error}</p>
        )}
      </div>
    </div>
  );
}
