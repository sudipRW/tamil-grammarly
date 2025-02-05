"use client"

import { useEditor, EditorContent, Extension } from "@tiptap/react"
import { Suggestion } from "@tiptap/suggestion"
import StarterKit from "@tiptap/starter-kit"
import { ReactRenderer } from "@tiptap/react"
import tippy from "tippy.js"
import "tippy.js/dist/tippy.css"
import { useState, forwardRef, useEffect } from "react"
import ApiKeyManager from "@/components/apikey_manager"
import Grammarly from "./_grammarly/grammarly"
import { openDB } from "idb"

interface CommandsListProps {
  items: any[]; // Change `any[]` to a more specific type if possible
  command: (string:string) => void;
  selectedIndex: number;
  upHandler: () => void; 
  downHandler: () => void; 
  enterHandler: () => void; 
}

let grammarly: Grammarly;

  const initDB = async () => {
    return openDB("NotionLikeEditor", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("apiKey")) {
          db.createObjectStore("apiKey", { keyPath: "id" })
        }
      },
    })
  }

 
  const getApiKey = async (setApiKey) => {
    try {
      const db = await initDB()
      const key = await db.get("apiKey", "current")
      if (key?.value) {
        setApiKey(key?.value)
        grammarly = new Grammarly(key?.value)
      }
    } catch (error) {
      console.error("Error fetching API key from IndexedDB:", error)
    }
  }

const CommandsList = forwardRef<HTMLDivElement, CommandsListProps>((props, ref) => {
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
    const commands = ["Rephrase","Summarize", "Translate", "Elaborate"]
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
          } else if (props === "Rephrase") {
            result = "வாழைப்பழம் தோல் வழுக்கி வாலிபர் உயிர் ஊசல்"
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

const handleGrammarCheck = async (text: string | undefined) => {
  console.log("Grammar check triggered by full stop")
  const correctedText = await grammarly.grammarly(text)
  console.log("Corrected text:", correctedText)
  return correctedText
}

const GrammarCheck = Extension.create({
  name: "grammarCheck",

  addOptions() {
    return {
      setLoading: () => {}, // Will be set from editor
    }
  },

  addKeyboardShortcuts() {
    return {
      ".": () => {
        const applyGrammarCheck = async () => {
          try {
            this.options.setLoading(true);
            
            this.editor.chain().focus().insertContent('.').run();
            
            const currentPosition = this.editor.state.selection.from;
            this.editor.chain()
              .focus()
              .insertContent(' Processing...')
              .run();

            const text = this.editor.getText();
            const correctedText = await handleGrammarCheck(text);
            
            this.editor.chain().focus().setContent(correctedText).run();
            
            this.options.setLoading(false);
            return true;
          } catch (error) {
            console.error("Grammar check failed:", error);
            this.options.setLoading(false);
            return false;
          }
        };
        
        applyGrammarCheck();
        return true;
      },
    };
  }
});

export default function NotionLikeEditor() {
  const [loading, setLoading] = useState(false)
  const [apiKey, setApiKey] = useState("")

  useEffect(() => {
    getApiKey(setApiKey)
  }, [])
  
  const editor = useEditor({
    extensions: [StarterKit, SlashCommands,
      GrammarCheck.configure({
        setLoading: setLoading
      })
    ],
    content:
      "<p>Welcome to the editor!. Type a full stop (.) to trigger grammar check.</p>",
    editorProps: {
      attributes: {
        class: 'w-full max-w-full overflow-x-hidden'
      }
    },
    onUpdate: ({ editor }) => {
      if (!editor) return
    },
    immediatelyRender: false
  })

  if (!editor) return null

  return (
    <div className="min-h-screen bg-[#f4f8e8] py-8">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex gap-6">
          {/* Main Editor Section */}
          <div className="flex-1 min-w-0"> {/* Added min-w-0 */}
            <div className="mb-6">
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-[#2a3416]">
                  தமிழ் Grammarly
                </h1>
                <ApiKeyManager />
              </div>
            </div>
            <div className={`bg-white rounded-xl shadow-sm overflow-hidden border ${(apiKey == "") ? "border-red-500":"border-[#d0ef71]"}`}>
              <div className="w-full relative"> {/* Added container div */}
                <EditorContent
                  editor={editor}
                  className="prose w-full relative"
                />
              </div>
              {apiKey == "" && (
                <div className="p-2 rounded-sm bg-red-500 text-white">
                  No api key found.
                </div>
              )}
            </div>
          </div>

          {/* Rest of your sidebar code remains the same */}
          <div className="w-80 space-y-4">
          <div className="bg-white rounded-xl border border-[#d0ef71] overflow-hidden">
              <div className="bg-[#d0ef71] p-3">
                <h2 className="text-[#2a3416] font-semibold">Quick Commands</h2>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-[#2a3416]">Type <span className="font-mono bg-[#f4f8e8] px-1 rounded">/</span> to access:</p>
                <ul className="space-y-2 text-[16px] text-[#2a3416]">
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
              <div className="p-4 text-[16px] text-[#2a3416]">
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
          position: relative;
          max-height: 500px;
          height: 100%;
          width: 100%;
          outline: none !important;
          padding: 2rem;
          font-size: 1.3rem;
          line-height: 1.8;
          color: #2a3416;
          overflow-y: auto;
          overflow-x: hidden;
          word-wrap: break-word;
          white-space: pre-wrap;
          box-sizing: border-box;
          display: block; /* Added */
        }

        /* Force content to wrap */
        .ProseMirror > * {
          width: 100% !important;
          max-width: 100% !important;
          overflow-wrap: break-word !important;
          word-break: break-word !important; /* Added */
          white-space: pre-wrap !important; /* Added */
        }

        /* Specific handling for paragraphs */
        .ProseMirror p {
          margin: 0.8em 0;
          position: relative; /* Added */
          width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box;
          display: block; /* Added */
        }

        /* Handle inline content */
        .ProseMirror span,
        .ProseMirror a {
          display: inline-block; /* Added */
          max-width: 100%;
          overflow-wrap: break-word;
          word-break: break-word;
        }

        /* Remove any potential flex behavior */
        .prose {
          display: block !important;
          width: 100% !important;
          max-width: none !important;
        }

        .ProseMirror p:first-child {
          margin-top: 0;
        }

        /* Rest of your styles remain the same */
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

