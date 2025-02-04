"use client"

import { useEditor, EditorContent, Extension } from "@tiptap/react"
import { Suggestion } from "@tiptap/suggestion"
import StarterKit from "@tiptap/starter-kit"
import { ReactRenderer } from "@tiptap/react"
import tippy from "tippy.js"
import "tippy.js/dist/tippy.css"
import { useState, forwardRef, useEffect } from "react"
import ApiKeyManager from "@/components/apikey_manager"

const CommandsList = forwardRef((props, ref) => {
  const { items, command, selectedIndex } = props

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowUp") {
        e.preventDefault()
        props.upHandler()
      }
      if (e.key === "ArrowDown") {
        e.preventDefault()
        props.downHandler()
      }
      if (e.key === "Enter") {
        e.preventDefault()
        props.enterHandler()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [props])

  return (
    <div ref={ref} className="bg-white rounded-lg shadow-lg overflow-hidden z-50 min-w-[200px]">
      {items.map((item, index) => (
        <button
          key={index}
          onClick={() => command(item)}
          className={`w-full p-2 text-left hover:bg-[#d0ef71] hover:text-[#2a3416] flex items-center gap-2 text-sm transition-colors ${
            index === selectedIndex ? "bg-[#d0ef71] text-[#2a3416]" : "text-[#2a3416]"
          }`}
        >
          <span>{item}</span>
        </button>
      ))}
    </div>
  )
})
CommandsList.displayName = "CommandsList"

const suggestion = {
  items: ({ query }) => {
    const commands = ["Summarize", "Translate", "Elaborate"]
    return commands.filter((item) => item.toLowerCase().startsWith(query.toLowerCase())).slice(0, 10)
  },
  render: () => {
    let component
    let popup
    let selectedIndex = 0

    return {
      onStart: (props) => {
        component = new ReactRenderer(CommandsList, {
          props: {
            ...props,
            selectedIndex,
            upHandler: () => {
              selectedIndex = (selectedIndex - 1 + props.items.length) % props.items.length
              component.updateProps({ selectedIndex })
            },
            downHandler: () => {
              selectedIndex = (selectedIndex + 1) % props.items.length
              component.updateProps({ selectedIndex })
            },
            enterHandler: () => {
              const item = props.items[selectedIndex]
              props.command(item)
            },
          },
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
          theme: "light",
        })
      },

      onUpdate(props) {
        component?.updateProps({
          ...props,
          selectedIndex,
          upHandler: () => {
            selectedIndex = (selectedIndex - 1 + props.items.length) % props.items.length
            component.updateProps({ selectedIndex })
          },
          downHandler: () => {
            selectedIndex = (selectedIndex + 1) % props.items.length
            component.updateProps({ selectedIndex })
          },
          enterHandler: () => {
            const item = props.items[selectedIndex]
            props.command(item)
          },
        })

        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        })
      },

      onKeyDown(props) {
        if (props.event.key === "Escape") {
          popup[0].hide()
          return true
        }
        
        if (props.event.key === "Enter") {
          const item = props.items[selectedIndex]
          props.command(item)
          popup[0].hide()
          return true
        }

        return false
      },

      onExit() {
        popup[0].destroy()
        component.destroy()
      },
    }
  },
}

const SlashCommands = Extension.create({
  name: "slashCommands",
  addOptions() {
    return {
      suggestion: {
        char: "/",
        command: ({ editor, range, props }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .setNode("paragraph")
            .insertContent(` Executing ${props} command...`)
            .run()
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

  const editor = useEditor({
    extensions: [StarterKit, SlashCommands],
    content: "<p>Welcome to the editor!</p>",
    onUpdate: ({ editor }) => {
      if (!editor || !selectedCommand) return

      if (selectedCommand === "Summarize") {
        editor.chain().focus().setContent("Summarizing the content...").run()
      } else if (selectedCommand === "Translate") {
        editor.chain().focus().setContent("Translating the content...").run()
      } else if (selectedCommand === "Elaborate") {
        editor.chain().focus().setContent("Elaborating the content...").run()
      }

      setSelectedCommand("")
    },
  })

  if (!editor) return null

  return (
    <div className="min-h-screen bg-[#f4f8e8] py-8">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex gap-6">
          {/* Main Editor Section */}
          <div className="flex-1">
            <div className="mb-6">
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-[#2a3416]">
                  தமிழ் Grammarly
                </h1>
                <ApiKeyManager />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-[#d0ef71]">
              <EditorContent
                editor={editor}
                className="prose max-w-none outline-none"
              />
            </div>
          </div>

          {/* Notes Section */}
          <div className="w-80 space-y-4">
            {/* Quick Commands Card */}
            <div className="bg-white rounded-xl border border-[#d0ef71] overflow-hidden">
              <div className="bg-[#d0ef71] p-3">
                <h2 className="text-[#2a3416] font-semibold">Quick Commands</h2>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-[#2a3416]">Type <span className="font-mono bg-[#f4f8e8] px-1 rounded">/</span> to access:</p>
                <ul className="space-y-2 text-sm text-[#2a3416]">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#d0ef71]"></span>
                    Summarize text
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#d0ef71]"></span>
                    Translate content
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#d0ef71]"></span>
                    Elaborate writing
                  </li>
                </ul>
              </div>
            </div>

            {/* Tips Card */}
            <div className="bg-white rounded-xl border border-[#d0ef71] overflow-hidden">
              <div className="bg-[#d0ef71] p-3">
                <h2 className="text-[#2a3416] font-semibold">Tips</h2>
              </div>
              <div className="p-4 text-sm text-[#2a3416]">
                <ul className="space-y-2">
                  <li>• Use arrow keys to navigate commands</li>
                  <li>• Press Enter to select a command</li>
                  <li>• ESC to close command menu</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .ProseMirror {
          min-height: 500px;
          height: 100%;
          outline: none !important;
          padding: 2rem;
          font-size: 1.1rem;
          line-height: 1.8;
          color: #2a3416;
        }

        .ProseMirror:focus {
          outline: none !important;
        }

        .ProseMirror p {
          margin: 0.8em 0;
        }

        .ProseMirror p:first-child {
          margin-top: 0;
        }

        .ProseMirror::-webkit-scrollbar {
          width: 8px;
        }

        .ProseMirror::-webkit-scrollbar-track {
          background: #f4f8e8;
        }

        .ProseMirror::-webkit-scrollbar-thumb {
          background: #d0ef71;
          border-radius: 4px;
        }

        .ProseMirror::-webkit-scrollbar-thumb:hover {
          background: #b8d55d;
        }

        .tippy-box {
          border: none !important;
          box-shadow: none !important;
          background-color: transparent !important;
        }

        .tippy-box[data-theme~='light'] {
          background-color: transparent;
          box-shadow: none;
        }

        .tippy-arrow {
          display: none;
        }
      `}</style>
    </div>
  )
}