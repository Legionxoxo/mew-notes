"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FolderOpen } from "lucide-react"

interface VaultSelectorProps {
  onSelectVault: (vaultName: string) => void
}

export function VaultSelector({ onSelectVault }: VaultSelectorProps) {
  const [vaultName, setVaultName] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateVault = async () => {
    if (!vaultName.trim()) {
      alert("Please enter a vault name")
      return
    }

    try {
      setIsCreating(true)
      if ("showDirectoryPicker" in window) {
        await onSelectVault(vaultName.trim())
      } else {
        alert(
          "File System Access API is not supported in this browser. Please use Chrome, Edge, or another Chromium-based browser.",
        )
      }
    } catch (error) {
      console.error("Error creating vault:", error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1A1A1A] p-4">
      <div
        className="
          w-full max-w-md 
          bg-[#1A1A1A]/90 
          border border-[#333] 
          backdrop-blur-md 
          shadow-2xl 
          rounded-xl 
          animate-fadeInCustom
          p-8
          text-gray-300
        "
      >
        <div className="text-center mb-6">
          <div className="mx-auto mb-4 w-12 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
            <img src="/logo.svg" alt="Airvault logo" className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-semibold">Create Your Vault</h2>
          <p className="mt-2 text-gray-400 max-w-sm mx-auto">
            Choose a location and name for your vault. A new folder will be created to store all your notes as markdown files.
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="vault-name" className="text-gray-400">
              Vault Name
            </Label>
            <Input
              id="vault-name"
              placeholder="My Notes"
              value={vaultName}
              onChange={(e) => setVaultName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateVault()}
              className="bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-500 focus:ring-primary"
            />
          </div>

          <Button onClick={handleCreateVault} className="w-full" size="lg" disabled={isCreating}>
            <FolderOpen className="w-5 h-5 mr-2" />
            {isCreating ? "Creating Vault..." : "Create Vault"}
          </Button>
        </div>

        <div className="mt-8 text-sm text-gray-400 max-w-sm mx-auto">
          <p className="mb-2 font-semibold">What happens next?</p>
          <ul className="space-y-1 text-xs list-disc list-inside">
            <li>Choose where to create your vault folder</li>
            <li>A new folder with your vault name will be created</li>
            <li>A welcome note will be added to get you started</li>
            <li>All notes are saved as .md (markdown) files</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
