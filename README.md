# Markdown Viewer
A desktop Markdown viewer built with [Tauri](https://tauri.app/), React, TypeScript, and Rust-powered WebAssembly parsing. All Markdown processing happens client-side — no server required.
## Features
- **Client-side Markdown rendering** — powered by `pulldown-cmark` compiled to WebAssembly
- **Drag & drop** — drag `.md` files directly into the window
- **File picker** — browse and open markdown files
- **Table of Contents** — auto-generated from headings with scroll tracking
- **Reading progress** — visual progress bar
- **Export to PDF** — via browser print
- **Markdown extensions** — strikethrough, tables, footnotes, task lists, smart punctuation
## Tech Stack
| Layer | Technology |
|-------|-----------|
| Desktop shell | [Tauri 2](https://tauri.app/) |
| UI | React 19 + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Markdown parsing | Rust → WebAssembly (`pulldown-cmark`) |
| Build tool | Vite |
## Getting Started
### Prerequisites
- [Node.js](https://nodejs.org/) 18+
- [Rust](https://rustup.rs/)
- [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/)
### Install & Run
```bash
# Install frontend dependencies
cd app
npm install
# Build the WASM module (required on first run or after Rust changes)
cd rust-md-viewer
wasm-pack build --target web --out-dir ../public/wasm
cd ..
# Start the dev server
npm run dev
```
Open http://localhost:3000 in your browser, or run with Tauri:
```bash
# From the project root
npx tauri dev
```
## Project Structure
```
├── app/                    # React + TypeScript frontend
│   ├── src/
│   │   ├── App.tsx         # Main application component
│   │   ├── lib/
│   │   │   └── wasm-loader.ts  # WASM module loader
│   │   └── components/ui/  # shadcn/ui components
│   ├── public/wasm/        # Compiled WASM artifacts
│   ├── rust-md-viewer/     # Rust → WASM markdown parser
│   └── src-tauri/          # Tauri desktop configuration
├── src-tauri/              # Tauri CLI configuration
└── package.json            # Root (Tauri CLI)
```
## License
MIT