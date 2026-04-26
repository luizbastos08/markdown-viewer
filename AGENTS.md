# AGENTS.md

Guidance for OpenCode sessions working in this repository.

## Project structure

Hybrid Rust + React/TypeScript markdown viewer. Rust parses markdown via `pulldown-cmark` and compiles to WebAssembly; React provides the UI. All processing is client-side.

- **`app/`** — entire application lives here; **all commands must run from this directory**
- `app/src/App.tsx` — single main component; owns all state
- `app/src/lib/wasm-loader.ts` — lazy-loads and caches the WASM module
- `app/rust-md-viewer/src/lib.rs` — entire Rust module (~17 lines)
- `app/src/components/ui/` — 40+ pre-built shadcn/Radix UI primitives (mostly unused)

## Commands

```bash
npm run dev       # Dev server at http://localhost:3000
npm run build     # tsc + Vite production build
npm run lint      # ESLint only
npm run preview   # Preview production build
```

**No test runner is configured.** There is no `npm test`.

## WASM rebuild

Required after any Rust change:

```bash
cd app/rust-md-viewer
wasm-pack build --target web --out-dir ../public/wasm
```

The compiled WASM artifacts in `app/public/wasm/` are committed to the repo. **Frontend-only changes do not need a WASM rebuild.**

## Architecture notes

- Data flow: user input → `App.tsx` state → `wasm-loader.ts` → Rust `render_markdown()` → HTML via `dangerouslySetInnerHTML`
- Path alias `@/` maps to `src/` (configured in `vite.config.ts` and `tsconfig.json`)
- `vite.config.ts` sets `base: './'` and externalizes `/wasm/rust_md_viewer.js`
- Rust enables these `pulldown-cmark` extensions: strikethrough, tables, footnotes, task lists, smart punctuation

## Tech stack

- **Rust**: `wasm-bindgen` 0.2, `pulldown-cmark` 0.9, `wasm-pack` 0.14
- **Frontend**: React 19, TypeScript 5.9, Vite 7, Tailwind CSS 3, shadcn UI
