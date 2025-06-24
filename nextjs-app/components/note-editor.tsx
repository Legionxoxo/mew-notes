"use client"

import React, { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Save } from "lucide-react"
import { editorJSToMarkdown } from "@/lib/markdown-converter"
import { getEditorTools } from "@/lib/editor-tools"

interface NoteEditorProps {
  fileName: string
  initialContent: any
  onSave: (content: any) => Promise<void>
  currentFileHandle?: FileSystemFileHandle
  currentDirectoryHandle?: FileSystemDirectoryHandle
}

const AUTO_SAVE_DEBOUNCE_MS = 1500

const NoteEditor: React.FC<NoteEditorProps> = ({ fileName, initialContent, onSave, currentFileHandle, currentDirectoryHandle }) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const editorInstance = useRef<any>(null) // Use any here since EditorJS is dynamically imported
  const initializationLock = useRef(false)
  const currentFileName = useRef<string | null>(null)
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null)

  const [isSaving, setIsSaving] = useState(false)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
  const [markdownContent, setMarkdownContent] = useState("")

  // Cleanup editor instance safely
  const destroyEditor = () => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current)
      debounceTimeout.current = null
    }

    if (editorInstance.current) {
      try {
        editorInstance.current.destroy()
      } catch (err) {
        console.warn("Error destroying editor:", err)
      }
      editorInstance.current = null
    }
    if (editorRef.current) {
      editorRef.current.innerHTML = ""
    }
    initializationLock.current = false
    currentFileName.current = null
  }

  // Initialize editor with content or empty if none
  const initializeEditor = async (contentData: any = null) => {
    if (initializationLock.current) {
      console.log("Editor initialization in progress, skipping...")
      return
    }

    initializationLock.current = true
    console.log("Initializing editor for file:", fileName, {
      hasFileHandle: !!currentFileHandle,
      hasDirectoryHandle: !!currentDirectoryHandle
    })

    try {
      // Destroy existing editor before creating new one
      destroyEditor()

      // Small delay to ensure cleanup
      await new Promise((res) => setTimeout(res, 150))

      if (!editorRef.current) throw new Error("Editor container not found")

      editorRef.current.innerHTML = ""

      const data = contentData || initialContent || { blocks: [] }

      const tools = await getEditorTools(currentFileHandle, currentDirectoryHandle)

      // Dynamically import EditorJS here to avoid SSR issues
      const EditorJS = (await import("@editorjs/editorjs")).default

      editorInstance.current = new EditorJS({
        holder: editorRef.current,
        tools,
        placeholder: "Start writing your note...",
        data,
        autofocus: true,
        onChange: () => {
          if (debounceTimeout.current) clearTimeout(debounceTimeout.current)

          debounceTimeout.current = setTimeout(async () => {
            try {
              if (!editorInstance.current) return

              const outputData = await editorInstance.current.save()
              const md = editorJSToMarkdown(outputData)
              setMarkdownContent(md)

              if (autoSaveEnabled) {
                setIsSaving(true)
                await onSave(outputData)
                setIsSaving(false)
              }
            } catch (error) {
              console.error("Auto-save error:", error)
            }
          }, AUTO_SAVE_DEBOUNCE_MS)
        },
        onReady: () => {
          console.log("Editor.js is ready for file:", fileName, {
            hasFileHandle: !!currentFileHandle,
            hasDirectoryHandle: !!currentDirectoryHandle
          })
          initializationLock.current = false
          currentFileName.current = fileName

          const items = document.querySelectorAll('.ce-popover-item[data-item-name="list"]')
          items.forEach((item) => {
            const title = item.querySelector('.ce-popover-item__title') as HTMLElement | null
            if (title && title.textContent?.trim().toLowerCase() === 'checklist') {
              (item as HTMLElement).style.display = 'none'
            }
          })
        }
      })
    } catch (error) {
      console.error("Error initializing editor:", error)
      initializationLock.current = false
      alert("Error initializing editor. Please refresh.")
    }
  }

  // Effect to initialize editor only when fileName changes
  useEffect(() => {
    if (currentFileName.current !== fileName) {
      initializeEditor()
    }

    // Cleanup on unmount or fileName change
    return () => {
      destroyEditor()
    }
  }, [fileName, currentFileHandle, currentDirectoryHandle])

  // Manual save button handler
  const handleManualSave = async () => {
    if (!editorInstance.current) {
      alert("Editor not initialized yet.")
      return
    }

    try {
      setIsSaving(true)
      const outputData = await editorInstance.current.save()
      await onSave(outputData)
    } catch (error) {
      console.error("Manual save error:", error)
      alert("Failed to save note. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border p-4 flex items-center justify-between flex-shrink-0">
        <h1 className="text-lg font-semibold">{fileName.replace(".md", "")}</h1>
        <div className="flex items-center gap-4">
          {/*  <Switch
            id="auto-save"
            checked={autoSaveEnabled}
            onCheckedChange={setAutoSaveEnabled}
            className="data-[state=checked]:bg-green-600"
          /> */}
          <Button onClick={handleManualSave} size="sm" disabled={isSaving}>
            <Save className="w-4 h-4 mr-1" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div
          ref={editorRef}
          className="min-h-[300px] prose prose-slate dark:prose-invert max-w-none"
          style={{ fontSize: "16px", lineHeight: "1.6" }}
        />
      </div>
    </div>
  )
}

export default NoteEditor
