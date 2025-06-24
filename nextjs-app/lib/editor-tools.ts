// Custom ImageTool for EditorJS with proper toolbox icon as SVG element
class ImageTool {
    data: { url?: string; caption?: string; isTemporary?: boolean };
    wrapper: HTMLElement | null;
    currentFileHandle: FileSystemFileHandle | null;
    currentDirectoryHandle: FileSystemDirectoryHandle | null;
    temporaryBlobUrl: string | null = null;

    constructor({
        data,
    }: {
        data: { url?: string; caption?: string; isTemporary?: boolean };
    }) {
        this.data = data || {};
        this.wrapper = null;
        this.currentFileHandle = null;
        this.currentDirectoryHandle = null;
        this.temporaryBlobUrl = null;
        console.log("ImageTool initialized with data:", data);
    }

    setCurrentFileHandle(handle: FileSystemFileHandle) {
        this.currentFileHandle = handle;
        console.log("File handle set:", handle);
    }

    setCurrentDirectoryHandle(handle: FileSystemDirectoryHandle) {
        this.currentDirectoryHandle = handle;
        console.log("Directory handle set:", handle);
    }

    render(): HTMLElement {
        this.wrapper = document.createElement("div");
        this.wrapper.classList.add("simple-image");

        if (this.data.url) {
            this._createImage(this.data.url, this.data.caption);
        } else {
            this._createUploadForm();
        }

        return this.wrapper;
    }

    _createImage(url: string, caption = "") {
        if (!this.wrapper) return;

        this.wrapper.innerHTML = `
        <div style="text-align: center; margin: 15px 0;">
          <img src="${url}" alt="${caption}" style="max-width: 100%; height: auto; border-radius: 4px;" />
          <input type="text" placeholder="Image name" value="${caption}" 
                 style="width: 100%; margin-top: 8px; padding: 4px; border: 1px solid #ddd; border-radius: 4px; text-align: center;"
                 onchange="this.parentElement.querySelector('img').alt = this.value" />
        </div>
      `;
    }

    _createUploadForm() {
        if (!this.wrapper) return;

        this.wrapper.innerHTML = `
        <div style="border: 2px dashed #ddd; padding: 20px; text-align: center; border-radius: 4px;"
             class="image-upload-area">
          <div style="margin-bottom: 15px;">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <p style="margin: 10px 0; color: #666;">Drag and drop an image here or</p>
          <input type="file" 
                 accept="image/*" 
                 style="display: none;" 
                 class="image-file-input" />
          <button type="button" 
                  class="upload-button"
                  style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Choose File
          </button>
          <p style="margin: 10px 0; font-size: 12px; color: #666;">Supports: JPG, PNG, GIF, WebP</p>
        </div>
      `;

        const uploadArea = this.wrapper.querySelector(
            ".image-upload-area"
        ) as HTMLElement;
        const fileInput = this.wrapper.querySelector(
            ".image-file-input"
        ) as HTMLInputElement;
        const uploadButton = this.wrapper.querySelector(
            ".upload-button"
        ) as HTMLButtonElement;

        uploadButton.addEventListener("click", () => fileInput.click());
        fileInput.addEventListener("change", (e) => {
            const target = e.target as HTMLInputElement;
            if (target.files && target.files[0]) {
                this._handleFileSelect(target.files[0]);
            }
        });

        uploadArea.addEventListener("dragover", (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = "#007bff";
            uploadArea.style.backgroundColor = "#f8f9fa";
        });

        uploadArea.addEventListener("dragleave", (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = "#ddd";
            uploadArea.style.backgroundColor = "transparent";
        });

        uploadArea.addEventListener("drop", (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = "#ddd";
            uploadArea.style.backgroundColor = "transparent";

            if (
                e.dataTransfer?.files[0] &&
                e.dataTransfer.files[0].type.startsWith("image/")
            ) {
                this._handleFileSelect(e.dataTransfer.files[0]);
            } else {
                console.log("Please drop an image file");
            }
        });
    }

