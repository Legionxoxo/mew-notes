export interface FileInfo {
    name: string;
    path: string;
    type: "file" | "folder";
    children?: FileInfo[];
}
