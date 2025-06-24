// components/folder-contents-sidebar.tsx

import { FileText, Folder, FolderOpen, X, Search } from "lucide-react"
import React, { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface FileInfo {
    name: string
    path: string
    type: "file" | "folder"
    children?: FileInfo[]
}

interface FolderContentsSidebarProps {
    folderPath: string
    files: string[]
    onFileClick: (filePath: string) => void
    isVisible?: boolean
    onClose?: () => void
    contents?: FileInfo[] | null
}

interface SearchResult {
    file: string
    score: number
    matches: { start: number; end: number }[]
}

export const FolderContentsSidebar: React.FC<FolderContentsSidebarProps> = ({
    folderPath,
    files = [],
    onFileClick,
    isVisible,
    onClose,
    contents
}) => {
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<SearchResult[]>([])
    const [folderFiles, setFolderFiles] = useState<string[]>([])
    const searchInputRef = useRef<HTMLInputElement>(null)

    if (!folderPath || !Array.isArray(files)) return null;

    useEffect(() => {
        // Get files that are direct children of the current folder
        const filteredFiles = files.filter(file => {
            const filePath = file;
            const relativePath = filePath.slice(folderPath.length + 1);
            return filePath.startsWith(folderPath) && !relativePath.includes("/");
        });
        setFolderFiles(filteredFiles);

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            const results: SearchResult[] = filteredFiles.map(file => {
                const fileName = file.split("/").pop() || ""
                const lowerFileName = fileName.toLowerCase()
                const matches: { start: number; end: number }[] = []
                let score = 0
                let lastIndex = 0

                // Find all matches and calculate score
                while (true) {
                    const index = lowerFileName.indexOf(query, lastIndex)
                    if (index === -1) break
                    matches.push({ start: index, end: index + query.length })
                    score += 1

                    if (index === 0) score += 2

                    if (fileName === query) score += 3
                    lastIndex = index + 1
                }

                return { file, score, matches }
            }).filter(result => result.matches.length > 0)
                .sort((a, b) => b.score - a.score)

            setSearchResults(results)
        } else {
            setSearchResults([])
        }
    }, [searchQuery, files, folderPath])

    const getFolderContents = () => {
        if (!contents) return [];

        // Get only files that are direct children of the current folder
        return contents.filter(item => {
            const itemPath = item.path;
            const relativePath = itemPath.slice(folderPath.length + 1);
            return !relativePath.includes("/") && item.type === "file";
        }).sort((a, b) => a.name.localeCompare(b.name));
    };

    const folderContents = getFolderContents();

    const handleItemClick = (item: FileInfo) => {
        if (item.type === "file") {
            onFileClick(item.path);
        }
    };

    const highlightText = (text: string, matches: { start: number; end: number }[]) => {
        if (matches.length === 0) return text

        const parts: JSX.Element[] = []
        let lastIndex = 0

        matches.forEach((match, i) => {

            if (match.start > lastIndex) {
                parts.push(<span key={`text-${i}`}>{text.slice(lastIndex, match.start)}</span>)
            }
            parts.push(
                <span key={`match-${i}`} className="bg-yellow-200 dark:bg-yellow-800">
                    {text.slice(match.start, match.end)}
                </span>
            )
            lastIndex = match.end
        })

        if (lastIndex < text.length) {
            parts.push(<span key="text-end">{text.slice(lastIndex)}</span>)
        }

        return parts
    }

    return (
        <div className={`w-60 flex flex-col h-full bg-sidebar ${isVisible ? "block" : "hidden"}`}>
            <div className="p-4 flex-shrink-0">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                        <FolderOpen className="w-6 h-6 flex-shrink-0" />
                        <h2 className="text-lg font-medium">{folderPath.split("/").pop()}</h2>
                    </div>
                    {onClose && (
                        <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">
                            <X className="w-4 h-4 flex-shrink-0" />
                        </button>
                    )}
                </div>
                <div className="h-4" />
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                        ref={searchInputRef}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search in folder..."
                        className="h-8 pl-8 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-muted-foreground/30 transition"
                        onKeyDown={(e) => {
                            if (e.key === "Escape") {
                                setSearchQuery("")
                            }
                        }}
                    />
                    {searchQuery && (
                        <X
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground cursor-pointer hover:text-foreground"
                            onClick={() => setSearchQuery("")}
                        />
                    )}
                </div>
            </div>
            <div className="flex-1 overflow-auto p-2">
                <ul className="space-y-1">
                    {searchQuery.trim() ? (
                        searchResults.map(result => (
                            <li
                                key={result.file}
                                className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer text-muted-foreground"
                                onClick={() => onFileClick(result.file)}
                            >
                                <FileText className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">
                                    {highlightText(
                                        (result.file.split("/").pop() || "").replace(/\.md$/, ""),
                                        result.matches
                                    )}
                                </span>
                            </li>
                        ))
                    ) : (
                        folderFiles.map(file => (
                            <li
                                key={file}
                                className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer text-muted-foreground"
                                onClick={() => onFileClick(file)}
                            >
                                <FileText className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">
                                    {(file.split("/").pop() || "").replace(/\.md$/, "")}
                                </span>
                            </li>
                        ))
                    )}
                    {searchQuery.trim() && searchResults.length === 0 && (
                        <p className="text-sm text-muted-foreground px-2 py-4">No files found</p>
                    )}
                    {!searchQuery.trim() && folderFiles.length === 0 && (
                        <p className="text-sm text-muted-foreground px-2 py-4">No files in this folder</p>
                    )}
                </ul>
            </div>
        </div>
    );
};
