// WASM module loader - the module is served from /public/wasm at runtime
// We use new Function() to bypass Vite's import analysis, which blocks
// imports from /public during dev. This is safe because the URL is static.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let wasmModule: any = null;

export async function initWasm() {
  if (wasmModule) return wasmModule;

  try {
    const wasmPath = import.meta.env.DEV
      ? '/wasm/rust_md_viewer.js'
      : '../wasm/rust_md_viewer.js';
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Dynamic import via new Function to avoid Vite interception
    const module = await new Function(`return import("${wasmPath}")`)();
    await module.default();
    wasmModule = module;
    return module;
  } catch (error) {
    console.error('Failed to load WASM module:', error);
    throw error;
  }
}

export async function renderMarkdown(input: string): Promise<string> {
  const module = await initWasm();
  return module.render_markdown(input);
}
