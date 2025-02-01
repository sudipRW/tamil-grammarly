"use client"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bold, Italic, List, Check } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useState, useEffect, useRef } from "react"
import Grammarly from "../../utils/grammarly"

const colors = {
  primary: "#3498db",
  secondary: "#2ecc71",
  accent: "#e74c3c",
  background: "#ecf0f1",
  text: "#34495e",
  lightText: "#7f8c8d",
}

export default function TiptapEditor() {
  const [apiKey, setApiKey] = useState("")
  const [context, setContext] = useState("Convert to formal Tamil")
  const hasPromptedForApiKey = useRef(false)

  const editor = useEditor({
    extensions: [StarterKit],
    content:
      "<p>Type your English text here. It can include Tamil pronunciation words. They will be converted to Tamil script while keeping English words as is.</p>",
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose-base lg:prose-lg max-w-none focus:outline-none min-h-[400px] p-4",
      },
      handleKeyDown: (view, event) => {
        if (event.shiftKey && event.key === "F7") {
          handleGrammarCheck()
          return true
        }
        return false
      },
    },
  })

  useEffect(() => {
    if (!hasPromptedForApiKey.current) {
      hasPromptedForApiKey.current = true
      const key = prompt("Please enter your API key:")
      if (key) {
        setApiKey(key)
      } else {
        alert("API key is required to use this application.")
      }
    }
  }, [])

  const handleGrammarCheck = async () => {
    if (!apiKey) {
      alert("API key is missing. Please refresh the page and enter your API key.")
      return
    }

    if (!editor?.getText().trim()) {
      alert("Please enter some text before checking grammar.")
      return
    }

    try {
      const gram = new Grammarly(apiKey)
      const currentText = editor?.getText() || ""

      const corrected_text = await gram.grammarly(currentText, context)

      if (corrected_text.startsWith("Error:")) {
        throw new Error(corrected_text)
      }

      editor?.commands.setContent(corrected_text)
    } catch (error) {
      console.error("Error checking grammar:", error)
      alert("An error occurred while checking grammar. Please try again.")
    }
  }

  if (!editor) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: colors.background }}>
      <header className="bg-white shadow-md p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold" style={{ color: colors.primary }}>
            TamilGrammarly
          </h1>
          
        </div>
      </header>

      <main className="flex-grow container mx-auto py-8">
        <Card className="w-full max-w-4xl mx-auto shadow-lg bg-white">
          <CardHeader className="border-b" style={{ backgroundColor: colors.primary, color: "white" }}>
            <div className="flex items-center justify-between gap-4 pb-4">
              <div className="flex-1 flex items-center gap-2">
                <Input
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Enter context (e.g., 'convert english to tamil', 'formal tamil')"
                  className="max-w-sm bg-white text-gray-800"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={editor.isActive("bold") ? "bg-white/20" : ""}
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={editor.isActive("italic") ? "bg-white/20" : ""}
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={editor.isActive("bulletList") ? "bg-white/20" : ""}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleGrammarCheck}
                className="ml-auto"
                style={{ backgroundColor: colors.secondary, color: "white" }}
              >
                <Check className="h-4 w-4 mr-2" />
                Check Grammar (Shift+F7)
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <EditorContent editor={editor} />
          </CardContent>
        </Card>
      </main>

      <footer className="bg-white shadow-md mt-8 py-4">
        <div className="container mx-auto text-center" style={{ color: colors.lightText }}>
          <p>&copy; 2024 TamilGrammarly. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

