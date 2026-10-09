// In-memory localStorage, or one that throws like Safari with blocked site data.
export function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
    clear: () => data.clear(),
  };
}

export function brokenStorage() {
  const fail = () => {
    throw new DOMException('The operation is insecure.', 'SecurityError');
  };
  return { getItem: fail, setItem: fail, removeItem: fail, clear: fail };
}
