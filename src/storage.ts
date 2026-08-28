import type { Attempt, Backup, Prompt } from './core';

const DB_NAME = 'context-cloze';
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('prompts')) db.createObjectStore('prompts', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('attempts')) db.createObjectStore('attempts', { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open local storage.'));
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Local storage request failed.'));
  });
}

export async function loadAll(): Promise<{ prompts: Prompt[]; attempts: Attempt[] }> {
  const db = await openDb();
  const tx = db.transaction(['prompts', 'attempts'], 'readonly');
  const [prompts, attempts] = await Promise.all([
    requestResult(tx.objectStore('prompts').getAll() as IDBRequest<Prompt[]>),
    requestResult(tx.objectStore('attempts').getAll() as IDBRequest<Attempt[]>)
  ]);
  db.close();
  return {
    prompts: prompts.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    attempts: attempts.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  };
}

export async function putPrompt(prompt: Prompt): Promise<void> {
  const db = await openDb();
  const tx = db.transaction('prompts', 'readwrite');
  tx.objectStore('prompts').put(prompt);
  await transactionDone(tx);
  db.close();
}

export async function deletePrompt(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(['prompts', 'attempts'], 'readwrite');
  tx.objectStore('prompts').delete(id);
  const attempts = await requestResult(tx.objectStore('attempts').getAll() as IDBRequest<Attempt[]>);
  for (const attempt of attempts) if (attempt.promptId === id) tx.objectStore('attempts').delete(attempt.id);
  await transactionDone(tx);
  db.close();
}

export async function putAttempt(attempt: Attempt): Promise<void> {
  const db = await openDb();
  const tx = db.transaction('attempts', 'readwrite');
  tx.objectStore('attempts').put(attempt);
  await transactionDone(tx);
  db.close();
}

export async function replaceBackup(backup: Backup): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(['prompts', 'attempts'], 'readwrite');
  const promptStore = tx.objectStore('prompts');
  const attemptStore = tx.objectStore('attempts');
  promptStore.clear();
  attemptStore.clear();
  backup.prompts.forEach((prompt) => promptStore.put(prompt));
  backup.attempts.forEach((attempt) => attemptStore.put(attempt));
  await transactionDone(tx);
  db.close();
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Could not save to this device.'));
    tx.onabort = () => reject(tx.error ?? new Error('The local save was cancelled.'));
  });
}
