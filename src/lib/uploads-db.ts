import { downloadCloudFile } from "@/lib/folio-cloud";

const DB_NAME = "ius-uploads";
const STORE = "files";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("indexedDB"));
  });
}

export async function saveUploadBlob(id: string, blob: Blob): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("put"));
  });
  db.close();
}

export async function getUploadBlob(id: string): Promise<Blob | undefined> {
  const db = await openDb();
  const blob = await new Promise<Blob | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result as Blob | undefined);
    req.onerror = () => reject(req.error ?? new Error("get"));
  });
  db.close();
  return blob;
}

export async function deleteUploadBlob(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("delete"));
  });
  db.close();
}

export async function resolveUploadBlob(file: {
  id: string;
  publicUrl?: string;
  storagePath?: string;
}): Promise<Blob | undefined> {
  const local = await getUploadBlob(file.id);
  if (local) return local;
  const remote = file.publicUrl || file.storagePath;
  if (!remote) return undefined;
  const blob = await downloadCloudFile(remote);
  if (!blob) return undefined;
  await saveUploadBlob(file.id, blob).catch(() => undefined);
  return blob;
}

export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
export const MAX_UPLOADS = 40;
