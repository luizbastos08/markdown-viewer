/// <reference types="vite/client" />

declare module '/wasm/rust_md_viewer.js' {
  export function render_markdown(input: string): string;
  export default function(): Promise<void>;
}

declare module '*rust_md_viewer.js' {
  export function render_markdown(input: string): string;
  export default function(): Promise<void>;
}
