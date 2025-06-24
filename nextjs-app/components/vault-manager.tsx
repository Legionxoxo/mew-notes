"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Settings, Plus, Trash2, FolderOpen } from "lucide-react"

interface VaultInfo {
  name: string
  handle: FileSystemDirectoryHandle
  parentHandle: FileSystemDirectoryHandle
}

interface VaultManagerProps {
  currentVault: VaultInfo
  availableVaults: VaultInfo[]
  onCreateNewVault: () => void
  onDeleteVault: (vault?: VaultInfo) => void
  onSwitchVault: (vault: VaultInfo) => void
}

export function VaultManager({
  currentVault,
  availableVaults,
  onCreateNewVault,
  onDeleteVault,
  onSwitchVault,
}: VaultManagerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [deletingVault, setDeletingVault] = useState<VaultInfo | null>(null)

  const handleDeleteVault = async (vault: VaultInfo) => {
    try {
      setDeletingVault(vault)
      await onDeleteVault(vault)
    } catch (error) {
      console.error("Failed to delete vault:", error)
      alert("Failed to delete vault. Please try again.")
    } finally {
      setDeletingVault(null)
    }
  }

  return (
    <div className="p-4 border-t border-border">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" className="w-full justify-start" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Manage Vaults
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Vault Management</DialogTitle>
            <DialogDescription>Switch between vaults, create new ones, or delete existing vaults.</DialogDescription>
          </DialogHeader>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Current Vault</h4>
                  <p className="text-base text-muted-foreground font-bold">{currentVault.name}</p>
                </div>

                {availableVaults.length > 1 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Switch Vault</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {availableVaults
                        .filter((vault) => vault.name !== currentVault.name)
                        .map((vault) => (
                          <div key={vault.name} className="flex items-center justify-between">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 justify-start mr-2"
                              onClick={() => {
                                onSwitchVault(vault)
                                setIsOpen(false)
                              }}
                            >
                              <FolderOpen className="w-4 h-4 mr-2" />
                              {vault.name}
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  disabled={deletingVault === vault}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Vault</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete the vault "{vault.name}"? This action cannot be
                                    undone and will permanently delete all notes in this vault.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteVault(vault)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete Vault
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Button
                    onClick={() => {
                      onCreateNewVault()
                      setIsOpen(false)
                    }}
                    className="w-full"
                    variant="outline"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Vault
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full" disabled={deletingVault === currentVault}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        {deletingVault === currentVault ? "Deleting..." : "Delete Current Vault"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the vault "{currentVault.name}" and
                          all its contents from your computer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            handleDeleteVault(currentVault)
                            setIsOpen(false)
                          }}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete Vault
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    </div>
  )
}
