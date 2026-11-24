import { hasServerStorage, requestStorage } from './serverStorage';

// Local previews keep binary uploads in IndexedDB.
function openMediaDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('safarnama-media', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('files');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function storeMedia(file: File): Promise<string> {
  if (hasServerStorage) {
    const result = await requestStorage<{ url: string }>('media', {
      method: 'POST', headers: { 'Content-Type': file.type }, body: file,
    }, true);
    return result.url;
  }
  const db = await openMediaDB();
  const id = crypto.randomUUID();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('files', 'readwrite');
      transaction.objectStore('files').put(file, id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    return `local-media:${id}`;
  } finally { db.close(); }
}
export async function loadMedia(source: string): Promise<Blob | undefined> {
  const db = await openMediaDB();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction('files').objectStore('files').get(source.slice('local-media:'.length));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally { db.close(); }
}
export async function removeMedia(source: string): Promise<void> {
  const upload = /^\/media\/uploads\/([a-f\d-]{36})$/i.exec(source);
  if (upload && hasServerStorage) {
    await requestStorage(`media/${upload[1]}`, { method: 'DELETE' }, true);
    return;
  }
  if (!source.startsWith('local-media:')) return;
  const db = await openMediaDB();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('files', 'readwrite');
      transaction.objectStore('files').delete(source.slice('local-media:'.length));
      transaction.oncomplete = () => resolve();
      transaction.onabort = () => reject(transaction.error);
    });
  } finally { db.close(); }
}
