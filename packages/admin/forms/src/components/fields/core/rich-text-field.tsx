"use client";

import * as React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import { Button } from "@eng-mohamedelsayed/admin-ui/components/ui/button";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Undo,
  Redo,
  Code,
  Strikethrough,
} from "lucide-react";
import { cn } from "@eng-mohamedelsayed/admin-ui/lib/utils";

export interface RichTextFieldProps {
  id?: string | undefined;
  value?: string | undefined;
  onChange?: ((val: string) => void) | undefined;
  onBlur?: (() => void) | undefined;
  placeholder?: string | undefined;
  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  dir?: "ltr" | "rtl" | "auto" | undefined;
  minHeight?: string | number | undefined;
  className?: string | undefined;
}

function EditorToolbar({
  editor,
  disabled,
}: {
  editor: any;
  disabled?: boolean | undefined;
}) {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 border-b bg-muted/40 p-1.5 rounded-t-md select-none">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "h-7 w-7",
          editor.isActive("bold") && "bg-muted text-foreground font-bold"
        )}
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={disabled}
        title="Bold (Ctrl+B)"
        aria-label="Bold"
      >
        <Bold className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "h-7 w-7",
          editor.isActive("italic") && "bg-muted text-foreground"
        )}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={disabled}
        title="Italic (Ctrl+I)"
        aria-label="Italic"
      >
        <Italic className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "h-7 w-7",
          editor.isActive("strike") && "bg-muted text-foreground"
        )}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={disabled}
        title="Strikethrough"
        aria-label="Strikethrough"
      >
        <Strikethrough className="h-3.5 w-3.5" />
      </Button>
      <div className="h-4 w-px bg-border mx-1" />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "h-7 w-7",
          editor.isActive("heading", { level: 1 }) && "bg-muted text-foreground font-bold"
        )}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        disabled={disabled}
        title="Heading 1"
        aria-label="Heading 1"
      >
        <Heading1 className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "h-7 w-7",
          editor.isActive("heading", { level: 2 }) && "bg-muted text-foreground font-semibold"
        )}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        disabled={disabled}
        title="Heading 2"
        aria-label="Heading 2"
      >
        <Heading2 className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "h-7 w-7",
          editor.isActive("heading", { level: 3 }) && "bg-muted text-foreground"
        )}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        disabled={disabled}
        title="Heading 3"
        aria-label="Heading 3"
      >
        <Heading3 className="h-3.5 w-3.5" />
      </Button>
      <div className="h-4 w-px bg-border mx-1" />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "h-7 w-7",
          editor.isActive("bulletList") && "bg-muted text-foreground"
        )}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        disabled={disabled}
        title="Bullet List"
        aria-label="Bullet List"
      >
        <List className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "h-7 w-7",
          editor.isActive("orderedList") && "bg-muted text-foreground"
        )}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        disabled={disabled}
        title="Numbered List"
        aria-label="Numbered List"
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "h-7 w-7",
          editor.isActive("blockquote") && "bg-muted text-foreground"
        )}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        disabled={disabled}
        title="Quote block"
        aria-label="Quote block"
      >
        <Quote className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "h-7 w-7",
          editor.isActive("codeBlock") && "bg-muted text-foreground"
        )}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        disabled={disabled}
        title="Code block"
        aria-label="Code block"
      >
        <Code className="h-3.5 w-3.5" />
      </Button>
      <div className="h-4 w-px bg-border mx-1" />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={Boolean(disabled || !editor.can().undo())}
        title="Undo (Ctrl+Z)"
        aria-label="Undo"
      >
        <Undo className="h-3.5 w-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={Boolean(disabled || !editor.can().redo())}
        title="Redo (Ctrl+Y)"
        aria-label="Redo"
      >
        <Redo className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function RichTextField({
  id,
  value,
  onChange,
  onBlur,
  placeholder = "Write description...",
  disabled,
  readOnly,
  dir,
  minHeight = "140px",
  className,
}: RichTextFieldProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      LinkExtension.configure({
        openOnClick: false,
      }),
    ],
    content: value || "",
    editable: !disabled && !readOnly,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html === "<p></p>" ? "" : html);
    },
    onBlur: () => {
      onBlur?.();
    },
  });

  // Keep editor content in sync with external value updates (e.g. async data load on edit)
  React.useEffect(() => {
    if (editor && value !== undefined) {
      const currentHtml = editor.getHTML();
      if (value !== currentHtml && (value !== "" || currentHtml !== "<p></p>")) {
        editor.commands.setContent(value, { emitUpdate: false });
      }
    }
  }, [editor, value]);

  // Keep editable state synced
  React.useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled && !readOnly);
    }
  }, [editor, disabled, readOnly]);

  return (
    <div
      id={id}
      dir={dir}
      className={cn(
        "border rounded-md overflow-hidden bg-card focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-shadow",
        disabled && "opacity-60 cursor-not-allowed",
        className
      )}
    >
      <EditorToolbar editor={editor} disabled={disabled || readOnly} />
      <div
        className="p-3 prose prose-sm max-w-none focus:outline-none dark:prose-invert"
        style={{ minHeight: typeof minHeight === "number" ? `${minHeight}px` : minHeight }}
      >
        <EditorContent editor={editor} placeholder={placeholder} />
      </div>
    </div>
  );
}
