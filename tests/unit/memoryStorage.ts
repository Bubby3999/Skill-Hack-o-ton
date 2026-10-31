// Minimal localStorage stand-in for node tests.
export class MemoryStorage {
  private m = new Map<string, string>();
  get length() { return this.m.size; }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  clear() { this.m.clear(); }
}
// Object.keys(storage) must list stored keys, like the real thing.
export function installStorage(): MemoryStorage {
  const s = new MemoryStorage();
  const proxy = new Proxy(s, {
    ownKeys: () => [...(s as unknown as { m: Map<string, string> }).m.keys()],
    getOwnPropertyDescriptor: (_t, p) => ({ enumerable: true, configurable: true, value: s.getItem(String(p)) }),
    get: (t, p, r) => (p in t ? Reflect.get(t, p, r) : undefined),
  });
  (globalThis as { localStorage?: unknown }).localStorage = proxy;
  return proxy;
}
