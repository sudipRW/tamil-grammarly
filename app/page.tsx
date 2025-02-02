"use client"

import { useEditor, EditorContent, Extension } from "@tiptap/react"
import { Suggestion } from "@tiptap/suggestion"
import StarterKit from "@tiptap/starter-kit"
import { ReactRenderer } from "@tiptap/react"
import tippy from "tippy.js"
import "tippy.js/dist/tippy.css"
import { useState, useEffect, forwardRef } from "react"
import ApiKeyManager from "@/components/apikey_manager"
import Grammarly from "./_grammarly/grammarly" // Import your Grammarly class

// Initialize Grammarly
const grammarly = new Grammarly("AIzaSyA91aNJVRZ0n5G5byHqLuKRPeVgzWOEtYY")

// Suggestion component for the dropdown
const CommandsList = forwardRef((props, ref) => {
  return (
    <div 
      ref={ref} 
      className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50"
    >
      {props.items.map((item, index) => (
        <button
          key={index}
          onClick={() => props.command(item)}
          className="w-full p-2 text-left hover:bg-gray-100 flex items-center gap-2 text-black bg-white"
        >
          <span className="text-black">{item}</span>
        </button>
      ))}
    </div>
  )
})
CommandsList.displayName = "CommandsList"

// Suggestion configuration
const suggestion = {
  items: ({ query }) => {
    console.log(query);
    const commands = ["Summarize", "Translate", "Elaborate"]
    return commands.filter(item =>
      item.toLowerCase().startsWith(query.toLowerCase())
    ).slice(0, 10)
  },

  render: () => {
    let component
    let popup

    return {
      onStart: props => {
        component = new ReactRenderer(CommandsList, {
          props,
          editor: props.editor,
        })

        popup = tippy("body", {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: "manual",
          placement: "bottom-start",
          theme: 'light',
        })
      },

      onUpdate(props) {
        component?.updateProps(props)
        
        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        })
      },

      onKeyDown(props) {
        if (props.event.key === "Escape") {
          popup[0].hide()
          return true
        }

        return component?.ref?.onKeyDown(props)
      },

      onExit() {
        popup[0].destroy()
        component.destroy()
      },
    }
  },
}

// Create the slash commands extension
const SlashCommands = Extension.create({
  name: "slashCommands",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        command: async ({ editor, range, props }) => {
          editor.chain().focus().deleteRange(range).setNode("paragraph").insertContent(` Processing ${props}...`).run()

          let result = ""
          const text = editor.getText()

          if (props === "Summarize") {
            result = await grammarly.summarize_paragraph(text, "English", "English")
          } else if (props === "Translate") {
            result = await grammarly.translate(text, "Tamil")
          } else if (props === "Elaborate") {
            result = await grammarly.elaborate(text)
          }

          editor.chain().focus().setContent(result).run()
        },
        ...suggestion,
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})

export default function NotionLikeEditor() {
  const [selectedCommand, setSelectedCommand] = useState("")
  const [loading, setLoading] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      SlashCommands,
    ],
    content: "<p>Welcome to the Notion-like editor! Type / to see available commands.</p>",
    onUpdate: async ({ editor }) => {
      if (!editor || !selectedCommand) return
      setLoading(true)

      const text = editor.getText()
      let processedText = ""

      if (selectedCommand === "Summarize") {
        processedText = await grammarly.summarize_paragraph(text, "English", "English")
      } else if (selectedCommand === "Translate") {
        processedText = await grammarly.translate(text, "Tamil")
      } else if (selectedCommand === "Elaborate") {
        processedText = await grammarly.elaborate(text)
      }

      editor.chain().focus().setContent(processedText).run()
      setSelectedCommand("")
      setLoading(false)
    },
  })

  if (!editor) return null

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Notion-like Editor</h1>
        <ApiKeyManager />
      </div>
      <div className="border rounded-lg p-4">
        {loading && <p className="text-gray-500">Processing...</p>}
        <EditorContent editor={editor} className="prose max-w-none" />
      </div>
    </div>
  )
}
