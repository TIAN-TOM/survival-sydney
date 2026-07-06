/// <reference types="vite/client" />

// Build-time variables read via `import.meta.env` (see src/config/brand.ts and src/api/api.ts).
interface ImportMetaEnv {
  /** White-label product name; falls back to 'OpenAssess'. */
  readonly VITE_APP_NAME?: string;
  /** Backend API base URL; falls back to http://localhost:5001/api. */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
