"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bold, Italic, List, Search, Settings } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useState } from "react"

export default function TiptapEditor() {
  const [title, setTitle] = useState("Untitled Document")

  const editor = useEditor({
    extensions: [StarterKit],
    content: "<p>Start writing your content here...</p>",
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose-base lg:prose-lg max-w-none focus:outline-none min-h-[400px]",
      },
    },
  })

  if (!editor) {
    return null
  }

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between gap-4 pb-4">
          <div className="flex-1 flex items-center gap-2 relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3" />
            <Input
              type="search"
              placeholder="Search in document..."
              className="max-w-sm pl-9"
            />
          </div>
          <Avatar className="h-8 w-8">
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </div>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-xl font-semibold bg-transparent border-none px-0 focus-visible:ring-0"
        />
        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive("bold") ? "bg-muted" : ""}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive("italic") ? "bg-muted" : ""}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive("bulletList") ? "bg-muted" : ""}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <EditorContent editor={editor} />
      </CardContent>
    </Card>
  )
}

