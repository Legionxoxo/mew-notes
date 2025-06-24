"use client"
import type React from "react"
import { useState, useEffect, useRef } from "react"
import {
  FileText,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Plus,
  FolderPlus,
  Trash2,
  Search,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { SearchResults } from "@/components/search-results"
import { DeleteConfirmationModal } from "./ui/delete-modal"
import { FileInfo } from "@/types/fileinfo"
import { toast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"

interface FileTreeProps {
  files: string[]
  folders: string[]
  currentFile?: string
  onFileSelect: (filePath: string) => void
  onFileDrop: (sourcePath: string, targetFolder: string) => void
  onFolderDrop: (sourcePath: string, targetFolder: string) => void
  onCreateFile: (fileName: string, folderPath?: string) => void
  onCreateFolder: (folderName: string, parentPath?: string) => void
  onRenameFile: (oldPath: string, newName: string) => void
  onRenameFolder: (oldPath: string, newName: string) => void
  onDeleteFile: (filePath: string) => void
  onDeleteFolder: (folderPath: string) => void
  onFolderClick?: (folderPath: string) => void
  vaultname: string
}

export function FileTree({
  files,
  folders,
  currentFile,
  onFileSelect,
  onFileDrop,
  onFolderDrop,
  onCreateFile,
  onCreateFolder,
  onRenameFile,
  onRenameFolder,
  onDeleteFile,
  onDeleteFolder,
  onFolderClick,
  vaultname
}: FileTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [draggedItem, setDraggedItem] = useState<{ path: string; type: "file" | "folder" } | null>(null)
  const [editingItem, setEditingItem] = useState<{ path: string; type: "file" | "folder" } | null>(null)
  const [editingValue, setEditingValue] = useState("")
  const [creatingItem, setCreatingItem] = useState<{ type: "file" | "folder"; parentPath?: string } | null>(null)
  const [creatingValue, setCreatingValue] = useState("")
  const [isSearchActive, setIsSearchActive] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<string[]>([])
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [isSidebarVisible, setIsSidebarVisible] = useState(true)
  const [selectedFolderPath, setSelectedFolderPath] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [fsTree, setFsTree] = useState<any>(null)
  const [checkedPaths, setCheckedPaths] = useState<Set<string>>(new Set())
  const [fsHandles, setFsHandles] = useState<{ [path: string]: FileSystemFileHandle }>({})
  const searchDebounceTimeout = useRef<NodeJS.Timeout | null>(null)

  // Handle search
  useEffect(() => {
    let ignore = false
    if (searchDebounceTimeout.current) {
      clearTimeout(searchDebounceTimeout.current)
    }
    if (isSearchActive && searchQuery.trim()) {
      // Step 1: Local file name search (case-insensitive, ignore .md)
      const localMatches = files.filter(file => {
        if (!file.endsWith('.md')) return false;
        const name = file.split('/').pop()?.replace(/\.md$/, '') || '';
        return name.toLowerCase().includes(searchQuery.trim().toLowerCase());
      });
      if (localMatches.length > 0) {
        setSearchResults(localMatches);
        setSearchLoading(false);
        return;
      }
      // Step 2: API similarity search if no local matches
      setSearchLoading(true)
      searchDebounceTimeout.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/search`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: searchQuery })
          })
          if (!res.ok) throw new Error("Search failed")
          const data = await res.json()
          if (!ignore) setSearchResults(data.results || [])
        } catch (err) {
          if (!ignore) setSearchResults([])
        } finally {
          if (!ignore) setSearchLoading(false)
        }
      }, 300)
    } else {
      setSearchResults([])
    }
    return () => { ignore = true; if (searchDebounceTimeout.current) clearTimeout(searchDebounceTimeout.current) }
  }, [searchQuery, isSearchActive, files])

  // Focus search input when search is activated
  useEffect(() => {
    if (isSearchActive && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isSearchActive])

  // Toggle search
  const toggleSearch = () => {
    setIsSearchActive(!isSearchActive)
    if (!isSearchActive) {
      setSearchQuery("")
      setSearchResults([])
    }
  }

  // Organize files and folders into a tree structure
  const organizeItems = (): FileInfo[] => {
    const items: FileInfo[] = []
    const folderMap = new Map<string, FileInfo>()

    // First pass: Create folder objects
    folders.forEach((folder) => {
      const pathParts = folder.split("/")
      const folderName = pathParts[pathParts.length - 1]
      const folderInfo: FileInfo = {
        name: folderName,
        path: folder,
        type: "folder",
        children: [],
      }
      folderMap.set(folder, folderInfo)
    })

    // Second pass: Build folder hierarchy
    folders.forEach((folder) => {
      const pathParts = folder.split("/")
      if (pathParts.length === 1) {
        // Root level folder
        items.push(folderMap.get(folder)!)
      } else {
        // Nested folder
        const parentPath = pathParts.slice(0, -1).join("/")
        const parentFolder = folderMap.get(parentPath)
        if (parentFolder) {
          parentFolder.children!.push(folderMap.get(folder)!)
        }
      }
    })

    // Add files to their respective folders
    files
      .filter((file) => file.endsWith(".md"))
      .forEach((file) => {
        const pathParts = file.split("/")
        if (pathParts.length === 1) {
          // Root level file
          items.push({
            name: file,
            path: file,
            type: "file",
          })
        } else {
          // File in a folder
          const folderPath = pathParts.slice(0, -1).join("/")
          const folder = folderMap.get(folderPath)
          if (folder) {
            folder.children!.push({
              name: pathParts[pathParts.length - 1],
              path: file,
              type: "file",
            })
          }
        }
      })

    return items.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "folder" ? -1 : 1
      }
      return a.name.localeCompare(b.name)
    })
  }

  const toggleFolder = (folderPath: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath)
      setSelectedFolderPath(null)
      setIsSidebarVisible(false)
    } else {
      newExpanded.add(folderPath)
      setSelectedFolderPath(folderPath)
      setIsSidebarVisible(true)
    }
    setExpandedFolders(newExpanded)
  }

  const handleFileClick = (filePath: string) => {
    onFileSelect(filePath)
    setIsSidebarVisible(false)
  }

  const findFolderByPath = (items: FileInfo[], path: string): FileInfo | undefined => {
    for (const item of items) {
      if (item.type === "folder") {
        if (item.path === path) return item
        const found = findFolderByPath(item.children || [], path)
        if (found) return found
      }
    }
    return undefined
  }

  const handleDragStart = (e: React.DragEvent, path: string, type: "file" | "folder") => {
    setDraggedItem({ path, type })
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent, targetFolder: string) => {
    e.preventDefault()
    if (draggedItem && draggedItem.path !== targetFolder) {
      // Prevent dropping a folder into itself or its subfolders
      if (draggedItem.path.startsWith(targetFolder + "/")) {
        return
      }

      // Call the appropriate drop handler based on the dragged item type
      if (draggedItem.type === "file") {
        onFileDrop(draggedItem.path, targetFolder)
      } else {
        onFolderDrop(draggedItem.path, targetFolder)
      }
    }
    setDraggedItem(null)
  }

  const startEditing = (path: string, type: "file" | "folder") => {
    const name = type === "file" ? path.split("/").pop()?.replace(".md", "") || "" : path.split("/").pop() || ""
    setEditingItem({ path, type })
    setEditingValue(name)
  }

  const finishEditing = () => {
    if (editingItem && editingValue.trim()) {
      if (editingItem.type === "file") {
        onRenameFile(editingItem.path, editingValue.trim())
      } else {
        onRenameFolder(editingItem.path, editingValue.trim())
      }
    }
    setEditingItem(null)
    setEditingValue("")
  }

  const startCreating = (type: "file" | "folder", parentPath?: string) => {
    setCreatingItem({ type, parentPath })
    setCreatingValue("")
  }

  const finishCreating = () => {
    if (creatingItem && creatingValue.trim()) {
      if (creatingItem.type === "file") {
        const fileName = creatingValue.trim().endsWith(".md") ? creatingValue.trim() : `${creatingValue.trim()}.md`
        onCreateFile(fileName, creatingItem.parentPath)
      } else {
        onCreateFolder(creatingValue.trim(), creatingItem.parentPath)
      }
    }
    setCreatingItem(null)
    setCreatingValue("")
  }

  const handleDeleteItem = (path: string, type: "file" | "folder") => {
    if (type === "file") {
      onDeleteFile(path)
    } else {
      onDeleteFolder(path)
    }
  }

  const renderItem = (item: FileInfo, level = 0) => {
    const isExpanded = expandedFolders.has(item.path)
    const paddingLeft = level * 16
    const isEditing = editingItem?.path === item.path

    if (item.type === "folder") {
      return (
        <div key={item.path} className={cn(selectedItems.includes(item.path) && "bg-accent/30")}
          onClick={e => handleItemSelect(item.path, e)}>
          <div
            draggable
            onDragStart={(e) => handleDragStart(e, item.path, "folder")}
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition-colors group",
              draggedItem && "border-2 border-dashed border-muted-foreground/50",
              currentFile === item.path ? "font-bold text-foreground" : "text-muted-foreground"
            )}
            style={{ paddingLeft: paddingLeft + 8 }}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, item.path)}
          >
            <button onClick={() => {
              toggleFolder(item.path)
              onFolderClick?.(item.path)
            }} className="flex items-center gap-1 flex-1 min-w-0">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 flex-shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 flex-shrink-0" />
              )}
              {isExpanded ? (
                <FolderOpen className="w-4 h-4 flex-shrink-0" />
              ) : (
                <Folder className="w-4 h-4 flex-shrink-0" />
              )}
              {isEditing ? (
                <Input
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  onBlur={finishEditing}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") finishEditing()
                    if (e.key === "Escape") {
                      setEditingItem(null)
                      setEditingValue("")
                    }
                  }}
                  className="h-6 text-sm"
                  autoFocus
                />
              ) : (
                <span className="truncate" onDoubleClick={() => startEditing(item.path, "folder")}>
                  {item.name}
                </span>
              )}
            </button>
            <div className="opacity-0 group-hover:opacity-100 flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={(e) => { e.stopPropagation(); startCreating("file", item.path) }}
                title="New file"
              >
                <Plus className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={(e) => { e.stopPropagation(); startCreating("folder", item.path) }}
                title="New folder"
              >
                <FolderPlus className="w-3 h-3" />
              </Button>
              <DeleteConfirmationModal
                trigger={
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    title="Delete folder"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                }
                title="Delete Folder"
                description={`Are you sure you want to delete the folder "${item.name}" and all its contents? This action cannot be undone.`}
                onConfirm={() => handleDeleteItem(item.path, "folder")}
              />
            </div>
          </div>
          {isExpanded && item.children && (
            <div>
              {item.children.map((child) => renderItem(child, level + 1))}
            </div>
          )}
          {creatingItem?.parentPath === item.path && (
            <div
              className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm"
              style={{ paddingLeft: paddingLeft + 32 }}
            >
              {creatingItem.type === "file" ? (
                <FileText className="w-4 h-4 flex-shrink-0" />
              ) : (
                <Folder className="w-4 h-4 flex-shrink-0" />
              )}
              <Input
                value={creatingValue}
                onChange={(e) => setCreatingValue(e.target.value)}
                onBlur={finishCreating}
                onKeyDown={(e) => {
                  if (e.key === "Enter") finishCreating()
                  if (e.key === "Escape") {
                    setCreatingItem(null)
                    setCreatingValue("")
                  }
                }}
                placeholder={creatingItem.type === "file" ? "File name" : "Folder name"}
                className="h-6 text-sm"
                autoFocus
              />
            </div>
          )}
        </div>
      )
    } else if (level === 0) { // Only show root level files
      return (
        <div key={item.path} className={cn(selectedItems.includes(item.path) && "bg-accent/30")}
          onClick={e => handleItemSelect(item.path, e)}>
          <div
            draggable
            onDragStart={(e) => handleDragStart(e, item.path, "file")}
            className={cn(
              "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition-colors group",
              draggedItem && "border-2 border-dashed border-muted-foreground/50",
              currentFile === item.path ? "font-medium text-foreground" : "text-muted-foreground"
            )}
            style={{ paddingLeft: paddingLeft + 8 }}
            onClick={() => !isEditing && onFileSelect(item.path)}
          >
            <FileText className="w-4 h-4 flex-shrink-0" />
            {isEditing ? (
              <Input
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                onBlur={finishEditing}
                onKeyDown={(e) => {
                  if (e.key === "Enter") finishEditing()
                  if (e.key === "Escape") {
                    setEditingItem(null)
                    setEditingValue("")
                  }
                }}
                className="h-6 text-sm"
                autoFocus
              />
            ) : (
              <span className="truncate flex-1" onDoubleClick={() => startEditing(item.path, "file")}>
                {item.name.replace(".md", "")}
              </span>
            )}
            <div className="opacity-0 group-hover:opacity-100 ml-auto">
              <DeleteConfirmationModal
                trigger={
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    title="Delete file"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                }
                title="Delete File"
                description={`Are you sure you want to delete "${item.name.replace(".md", "")}"? This action cannot be undone.`}
                onConfirm={() => handleDeleteItem(item.path, "file")}
              />
            </div>
          </div>
        </div>
      )
    }
    return null; // Don't render nested files
  }

  const renderSearchResults = () => {
    console.log('Search results to render:', searchResults)
    return (
      <>
        {searchLoading ? (
          <div className="px-2 py-4 text-sm text-muted-foreground">Searching...</div>
        ) : (
          <SearchResults
            results={searchResults}
            query={searchQuery}
            currentFile={currentFile}
            onFileSelect={onFileSelect}
          />
        )}
      </>
    )
  }

  const organizedItems = organizeItems()

  // Handle item click for selection
  const handleItemSelect = (path: string, e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      setSelectedItems((prev) => prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path])
    } else if (e.shiftKey && selectedItems.length > 0) {
      // Range select (optional, simple version: select all between last and current)
      const allItems = organizedItems.flatMap(flattenItems)
      const lastIdx = allItems.findIndex(i => i.path === selectedItems[selectedItems.length - 1])
      const currIdx = allItems.findIndex(i => i.path === path)
      if (lastIdx !== -1 && currIdx !== -1) {
        const [start, end] = [lastIdx, currIdx].sort((a, b) => a - b)
        const range = allItems.slice(start, end + 1).map(i => i.path)
        setSelectedItems(Array.from(new Set([...selectedItems, ...range])))
      }
    } else {
      setSelectedItems([path])
    }
  }

  // Helper to flatten tree for range select
  const flattenItems = (item: FileInfo): FileInfo[] => {
    if (item.type === "folder" && item.children) {
      return [item, ...item.children.flatMap(flattenItems)]
    }
    return [item]
  }

  // Open modal and prompt for directory
  const handleOpenUploadModal = async () => {
    try {
      // @ts-ignore
      const dirHandle = await window.showDirectoryPicker()
      const tree: any = { name: dirHandle.name, path: dirHandle.name, type: "folder", children: [] }
      const handles: { [path: string]: FileSystemFileHandle } = {}
      await readDirectoryRecursive(dirHandle, tree, dirHandle.name, handles)
      setFsTree(tree)
      setFsHandles(handles)
      setCheckedPaths(new Set())
      setShowUploadModal(true)
    } catch (e) {
      // User cancelled
    }
  }

  // Recursively read directory
  const readDirectoryRecursive = async (dirHandle: FileSystemDirectoryHandle, node: any, basePath: string, handles: any) => {
    for await (const entry of (dirHandle as any).values()) {
      const name = entry.name
      const relPath = basePath + "/" + name
      if (entry.kind === "file") {
        node.children.push({ name, path: relPath, type: "file" })
        handles[relPath] = entry
      } else if (entry.kind === "directory") {
        const childNode: any = { name, path: relPath, type: "folder", children: [] }
        node.children.push(childNode)
        await readDirectoryRecursive(entry, childNode, relPath, handles)
      }
    }
  }

  // Toggle checkbox
  const handleCheck = (path: string) => {
    setCheckedPaths(prev => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }

  // Gather all checked files (recursively)
  const gatherCheckedFiles = (node: any): string[] => {
    if (node.type === "file" && checkedPaths.has(node.path)) return [node.path]
    if (node.type === "folder") {
      let files: string[] = []
      for (const child of node.children) {
        files = files.concat(gatherCheckedFiles(child))
      }
      return files
    }
    return []
  }

  // Upload checked files
  const handleUploadChecked = async () => {
    setUploading(true)
    try {
      if (!fsTree) return
      const filesToUpload = gatherCheckedFiles(fsTree)
      if (filesToUpload.length === 0) throw new Error("No files selected.")
      console.log('frontend vault', vaultname, typeof vaultname)
      const formData = new FormData()
      formData.append("vaultname", vaultname);


      for (const path of filesToUpload) {
        const handle = fsHandles[path]
        if (handle) {
          const file = await handle.getFile()
          formData.append("files", file, path)
        }
      }
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      if (!res.ok) throw new Error("Upload failed")
      toast({ title: "Upload successful", description: `${filesToUpload.length} file(s) uploaded.` })
      setShowUploadModal(false)
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" })
    } finally {
      setUploading(false)
    }
  }

  // Render file/folder tree with checkboxes
  const renderFsTree = (node: any) => {
    if (!node) return null
    if (node.type === "file") {
      return (
        <div key={node.path} className="flex items-center gap-2 pl-4">
          <Checkbox checked={checkedPaths.has(node.path)} onCheckedChange={() => handleCheck(node.path)} />
          <span>{node.name}</span>
        </div>
      )
    }
    return (
      <div key={node.path} className="pl-2">
        <div className="font-medium flex items-center gap-2">
          <Checkbox checked={checkedPaths.has(node.path)} onCheckedChange={() => handleCheck(node.path)} />
          <span>{node.name}</span>
        </div>
        <div className="ml-4 border-l border-muted-foreground/20">
          {node.children.map(renderFsTree)}
        </div>
      </div>
    )
  }

  // Helper to find item by path
  const findItemByPath = (items: FileInfo[], path: string): FileInfo | undefined => {
    for (const item of items) {
      if (item.path === path) return item
      if (item.type === "folder" && item.children) {
        const found = findItemByPath(item.children, path)
        if (found) return found
      }
    }
    return undefined
  }

  // Helper to get all files in a folder
  const getAllFilesInFolder = async (folder: FileInfo): Promise<File[]> => {
    let files: File[] = []
    if (folder.children) {
      for (const child of folder.children) {
        if (child.type === "file") {
          const file = await getFileFromPath(child.path)
          if (file) files.push(file)
        } else if (child.type === "folder") {
          const subFiles = await getAllFilesInFolder(child)
          files = files.concat(subFiles)
        }
      }
    }
    return files
  }

  // Dummy implementation: replace with your file system logic
  const getFileFromPath = async (path: string): Promise<File | null> => {
    // You must implement this to get a File object from your app's file system
    return null
  }

  return (
    <div className="p-2">
      <div className="flex items-center justify-between mb-2 px-2">
        <h3 className="text-sm font-medium">{isSearchActive ? "Search" : "Files"}</h3>
        <div className="flex gap-1">
          {isSearchActive ? (
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={toggleSearch} title="Close search">
              <X className="w-3 h-3" />
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => startCreating("file")}
                title="New file"
              >
                <Plus className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => startCreating("folder")}
                title="New folder"
              >
                <FolderPlus className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={handleOpenUploadModal}
                title="Upload selected"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12" /></svg>
              </Button>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={toggleSearch} title="Search files">
                <Search className="w-3 h-3" />
              </Button>
            </>
          )}
        </div>
      </div>

      {isSearchActive && (
        <div className="mb-2 px-2">
          <Input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="h-8 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                toggleSearch()
              }
            }}
          />
        </div>
      )}

      <div className="space-y-1">
        {isSearchActive ? (
          renderSearchResults()
        ) : (
          <>
            {creatingItem && !creatingItem.parentPath && (
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm">
                {creatingItem.type === "file" ? (
                  <FileText className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <Folder className="w-4 h-4 flex-shrink-0" />
                )}
                <Input
                  value={creatingValue}
                  onChange={(e) => setCreatingValue(e.target.value)}
                  onBlur={finishCreating}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") finishCreating()
                    if (e.key === "Escape") {
                      setCreatingItem(null)
                      setCreatingValue("")
                    }
                  }}
                  placeholder={creatingItem.type === "file" ? "File name" : "Folder name"}
                  className="h-6 text-sm"
                  autoFocus
                />
              </div>
            )}
            {organizedItems.map((item) => renderItem(item))}
            {organizedItems.length === 0 && !creatingItem && (
              <p className="text-sm text-muted-foreground px-2 py-4">No files found. Create your first note!</p>
            )}
          </>
        )}
      </div>
      {/*   {selectedFolderPath && (
        <FolderContentsSidebar
          folderPath={selectedFolderPath}
          files={files}
          contents={selectedFolderContents}
          onFileClick={handleFileClick}
          isVisible={isSidebarVisible}
          onClose={() => setIsSidebarVisible(false)}
        />
      )} */}

      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {fsTree && (
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="col-span-3">
                  {renderFsTree(fsTree)}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowUploadModal(false)} variant="outline">Cancel</Button>
            <Button onClick={handleUploadChecked} disabled={uploading || checkedPaths.size === 0}>
              {uploading ? "Uploading..." : "Done"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
