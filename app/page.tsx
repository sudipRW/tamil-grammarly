"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import ApiKeyManager from "@/utils/apikey_manager"

export default function NotionLikeEditor() {
  const editor = useEditor({
    extensions: [StarterKit],
    content: "<p>Welcome to the Notion-like editor! Type / to see available commands.</p>",
  })

  if (!editor) return null

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Notion-like Editor</h1>
        <ApiKeyManager />
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
