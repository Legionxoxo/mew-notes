// IndexedDB utilities for persisting handles
const DB_NAME = "VaultHandles";
const DB_VERSION = 1;
const STORE_NAME = "handles";

export const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
    });
};

export const saveHandle = async (
    key: string,
    handle: FileSystemDirectoryHandle
): Promise<void> => {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    await store.put(handle, key);
    db.close();
};

export const getHandle = async (
    key: string
): Promise<FileSystemDirectoryHandle | null> => {
    try {
        const db = await openDB();
        const transaction = db.transaction([STORE_NAME], "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);

        return new Promise((resolve, reject) => {
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const handle = request.result;
                if (handle) {
                    resolve(handle);
                } else {
                    resolve(null);
                }
            };
        });
    } catch (error) {
        console.error("Error getting handle from IndexedDB:", error);
        return null;
    }
};

export const removeHandle = async (key: string): Promise<void> => {
    const db = await openDB();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    await store.delete(key);
    db.close();
};

export const getAllHandles = async (): Promise<{
    [key: string]: FileSystemDirectoryHandle;
}> => {
    try {
        const db = await openDB();
        const transaction = db.transaction([STORE_NAME], "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        const keys = store.getAllKeys();

        return new Promise((resolve, reject) => {
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                keys.onsuccess = () => {
                    const handles: {
                        [key: string]: FileSystemDirectoryHandle;
                    } = {};
                    const values = request.result;
                    const keyList = keys.result;

                    keyList.forEach((key, index) => {
                        handles[key as string] = values[index];
                    });

                    resolve(handles);
                };
            };
        });
    } catch (error) {
        console.error("Error getting all handles:", error);
        return {};
    }
};
