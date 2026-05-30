import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export type Toast = { id: number; message: string; type: 'error' | 'success' | 'info' }

type ToastCtx = {
  toasts: Toast[]
  addToast: (message: string, type?: Toast['type']) => void
}

const Ctx = createContext<ToastCtx>({ toasts: [], addToast: () => {} })

let _nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = _nextId++
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000)
  }, [])

  return <Ctx.Provider value={{ toasts, addToast }}>{children}</Ctx.Provider>
}

export function useToast() {
  return useContext(Ctx)
}

// Global helper — requires ToastProvider in tree
let _globalAddToast: ((msg: string, type?: Toast['type']) => void) | null = null
export function registerGlobalToast(fn: typeof _globalAddToast) { _globalAddToast = fn }

export function toast(message: string, type: Toast['type'] = 'info') {
  _globalAddToast?.(message, type)
}
