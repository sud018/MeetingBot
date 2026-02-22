// Server-side shim for libraries that assume localStorage exists.
// This avoids runtime crashes during SSR in dev.
if (typeof globalThis !== "undefined") {
  const ls = (globalThis as unknown as { localStorage?: any }).localStorage
  if (!ls || typeof ls.getItem !== "function") {
    const store = new Map<string, string>()
    ;(globalThis as unknown as { localStorage: Storage }).localStorage = {
      getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
      setItem: (key: string, value: string) => {
        store.set(key, String(value))
      },
      removeItem: (key: string) => {
        store.delete(key)
      },
      clear: () => {
        store.clear()
      },
      key: (index: number) => Array.from(store.keys())[index] ?? null,
      get length() {
        return store.size
      },
    } as Storage
  }
}