    async _handleFileSelect(file: File) {
        if (!file.type.startsWith("image/")) {
            console.log("Please select an image file");
            return;
        }

        console.log("Handling file select:", {
            fileName: file.name,
            fileType: file.type,
            hasDirectoryHandle: !!this.currentDirectoryHandle,
            hasFileHandle: !!this.currentFileHandle,
        });

        try {
            // Create a unique filename for the image
            const timestamp = Date.now();
            const extension = file.name.split(".").pop();
            const imageFileName = `image_${timestamp}.${extension}`;

            if (this.currentDirectoryHandle) {
                console.log("Creating image file:", imageFileName);

                // Create the image file in the current directory
                const imageFileHandle =
                    await this.currentDirectoryHandle.getFileHandle(
                        imageFileName,
                        {
                            create: true,
                        }
                    );
                const writable = await imageFileHandle.createWritable();
                await writable.write(file);
                await writable.close();

                console.log("Image file created successfully");

                // Store the relative path for the image
                this.data.url = imageFileName;
                this.data.caption = file.name;
                this._createImage(imageFileName, file.name);
            } else {
                console.error("No directory handle available");
                // Create a temporary blob URL for preview
                const blob = new Blob([await file.arrayBuffer()], {
                    type: file.type,
                });
                const url = URL.createObjectURL(blob);
                this.temporaryBlobUrl = url;
                this.data.url = url;
                this.data.caption = file.name;
                this.data.isTemporary = true;
                this._createImage(url, file.name);
                console.log(
                    "Image preview created. Please save the file to persist the image."
                );
            }
        } catch (error) {
            console.error("Error handling file select:", error);
            console.log("Failed to process image. Please try again.");
        }
    }

    save() {
        if (!this.wrapper) return this.data;

        const img = this.wrapper.querySelector("img");
        const captionInput = this.wrapper.querySelector(
            'input[type="text"]'
        ) as HTMLInputElement;

        if (img) {
            return {
                url: this.data.url || "",
                caption: captionInput ? captionInput.value : "",
                isTemporary: !!this.temporaryBlobUrl,
            };
        }

        return this.data;
    }

    static get toolbox() {
        return {
            title: "Image",
            icon: `<img src="/image-tool.svg" width="18" height="18" alt="icon" />`,
        };
    }
}

// Export tools config function with dynamic imports and added ImageTool
export const getEditorTools = async (
    currentFileHandle?: FileSystemFileHandle,
    currentDirectoryHandle?: FileSystemDirectoryHandle
): Promise<{
    [toolName: string]: any;
}> => {
    console.log("Getting editor tools with:", {
        hasFileHandle: !!currentFileHandle,
        hasDirectoryHandle: !!currentDirectoryHandle,
    });

    const Header = (await import("@editorjs/header")).default;
    const List = (await import("@editorjs/list")).default;
    //@ts-ignore
    const Marker = (await import("@editorjs/marker")).default;
    //@ts-ignore
    const Checklist = (await import("@editorjs/checklist")).default;
    const Table = (await import("@editorjs/table")).default;
    const Code = (await import("@editorjs/code")).default;
    const Delimiter = (await import("@editorjs/delimiter")).default;

    // Create a new instance of ImageTool with the current file handle
    const imageTool = new ImageTool({ data: {} });
    if (currentFileHandle) {
        imageTool.setCurrentFileHandle(currentFileHandle);
    }
    if (currentDirectoryHandle) {
        imageTool.setCurrentDirectoryHandle(currentDirectoryHandle);
    }

    return {
        header: {
            class: Header,
            inlineToolbar: true,
            config: {
                placeholder: "Enter a heading",
                levels: [1, 2, 3, 4, 5, 6],
                defaultLevel: 2,
            },
        },
        list: {
            class: List,
            inlineToolbar: true,
            config: {
                defaultStyle: "unordered",
            },
        },
        marker: {
            class: Marker,
            shortcut: "CMD+SHIFT+M",
        },
        checklist: {
            class: Checklist,
        },
        table: {
            class: Table,
            inlineToolbar: true,
        },
        code: {
            class: Code,
        },
        delimiter: {
            class: Delimiter,
        },
        image: {
            class: ImageTool,
            config: {
                currentFileHandle,
                currentDirectoryHandle,
            },
        },
    };
};
