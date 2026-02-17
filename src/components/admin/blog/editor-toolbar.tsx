"use client";

import type { Editor } from "@tiptap/react";

type EditorToolbarProps = {
  editor: Editor | null;
  onImageUpload: () => void;
};

type ToolbarButton = {
  label: string;
  action: () => void;
  isActive?: boolean;
  icon: string;
};

export function EditorToolbar({ editor, onImageUpload }: EditorToolbarProps) {
  if (!editor) return null;

  const buttons: ToolbarButton[] = [
    {
      label: "Bold",
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive("bold"),
      icon: "B",
    },
    {
      label: "Italic",
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive("italic"),
      icon: "I",
    },
    {
      label: "Underline",
      action: () => editor.chain().focus().toggleUnderline().run(),
      isActive: editor.isActive("underline"),
      icon: "U",
    },
    {
      label: "H2",
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: editor.isActive("heading", { level: 2 }),
      icon: "H2",
    },
    {
      label: "H3",
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: editor.isActive("heading", { level: 3 }),
      icon: "H3",
    },
    {
      label: "Bullet List",
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive("bulletList"),
      icon: "UL",
    },
    {
      label: "Ordered List",
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive("orderedList"),
      icon: "OL",
    },
    {
      label: "Blockquote",
      action: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: editor.isActive("blockquote"),
      icon: '"',
    },
    {
      label: "Code Block",
      action: () => editor.chain().focus().toggleCodeBlock().run(),
      isActive: editor.isActive("codeBlock"),
      icon: "</>",
    },
    {
      label: "Horizontal Rule",
      action: () => editor.chain().focus().setHorizontalRule().run(),
      icon: "---",
    },
  ];

  function handleAddLink() {
    if (!editor) return;
    const url = window.prompt("Enter URL:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-[rgba(236,237,238,0.08)] bg-[#2a1a11]">
      {buttons.map((btn) => (
        <button
          key={btn.label}
          type="button"
          onClick={btn.action}
          title={btn.label}
          className={`px-2.5 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
            btn.isActive
              ? "bg-[#ee6c2b] text-white"
              : "text-[#9BA1A6] hover:bg-[#342219] hover:text-[#ECEDEE]"
          }`}
        >
          {btn.icon}
        </button>
      ))}

      <div className="w-px h-5 bg-[rgba(236,237,238,0.08)] mx-1" />

      <button
        type="button"
        onClick={handleAddLink}
        title="Add Link"
        className={`px-2.5 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
          editor.isActive("link")
            ? "bg-[#ee6c2b] text-white"
            : "text-[#9BA1A6] hover:bg-[#342219] hover:text-[#ECEDEE]"
        }`}
      >
        Link
      </button>

      {editor.isActive("link") && (
        <button
          type="button"
          onClick={() => editor.chain().focus().unsetLink().run()}
          title="Remove Link"
          className="px-2.5 py-1.5 text-xs font-medium rounded text-[#F87171] hover:bg-[#342219] transition-colors cursor-pointer"
        >
          Unlink
        </button>
      )}

      <button
        type="button"
        onClick={onImageUpload}
        title="Insert Image"
        className="px-2.5 py-1.5 text-xs font-medium rounded text-[#9BA1A6] hover:bg-[#342219] hover:text-[#ECEDEE] transition-colors cursor-pointer"
      >
        Img
      </button>
    </div>
  );
}
