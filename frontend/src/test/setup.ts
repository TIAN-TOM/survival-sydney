import '@testing-library/jest-dom/vitest';

const storage = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => (storage.has(key) ? (storage.get(key) as string) : null),
  setItem: (key: string, value: unknown) => storage.set(key, String(value)),
  removeItem: (key: string) => storage.delete(key),
  clear: () => storage.clear(),
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  configurable: true,
});

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  configurable: true,
});
