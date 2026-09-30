import { db, getDeviceId } from '../db/db';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const MAX_RETRIES = 5;
const REQUEST_TIMEOUT_MS = 8000;

export async function enqueue({ entityType, entityId, operation = 'UPSERT', payload }) {
  const deviceId = await getDeviceId();
  const existing = await db.syncQueue
    .where('entityType').equals(entityType)
    .filter((item) => item.entityId === entityId && item.status !== 'SYNCED')
    .first();

  const item = {
    id: existing?.id || crypto.randomUUID(),
    deviceId,
    entityType,
    entityId,
    operation,
    payload,
    status: 'PENDING',
    createdAt: existing?.createdAt || Date.now(),
    retryCount: existing?.retryCount || 0,
    nextRetryAt: 0,
  };
  await db.syncQueue.put(item);
  return item;
}

async function syncItem(item) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${API}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Sync failed with HTTP ${response.status}`);
    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function retryDelay(retryCount) {
  return Math.min(60_000, 1_000 * (2 ** Math.max(0, retryCount - 1)));
}

export async function syncNow() {
  if (!navigator.onLine) return { synced: 0, failed: 0, offline: true };
  const now = Date.now();
  const items = await db.syncQueue.where('status').anyOf(['PENDING', 'FAILED']).toArray();
  let synced = 0;
  let failed = 0;

  for (const item of items.sort((a, b) => a.createdAt - b.createdAt)) {
    if ((item.retryCount || 0) >= MAX_RETRIES) { failed += 1; continue; }
    if ((item.nextRetryAt || 0) > now) continue;

    try {
      await db.syncQueue.update(item.id, { status: 'SYNCING', lastAttemptAt: now, error: null });
      await syncItem(item);
      await db.syncQueue.update(item.id, { status: 'SYNCED', syncedAt: Date.now(), error: null, nextRetryAt: 0 });
      synced += 1;
    } catch (error) {
      const retryCount = (item.retryCount || 0) + 1;
      await db.syncQueue.update(item.id, {
        status: 'FAILED',
        retryCount,
        error: error.name === 'AbortError' ? 'Synchronization request timed out.' : error.message,
        lastAttemptAt: Date.now(),
        nextRetryAt: Date.now() + retryDelay(retryCount),
      });
      failed += 1;
    }
  }
  return { synced, failed, offline: false };
}