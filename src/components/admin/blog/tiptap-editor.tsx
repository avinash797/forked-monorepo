"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorToolbar } from "./editor-toolbar";
import type { JSONContent } from "@tiptap/react";

type TipTapEditorProps = {
  content: JSONContent | null;
  onChange: (content: JSONContent) => void;
  onImageUploadRequest: () => void;
};

export function TipTapEditor({
  content,
  onChange,
  onImageUploadRequest,
}: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-accent underline" },
      }),
      Underline,
      Placeholder.configure({
        placeholder: "Start writing your blog post...",
      }),
    ],
    content: content ?? undefined,
    onUpdate: ({ editor: e }) => {
      onChange(e.getJSON());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-invert max-w-none min-h-[400px] px-4 py-3 focus:outline-none text-text-primary",
      },
    },
  });

  return (
    <div className="border border-border rounded-sm overflow-hidden bg-surface-2">
      <EditorToolbar editor={editor} onImageUpload={onImageUploadRequest} />
      <EditorContent editor={editor} />
    </div>
  );
}
