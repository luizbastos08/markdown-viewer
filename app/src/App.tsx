import React, { useState, useEffect, useCallback, useRef } from 'react'
import { open } from '@tauri-apps/plugin-dialog'
import { readTextFile } from '@tauri-apps/plugin-fs'
import { listen } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { renderMarkdown } from './lib/wasm-loader'
import './App.css'

interface TocItem {
  id: string
  level: number
  text: string
}

interface DragDropPayload {
  paths: string[]
  position: { x: number; y: number }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function App() {
  const [markdown, setMarkdown] = useState('')
  const [html, setHtml] = useState('')
  const [isWasmReady, setIsWasmReady] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [hasFile, setHasFile] = useState(false)
  const [filename, setFilename] = useState('')
  const [readProgress, setReadProgress] = useState(0)
  const [toc, setToc] = useState<TocItem[]>([])
  const [showToc, setShowToc] = useState(true)
  const [activeTocId, setActiveTocId] = useState('')
  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    renderMarkdown('')
      .then(() => setIsWasmReady(true))
      .catch(console.error)
  }, [])

  // Show window once UI is ready — or after 3s fallback if WASM never loads
  useEffect(() => {
    if (isWasmReady) {
      const timer = setTimeout(() => {
        getCurrentWindow().show().catch(console.error)
      }, 50)
      return () => clearTimeout(timer)
    }
    const fallback = setTimeout(() => {
      getCurrentWindow().show().catch(console.error)
    }, 3000)
    return () => clearTimeout(fallback)
  }, [isWasmReady])

  useEffect(() => {
    if (!isWasmReady) return
    renderMarkdown(markdown).then(setHtml).catch(console.error)
  }, [markdown, isWasmReady])

  // Build TOC and inject IDs into headings after HTML renders
  useEffect(() => {
    const el = previewRef.current
    if (!el) return

    const headings = el.querySelectorAll('h1, h2, h3')
    const items: TocItem[] = []
    const usedIds = new Map<string, number>()

    headings.forEach((heading) => {
      const text = heading.textContent ?? ''
      const base = slugify(text)
      const count = usedIds.get(base) ?? 0
      const id = count === 0 ? base : `${base}-${count}`
      usedIds.set(base, count + 1)
      heading.id = id
      items.push({ id, level: parseInt(heading.tagName[1]), text })
    })

    setToc(items)
    if (items.length > 0) setActiveTocId(items[0].id)
  }, [html])

  // Reading progress + active TOC heading on scroll
  useEffect(() => {
    const el = previewRef.current
    if (!el) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el
      const max = scrollHeight - clientHeight
      setReadProgress(max > 0 ? (scrollTop / max) * 100 : 0)

      const containerTop = el.getBoundingClientRect().top
      let active = ''
      el.querySelectorAll('h1[id], h2[id], h3[id]').forEach((heading) => {
        if (heading.getBoundingClientRect().top - containerTop <= 8) {
          active = heading.id
        }
      })
      if (active) setActiveTocId(active)
    }

    el.addEventListener('scroll', handleScroll)
    return () => el.removeEventListener('scroll', handleScroll)
  }, [html])

  // Native Tauri drag-and-drop listeners
  useEffect(() => {
    let unlistenEnter: (() => void) | null = null
    let unlistenLeave: (() => void) | null = null
    let unlistenDrop: (() => void) | null = null

    const setup = async () => {
      try {
        unlistenEnter = await listen('tauri://drag-enter', () => {
          setIsDragOver(true)
        })
        unlistenLeave = await listen('tauri://drag-leave', () => {
          setIsDragOver(false)
        })
        unlistenDrop = await listen<DragDropPayload>('tauri://drag-drop', async (event) => {
          setIsDragOver(false)
          const { paths } = event.payload
          if (paths && paths.length > 0) {
            const filePath = paths[0]
            if (filePath.toLowerCase().endsWith('.md')) {
              try {
                const content = await readTextFile(filePath)
                const name = filePath.split(/[\\/]/).pop() || 'arquivo.md'
                setMarkdown(content)
                setFilename(name)
                setHasFile(true)
              } catch (error) {
                console.error('Erro ao ler arquivo:', error)
              }
            }
          }
        })
      } catch (e) {
        console.error('Drag listeners unavailable (not in Tauri context):', e)
      }
    }

    setup()
    return () => {
      unlistenEnter?.()
      unlistenLeave?.()
      unlistenDrop?.()
    }
  }, [])

  const loadFile = useCallback((content: string, name: string) => {
    setMarkdown(content)
    setFilename(name)
    setHasFile(true)
    setIsDragOver(false)
  }, [])

  const handleSelectFile = useCallback(async () => {
    try {
      const selectedPath = await open({
        multiple: false,
        directory: false,
        filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }],
      })

      if (selectedPath) {
        const content = await readTextFile(selectedPath)
        const name = selectedPath.split(/[\\/]/).pop() || 'arquivo.md'
        loadFile(content, name)
      }
    } catch (error) {
      console.error('Erro ao abrir arquivo:', error)
    }
  }, [loadFile])

  const handleBack = useCallback(() => {
    setMarkdown('')
    setHtml('')
    setFilename('')
    setHasFile(false)
    setToc([])
    setReadProgress(0)
    setActiveTocId('')
  }, [])

  if (!isWasmReady) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Carregando motor Rust/WASM...</p>
      </div>
    )
  }

  // Tela Inicial
  if (!hasFile) {
    return (
      <div className="welcome-screen">
        <div className="welcome-content">
          <div className="welcome-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <line x1="10" y1="9" x2="8" y2="9" />
            </svg>
          </div>
          <h1>Markdown Viewer</h1>
          <p className="welcome-subtitle">Visualize seus arquivos Markdown com estilo</p>

          <div className={`drop-zone ${isDragOver ? 'drag-active' : ''}`}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p className="drop-text">Arraste um arquivo .md aqui</p>
            <p className="drop-or">ou</p>
            <button className="btn btn-primary btn-large" onClick={handleSelectFile}>
              Selecionar arquivo
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Tela de Visualizacao
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left">
          <button className="btn btn-back" onClick={handleBack}>← Voltar</button>
          <h1>Markdown Viewer</h1>
          {filename && <span className="filename-badge">{filename}</span>}
        </div>
        <div className="header-actions">
          {toc.length >= 2 && (
            <button className="btn btn-secondary" onClick={() => setShowToc((v) => !v)}>
              {showToc ? 'Ocultar índice' : 'Mostrar índice'}
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => window.print()}>
            Exportar PDF
          </button>
          <button className="btn btn-secondary" onClick={handleSelectFile}>
            Abrir arquivo
          </button>
        </div>
      </header>

      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${readProgress}%` }} />
      </div>

      <main className="editor-container">
        {toc.length >= 2 && showToc && (
          <aside className="toc-panel">
            <p className="toc-title">Índice</p>
            <nav>
              {toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={`toc-link toc-level-${item.level}${activeTocId === item.id ? ' toc-active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault()
                    previewRef.current
                      ?.querySelector(`#${item.id}`)
                      ?.scrollIntoView({ behavior: 'smooth' })
                    setActiveTocId(item.id)
                  }}
                >
                  {item.text}
                </a>
              ))}
            </nav>
          </aside>
        )}

        <div
          ref={previewRef}
          className="markdown-preview"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </main>
    </div>
  )
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div className="loading-container">
          <p style={{ color: '#ef4444' }}>Erro inesperado:</p>
          <pre style={{ fontSize: '12px', maxWidth: '100%', overflow: 'auto' }}>
            {this.state.error.message}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

export default function Root() {
  return <ErrorBoundary><App /></ErrorBoundary>
}
