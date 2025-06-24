# Technical Documentation

## Core Functions and Their Implementation

### 1. File System Operations (`useFileSystem` hook)

#### Vault Management Functions

```typescript
// Select and create a new vault
const selectDirectory = async (vaultName: string) => {
    // Creates a new vault directory
    // Initializes with welcome.md
    // Sets up vault marker file
};

// Switch between existing vaults
const switchVault = async (vaultHandle: FileSystemDirectoryHandle) => {
    // Changes current vault
    // Loads vault contents
    // Updates UI state
};

// Create a new vault
const createNewVault = async (vaultName: string) => {
    // Creates new vault structure
    // Initializes with default files
    // Updates available vaults list
};
```

#### File Operations

```typescript
// Create a new file
const createFile = async (fileName: string, folderPath?: string) => {
    // Creates new file in specified location
    // Handles file extension
    // Updates file tree
};

// Open and read file
const openFile = async (filePath: string) => {
    // Reads file content
    // Handles different file types
    // Returns file content
};

// Save file changes
const saveFile = async (filePath: string, content: string) => {
    // Writes content to file
    // Handles auto-save
    // Updates file tree
};

// Delete file
const deleteFile = async (filePath: string) => {
    // Removes file from system
    // Updates file tree
    // Handles cleanup
};
```

#### Folder Operations

```typescript
// Create new folder
const createFolder = async (folderName: string, parentPath?: string) => {
    // Creates directory structure
    // Updates folder tree
    // Handles nested folders
};

// Rename folder
const renameFolder = async (oldPath: string, newName: string) => {
    // Updates folder name
    // Maintains hierarchy
    // Updates references
};

// Delete folder
const deleteFolder = async (folderPath: string) => {
    // Removes folder and contents
    // Updates folder tree
    // Handles cleanup
};
```

### 2. File Tree Component Functions

#### Tree Management

```typescript
// Toggle folder expansion
const toggleFolder = (folderPath: string) => {
    // Expands/collapses folder
    // Updates UI state
    // Handles nested folders
};

// Handle file selection
const handleFileClick = (filePath: string) => {
    // Selects file
    // Updates current file
    // Triggers editor load
};
```

#### Drag and Drop Operations

```typescript
// Handle drag start
const handleDragStart = (
    e: React.DragEvent,
    path: string,
    type: "file" | "folder"
) => {
    // Initiates drag operation
    // Sets drag data
    // Updates UI state
};

// Handle drop
const handleDrop = (e: React.DragEvent, targetFolder: string) => {
    // Processes drop operation
    // Moves files/folders
    // Updates tree structure
};
```

### 3. Note Editor Functions

#### Content Management

```typescript
// Save note content
const handleSave = async (content: any) => {
    // Saves editor content
    // Handles auto-save
    // Updates file state
};

// Load note content
const handleFileSelect = async (filePath: string) => {
    // Loads file content
    // Updates editor state
    // Handles different formats
};
```

### 4. Search and Navigation

#### Search Functions

```typescript
// Toggle search
const toggleSearch = () => {
    // Activates/deactivates search
    // Resets search state
    // Updates UI
};

// Handle search
const handleSearch = (query: string) => {
    // Filters files/folders
    // Updates search results
    // Handles real-time search
};
```

### 5. State Management

#### Vault State

```typescript
// Current vault state
const [currentVault, setCurrentVault] = useState<VaultInfo | null>(null);
const [availableVaults, setAvailableVaults] = useState<VaultInfo[]>([]);

// File system state
const [files, setFiles] = useState<string[]>([]);
const [folders, setFolders] = useState<string[]>([]);
const [currentFile, setCurrentFile] = useState<FileInfo | null>(null);
```

### 6. Error Handling

#### Error Management Functions

```typescript
// Handle file system errors
const handleFileSystemError = (error: Error) => {
    // Logs error
    // Shows user notification
    // Handles recovery
};

// Validate operations
const validateOperation = (operation: string, params: any) => {
    // Validates operation parameters
    // Checks permissions
    // Returns validation result
};
```

## Important Types and Interfaces

### File System Types

```typescript
interface FileInfo {
    name: string;
    path: string;
    type: "file" | "folder";
    handle?: FileSystemFileHandle;
    directoryHandle?: FileSystemDirectoryHandle;
    children?: FileInfo[];
}

interface VaultInfo {
    name: string;
    handle: FileSystemDirectoryHandle;
    parentHandle: FileSystemDirectoryHandle;
}
```

### State Types

```typescript
interface FileSystemState {
    currentVault: VaultInfo | null;
    availableVaults: VaultInfo[];
    files: string[];
    folders: string[];
    currentFile: FileInfo | null;
    isLoading: boolean;
}
```

## Event Handlers

### File Tree Events

```typescript
// File selection
const onFileSelect = (filePath: string) => {
    // Handles file selection
    // Updates current file
    // Loads file content
};

// Folder selection
const onFolderClick = (folderPath: string) => {
    // Handles folder selection
    // Updates selected folder
    // Shows folder contents
};
```

### Editor Events

```typescript
// Content change
const onContentChange = (content: any) => {
    // Handles content updates
    // Triggers auto-save
    // Updates preview
};

// Save trigger
const onSave = async (content: any) => {
    // Handles manual save
    // Updates file content
    // Shows save status
};
```

## Utility Functions

### File System Utilities

```typescript
// Get file extension
const getFileExtension = (fileName: string): string => {
    // Extracts file extension
    // Handles edge cases
    // Returns extension
};

// Validate file name
const isValidFileName = (fileName: string): boolean => {
    // Checks file name validity
    // Validates against rules
    // Returns validation result
};
```

### Path Utilities

```typescript
// Get parent path
const getParentPath = (path: string): string => {
    // Extracts parent directory
    // Handles root case
    // Returns parent path
};

// Join paths
const joinPaths = (...paths: string[]): string => {
    // Joins path segments
    // Handles separators
    // Returns full path
};
```

## Security Considerations

### File System Security

-   All file operations are performed through the File System Access API
-   Operations are sandboxed to the selected directory
-   No direct file system access outside the vault
-   Secure handling of file handles and permissions

### Data Security

-   All data is stored locally
-   No cloud synchronization
-   No data transmission
-   Secure file handling practices

## Performance Optimizations

### File System Operations

-   Caching of file handles
-   Lazy loading of file contents
-   Efficient file tree updates
-   Optimized search operations

### UI Performance

-   Virtualized file tree
-   Debounced search
-   Efficient state updates
-   Optimized rendering
