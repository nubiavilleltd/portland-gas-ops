"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Bold, Italic, List, ListOrdered, Link as LinkIcon, Heading2, Heading3, Undo, Redo } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useCallback } from "react";

interface Props {
  label?: string;
  required?: boolean;
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  className?: string;
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-7 w-7 flex items-center justify-center rounded-md text-sm transition-colors",
        active
          ? "bg-brand-purple text-white"
          : "text-brand-text-secondary hover:bg-gray-100 hover:text-brand-text-primary",
        disabled && "opacity-40 cursor-not-allowed pointer-events-none"
      )}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({ label, required, value, onChange, placeholder, error, hint, className }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-brand-purple underline" } }),
    ],
    content: value ?? "",
    editorProps: {
      attributes: {
        class: "min-h-[180px] px-3 py-3 text-sm text-brand-text-primary leading-relaxed outline-none",
      },
    },
    onUpdate({ editor }) {
      onChange?.(editor.getHTML());
    },
  });

  // Sync external value changes (e.g. on form reset)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== undefined && value !== current) {
      editor.commands.setContent(value, false);
    }
  }, [value, editor]);

  const addLink = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("Enter URL:");
    if (!url) return;
    editor.chain().focus().extendMarkToLink({ href: url }).setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label && (
        <label className="text-sm font-medium text-brand-text-primary">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      {/* Toolbar */}
      <div
        className={cn(
          "rounded-t-lg border border-b-0 border-brand-border bg-gray-50 px-2 py-1.5 flex flex-wrap items-center gap-0.5",
          error && "border-red-400"
        )}
      >
        <ToolbarButton title="Bold" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}>
          <Bold size={13} />
        </ToolbarButton>
        <ToolbarButton title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}>
          <Italic size={13} />
        </ToolbarButton>

        <div className="w-px h-5 bg-brand-border mx-1" />

        <ToolbarButton title="Heading 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })}>
          <Heading2 size={13} />
        </ToolbarButton>
        <ToolbarButton title="Heading 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })}>
          <Heading3 size={13} />
        </ToolbarButton>

        <div className="w-px h-5 bg-brand-border mx-1" />

        <ToolbarButton title="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")}>
          <List size={13} />
        </ToolbarButton>
        <ToolbarButton title="Numbered list" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")}>
          <ListOrdered size={13} />
        </ToolbarButton>

        <div className="w-px h-5 bg-brand-border mx-1" />

        <ToolbarButton title="Add link" onClick={addLink} active={editor.isActive("link")}>
          <LinkIcon size={13} />
        </ToolbarButton>

        <div className="w-px h-5 bg-brand-border mx-1" />

        <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
          <Undo size={13} />
        </ToolbarButton>
        <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
          <Redo size={13} />
        </ToolbarButton>
      </div>

      {/* Editor */}
      <div
        className={cn(
          "rounded-b-lg border border-brand-border bg-white transition-shadow focus-within:ring-2 focus-within:ring-brand-purple focus-within:border-transparent",
          error && "border-red-400 focus-within:ring-red-400"
        )}
      >
        {!editor.getText() && placeholder && !editor.isFocused && (
          <p className="absolute px-3 pt-3 text-sm text-brand-text-secondary pointer-events-none select-none">{placeholder}</p>
        )}
        <EditorContent editor={editor} className="[&_.ProseMirror_h2]:text-base [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:mb-2 [&_.ProseMirror_h3]:text-sm [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_h3]:mb-1 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5 [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-brand-text-secondary [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0" />
      </div>

      {hint && !error && <p className="text-xs text-brand-text-secondary">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
