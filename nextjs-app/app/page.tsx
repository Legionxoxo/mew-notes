"use client"

import { useState, useEffect } from "react"
import { FileTree } from "@/components/file-tree"
import NoteEditor from "@/components/note-editor"
import { VaultSelector } from "@/components/vault-selector"
import { VaultManager } from "@/components/vault-manager"
import { useFileSystem } from "@/hooks/use-file-system"
import { FolderContentsSidebar } from "@/components/folder-sidebar"
import { FileInfo } from "@/types/fileinfo"

type TreeItem = FileInfo

export default function NoteTakingApp() {
  const {
    currentVault,
    availableVaults,
    files,
    folders,
    currentFile,
    isLoading,
    selectDirectory,
    switchVault,
    createFile,
    createFolder,
    renameFile,
    renameFolder,
    openFile,
    saveFile,
    deleteFile,
    deleteFolder,
    refreshFiles,
    moveFile,
    deleteVault,
    createNewVault,
    moveFolder,
  } = useFileSystem()

  const [editorContent, setEditorContent] = useState<any>(null)
  const [selectedFolderPath, setSelectedFolderPath] = useState<string | null>(null)
  const [selectedFolderContents, setSelectedFolderContents] = useState<TreeItem[] | null>(null)
  const [isSidebarVisible, setIsSidebarVisible] = useState(false)

  useEffect(() => {
    if (currentVault && files.includes("welcome.md") && !currentFile) {
      handleFileSelect("welcome.md")
    }
  }, [currentVault, files, currentFile])

  useEffect(() => {
    if (currentFile) {
      console.log("Current file info:", {
        name: currentFile.name,
        path: currentFile.path,
        hasFileHandle: !!currentFile.handle,
        hasDirectoryHandle: !!currentFile.directoryHandle
      })
    }
  }, [currentFile])

  const handleSave = async (content: any) => {
    if (currentFile) {
      await saveFile(currentFile.path, content)
      setEditorContent(content)
    }
  }

  const handleFileSelect = async (filePath: string) => {
    const content = await openFile(filePath)
    setEditorContent(content)
  }

  const handleFileClickFromSidebar = async (filePath: string) => {
    await handleFileSelect(filePath)
  }

  const handleCreateFile = async (fileName: string, folderPath?: string) => {
    await createFile(fileName, folderPath)
    await refreshFiles()
  }

  const handleCreateFolder = async (folderName: string, parentPath?: string) => {
    await createFolder(folderName, parentPath)
    await refreshFiles()
  }

  const handleRenameFile = async (oldPath: string, newName: string) => {
    try {
      await renameFile(oldPath, newName)
      await refreshFiles()
    } catch (error) {
      console.error("Failed to rename file:", error)
      alert("Failed to rename file. Please try again.")
    }
  }

  const handleRenameFolder = async (oldPath: string, newName: string) => {
    try {
      await renameFolder(oldPath, newName)
      await refreshFiles()
    } catch (error) {
      console.error("Failed to rename folder:", error)
      alert("Failed to rename folder. Please try again.")
    }
  }

  const handleDeleteFile = async (filePath: string) => {
    try {
      await deleteFile(filePath)
    } catch (error) {
      console.error("Failed to delete file:", error)
      alert("Failed to delete file. Please try again.")
    }
  }

  const handleDeleteFolder = async (folderPath: string) => {
    try {
      await deleteFolder(folderPath)
    } catch (error) {
      console.error("Failed to delete folder:", error)
      alert("Failed to delete folder. Please try again.")
    }
  }

  const handleFileDrop = async (filePath: string, targetFolder: string) => {
    try {
      await moveFile(filePath, targetFolder)
      await refreshFiles()
    } catch (error) {
      console.error("Failed to move file:", error)
      alert("Failed to move file. Please try again.")
    }
  }

  const handleFolderDrop = async (folderPath: string, targetFolder: string) => {
    try {
      await moveFolder(folderPath, targetFolder)
      await refreshFiles()
    } catch (error) {
      console.error("Failed to move folder:", error)
      alert("Failed to move folder. Please try again.")
    }
  }

  const handleFolderClick = (folderPath: string) => {
    setSelectedFolderPath(folderPath)
    const allItems = [...files, ...folders]
    const folder = allItems.find(
      (item) => item.type === "folder" && item.path === folderPath
    ) as TreeItem

    setSelectedFolderContents(folder?.children ?? null)
    setIsSidebarVisible(true)
  }

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading vault...</p>
        </div>
      </div>
    )
  }

  if (!currentVault) {
    return <VaultSelector onSelectVault={selectDirectory} />
  }

  return (
    <div className="flex h-screen bg-background">
      {/* File Tree Panel */}
      <div className="w-64 border-r border-border flex flex-col h-full bg-sidebar">
        <div className="p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="Airvault logo" className="w-6 h-6" />
              <div className="flex items-baseline gap-1">
                <span className="text-sm text-muted-foreground">Vault:&nbsp;</span>
                <span className="text-lg font-bold text-primary">{currentVault.name}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <FileTree
            files={files}
            folders={folders}
            currentFile={currentFile?.path}
            onFileSelect={handleFileSelect}
            onFileDrop={handleFileDrop}
            onFolderDrop={handleFolderDrop}
            onCreateFile={handleCreateFile}
            onCreateFolder={handleCreateFolder}
            onRenameFile={handleRenameFile}
            onRenameFolder={handleRenameFolder}
            onDeleteFile={handleDeleteFile}
            onDeleteFolder={handleDeleteFolder}
            onFolderClick={handleFolderClick}
            vaultname={currentVault.name}
          />
        </div>

        <VaultManager
          currentVault={currentVault}
          availableVaults={availableVaults}
          onCreateNewVault={createNewVault}
          onDeleteVault={deleteVault}
          onSwitchVault={switchVault}
        />
      </div>

      {/* FolderContentsSidebar (right of FileTree) */}
      {isSidebarVisible && selectedFolderPath && (
        <FolderContentsSidebar
          folderPath={selectedFolderPath}
          files={files}
          contents={selectedFolderContents}
          onFileClick={handleFileClickFromSidebar}
          isVisible={isSidebarVisible}
          onClose={() => setIsSidebarVisible(false)}
        />
      )}

      {/* Note Editor */}
      <div className="flex-1 h-full">
        {currentFile ? (
          <NoteEditor
            key={currentFile.path}
            fileName={currentFile.name}
            initialContent={editorContent}
            onSave={handleSave}
            currentFileHandle={currentFile.handle}
            currentDirectoryHandle={currentFile.directoryHandle}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground h-full p-4">
            <div className="text-center max-w-md">
              <h2 className="text-3xl font-bold mb-3 tracking-tight">Welcome to Your Vault</h2>
              <p className="text-lg leading-relaxed">Create your first note to get started.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
