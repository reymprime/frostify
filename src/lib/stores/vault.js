import { writable } from 'svelte/store'

// ── Frostify Vault (IndexedDB) ──────────────────────────────
// Para sa SARILING audio files ng user (mp3, m4a, etc.)
// Naka-store as blobs — playable kahit offline.

const DB_NAME = 'frostify-vault'
const STORE = 'tracks'

export const vaultTracks = writable([])

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: 'id' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function refreshVault() {
  try {
    const db = await openDB()
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).getAll()
    req.onsuccess = () => {
      // Metadata lang ilalabas — hindi blobs — para magaan
      vaultTracks.set(
        req.result
          .map(({ id, title, artist, addedAt }) => ({ vaultId: id, title, artist, addedAt }))
          .sort((a, b) => b.addedAt - a.addedAt)
      )
    }
  } catch (e) {
    console.error('Vault error:', e)
  }
}

export async function addFilesToVault(fileList) {
  const db = await openDB()
  const tx = db.transaction(STORE, 'readwrite')
  const store = tx.objectStore(STORE)
  for (const file of fileList) {
    store.put({
      id: crypto.randomUUID(),
      title: file.name.replace(/\.[^.]+$/, ''),
      artist: 'Vault • Local file',
      addedAt: Date.now(),
      blob: file,
    })
  }
  await new Promise((res, rej) => {
    tx.oncomplete = res
    tx.onerror = () => rej(tx.error)
  })
  await refreshVault()
}

export async function getVaultBlob(vaultId) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(vaultId)
    req.onsuccess = () => resolve(req.result?.blob ?? null)
    req.onerror = () => reject(req.error)
  })
}

export async function deleteFromVault(vaultId) {
  const db = await openDB()
  const tx = db.transaction(STORE, 'readwrite')
  tx.objectStore(STORE).delete(vaultId)
  await new Promise((res) => (tx.oncomplete = res))
  await refreshVault()
}
