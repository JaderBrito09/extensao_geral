/**
 * src/storage/storageLock.js
 * Gerenciador de Travas (Mutex) para Operações no Storage Local
 * Previne condições de corrida em leituras e escritas concorrentes no chrome.storage.local
 */

export class StorageLockManager {
  constructor() {
    this._locks = new Map();
  }

  async withLock(key, fn) {
    if (!this._locks.has(key)) {
      this._locks.set(key, Promise.resolve());
    }

    const previousLock = this._locks.get(key);
    let resolveNext;
    const nextLock = new Promise((resolve) => {
      resolveNext = resolve;
    });

    this._locks.set(key, previousLock.then(() => nextLock, () => nextLock));

    try {
      await previousLock;
      return await fn();
    } finally {
      resolveNext();
    }
  }

  async updateKey(key, defaultValue, updaterFn) {
    return this.withLock(key, async () => {
      if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
        return defaultValue;
      }
      const data = await chrome.storage.local.get(key);
      const currentValue = (data && data[key] !== undefined) ? data[key] : defaultValue;
      const updatedValue = await updaterFn(currentValue);
      if (updatedValue !== undefined) {
        await chrome.storage.local.set({ [key]: updatedValue });
      }
      return updatedValue;
    });
  }
}

export const storageLock = new StorageLockManager();
