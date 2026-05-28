type Listener = () => void;

const listeners = new Set<Listener>();

export function onCalendarSyncRequest(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function requestCalendarSync(): void {
  listeners.forEach((fn) => fn());
}
