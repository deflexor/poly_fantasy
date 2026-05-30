import { useToast } from '../lib/toast'

export default function ToastList() {
  const { toasts } = useToast()
  if (toasts.length === 0) return null

  const colors: Record<string, string> = {
    error: 'bg-red-900/80 border-red-700 text-red-200',
    success: 'bg-green-900/80 border-green-700 text-green-200',
    info: 'bg-gray-800/80 border-gray-600 text-gray-200',
  }

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-xl border text-sm shadow-lg backdrop-blur-sm transition animate-slide-in ${colors[t.type]}`}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
