"use client"

import { FileText } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchResultItem {
    filename: string
    content?: string
    distance?: number
}

interface SearchResultsProps {
    results: (string | SearchResultItem)[]
    query: string
    currentFile?: string
    onFileSelect: (filePath: string) => void
}

export function SearchResults({ results, query, currentFile, onFileSelect }: SearchResultsProps) {
    if (results.length === 0) {
        return (
            <div className="px-2 py-4 text-sm text-muted-foreground">
                {query.trim() ? "No matching files found" : "Type to search..."}
            </div>
        )
    }

    const seen = new Set<string>()

    return (
        <div className="space-y-1">
            {results.map((result, idx) => {
                const filePath = typeof result === "string" ? result : result.filename

                // Avoid duplicate filenames
                if (seen.has(filePath)) return null
                seen.add(filePath)

                const content = typeof result === "string" ? undefined : result.content
                const distance = typeof result === "string" ? undefined : result.distance

                const fileName = filePath.split("/").pop() || ""
                const folderPath = filePath.split("/").slice(0, -1).join("/")

                const lowerFileName = fileName.toLowerCase()
                const lowerQuery = query.toLowerCase()
                const index = lowerFileName.indexOf(lowerQuery)

                let displayName
                if (index !== -1 && query.trim()) {
                    const before = fileName.substring(0, index)
                    const match = fileName.substring(index, index + query.length)
                    const after = fileName.substring(index + query.length)
                    displayName = (
                        <>
                            {before}
                            <span className="bg-yellow-200 dark:bg-yellow-800">{match}</span>
                            {after}
                        </>
                    )
                } else {
                    displayName = fileName
                }

                return (
                    <div
                        key={filePath}
                        className={cn(
                            "flex flex-col gap-0.5 px-2 py-1.5 rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer",
                            currentFile === filePath && "bg-accent text-accent-foreground",
                        )}
                        onClick={() => onFileSelect(filePath)}
                    >
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 flex-shrink-0" />
                            <span className="truncate font-medium">
                                {typeof displayName === 'string'
                                    ? displayName.replace(".md", "")
                                    : displayName}
                            </span>
                            {distance !== undefined && (
                                <span className="ml-2 text-xs text-muted-foreground">{distance.toFixed(2)}</span>
                            )}
                        </div>
                        {folderPath && <span className="text-xs text-muted-foreground truncate">{folderPath}</span>}
                        {content && (
                            <span className="text-xs text-muted-foreground truncate">
                                {content.slice(0, 120)}{content.length > 120 ? '...' : ''}
                            </span>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
