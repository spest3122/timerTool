const DB_NAME = "MirrorVideoDB";
const STORE_NAME = "takes";
const DB_VERSION = 1;

let memoryFallback = [];
let nextFallbackId = 1;

function getIndexedDB() {
  if (typeof window !== "undefined" && window.indexedDB) {
    return window.indexedDB;
  }
  return null;
}

export function openMirrorDB() {
  return new Promise((resolve, reject) => {
    const idb = getIndexedDB();
    if (!idb) {
      resolve(null);
      return;
    }
    const request = idb.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

export async function saveTake({ blob, duration }) {
  const item = {
    blob,
    duration,
    timestamp: new Date().toISOString(),
  };

  const idb = getIndexedDB();
  if (!idb) {
    const saved = { ...item, id: nextFallbackId++ };
    memoryFallback.unshift(saved);
    return saved;
  }

  const db = await openMirrorDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.add(item);
    req.onsuccess = (e) => {
      resolve({ ...item, id: e.target.result });
    };
    req.onerror = (e) => reject(e.target.error);
  });
}

export async function loadAllTakes() {
  const idb = getIndexedDB();
  if (!idb) {
    return [...memoryFallback];
  }

  const db = await openMirrorDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = (e) => {
      const results = e.target.result || [];
      results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      resolve(results);
    };
    req.onerror = (e) => reject(e.target.error);
  });
}

export async function deleteTake(id) {
  const idb = getIndexedDB();
  if (!idb) {
    memoryFallback = memoryFallback.filter((t) => t.id !== id);
    return;
  }

  const db = await openMirrorDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = (e) => reject(e.target.error);
  });
}

export async function clearAllTakes() {
  const idb = getIndexedDB();
  if (!idb) {
    memoryFallback = [];
    return;
  }

  const db = await openMirrorDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_NAME], "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = (e) => reject(e.target.error);
  });
}

export function _resetMemoryFallback() {
  memoryFallback = [];
  nextFallbackId = 1;
}
