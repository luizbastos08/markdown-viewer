# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hybrid Rust + React/TypeScript markdown viewer. Rust handles markdown parsing via WebAssembly (compiled with `wasm-pack`); React provides the browser UI. All processing is client-side — no backend.

## Commands

All commands run from `app/`:

```bash
npm run dev       # Dev server at http://localhost:3000
npm run build     # TypeScript check + Vite production build
npm run lint      # ESLint
npm run preview   # Preview production build
```

**Rebuild WASM after any Rust changes:**
```bash
cd app/rust-md-viewer
wasm-pack build --target web --out-dir ../public/wasm
```

The compiled WASM artifacts are committed to `app/public/wasm/` — no WASM rebuild is needed for frontend-only work.

## Architecture

### Data flow
1. User pastes text or drops a `.md` file
2. `App.tsx` state update triggers `useEffect`
3. `wasm-loader.ts` calls `renderMarkdown()` (lazy-loaded WASM)
4. Rust parses markdown via `pulldown-cmark` → returns HTML string
5. React renders output via `dangerouslySetInnerHTML`

### Key files
- `app/src/App.tsx` — single main component; owns all state (`markdown`, `html`, `isWasmReady`, `filename`)
- `app/src/lib/wasm-loader.ts` — lazy-loads and caches the WASM module; exposes async `renderMarkdown()`
- `app/rust-md-viewer/src/lib.rs` — the entire Rust module (17 lines); exports `render_markdown(input: &str) -> String`

### Rust module
`lib.rs` enables these pulldown-cmark extensions: strikethrough, tables, footnotes, task lists, smart punctuation. Changing supported features means editing the `Options` flags there and rebuilding WASM.

### Frontend components
`src/components/ui/` contains 40+ pre-built shadcn/Radix UI primitives (mostly unused). Import from there before building new components.

Path alias `@/` maps to `src/`.

## Tech stack
- **Rust**: `wasm-bindgen` 0.2, `pulldown-cmark` 0.9
- **Frontend**: React 19, TypeScript 5.9, Vite 7, Tailwind CSS 3, shadcn UI
- **WASM toolchain**: `wasm-pack` 0.14 (dev dependency)
