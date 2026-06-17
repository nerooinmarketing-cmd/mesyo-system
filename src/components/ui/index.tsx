import { ReactNode, ButtonHTMLAttributes, useState, useEffect, createContext, useContext, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

// ── BUTTON ────────────────────────────────────────
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'danger' | 'wa' | 'amber'
  size?: 'xs' | 'sm' | 'md'
  loading?: boolean
  children: ReactNode
}

export function Button({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }: ButtonProps) {
  const base = 'inline-flex items-center gap-1.5 font-semibold rounded-lg transition-all duration-150 cursor-pointer border-0 font-sans whitespace-nowrap'
  const variants = {
    primary: 'bg-green-500 hover:bg-green-600 text-white',
    outline: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    wa: 'bg-[#25D366] hover:bg-[#128C7E] text-white',
    amber: 'bg-amber-500 hover:bg-amber-600 text-white',
  }
  const sizes = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
  }
  return (
    <button
      className={cn(base, variants[variant], sizes[size], (disabled || loading) && 'opacity-50 cursor-not-allowed', className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className="animate-spin">⏳</span> : children}
    </button>
  )
}

// ── BADGE ─────────────────────────────────────────
interface BadgeProps { variant?: 'green' | 'red' | 'amber' | 'blue' | 'gray'; children: ReactNode; className?: string }

export function Badge({ variant = 'gray', children, className }: BadgeProps) {
  const variants = {
    green: 'bg-green-100 text-green-900',
    red: 'bg-red-100 text-red-600',
    amber: 'bg-amber-100 text-amber-800',
    blue: 'bg-blue-100 text-blue-700',
    gray: 'bg-gray-100 text-gray-600',
  }
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold', variants[variant], className)}>
      {children}
    </span>
  )
}

// ── CARD ──────────────────────────────────────────
interface CardProps { children: ReactNode; className?: string }
export function Card({ children, className }: CardProps) {
  return <div className={cn('bg-white rounded-xl shadow-sm overflow-hidden', className)}>{children}</div>
}
export function CardHeader({ children, className }: CardProps) {
  return <div className={cn('px-4 py-3 border-b border-gray-100 flex items-center justify-between', className)}>{children}</div>
}
export function CardTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-sm font-bold text-gray-900">{children}</h3>
}
export function CardBody({ children, className }: CardProps) {
  return <div className={cn('p-4', className)}>{children}</div>
}

// ── MODAL ─────────────────────────────────────────
interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}
export function Modal({ open, onClose, title, children, footer, wide }: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className={cn('bg-white rounded-2xl w-full shadow-xl max-h-[90vh] flex flex-col', wide ? 'max-w-2xl' : 'max-w-lg')}
        onClick={e => e.stopPropagation()}
        style={{ animation: 'slideUp .2s ease' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
            <X size={14} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-4">{children}</div>
        {footer && <div className="flex gap-2 justify-end px-5 py-3 border-t border-gray-100 flex-shrink-0">{footer}</div>}
      </div>
    </div>
  )
}

// ── FORM ──────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { label?: string; error?: string }
export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className={label ? 'mb-3' : ''}>
      {label && <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">{label}</label>}
      <input className={cn('w-full px-3 py-2 border-[1.5px] border-gray-200 rounded-lg text-sm text-gray-900 bg-white outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500/10', error && 'border-red-400', className)} {...props} />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> { label?: string; children: ReactNode }
export function Select({ label, children, className, ...props }: SelectProps) {
  return (
    <div className={label ? 'mb-3' : ''}>
      {label && <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">{label}</label>}
      <select className={cn('w-full px-3 py-2 border-[1.5px] border-gray-200 rounded-lg text-sm text-gray-900 bg-white outline-none transition-all focus:border-green-500', className)} {...props}>
        {children}
      </select>
    </div>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { label?: string }
export function Textarea({ label, className, ...props }: TextareaProps) {
  return (
    <div className={label ? 'mb-3' : ''}>
      {label && <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">{label}</label>}
      <textarea className={cn('w-full px-3 py-2 border-[1.5px] border-gray-200 rounded-lg text-sm text-gray-900 bg-white outline-none transition-all focus:border-green-500 resize-y min-h-[70px]', className)} {...props} />
    </div>
  )
}

// ── ALERT ─────────────────────────────────────────
interface AlertProps { variant?: 'info' | 'warn' | 'success'; children: ReactNode }
export function Alert({ variant = 'info', children }: AlertProps) {
  const v = { info: 'bg-blue-50 text-blue-700', warn: 'bg-amber-50 text-amber-800', success: 'bg-green-pale text-green-dark border border-green-200' }
  return <div className={cn('px-3 py-2.5 rounded-lg text-sm flex gap-2 mb-3', v[variant])}>{children}</div>
}

// ── EMPTY STATE ───────────────────────────────────
export function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <div className="text-center py-10 text-gray-400">
      <div className="text-4xl mb-2">{icon}</div>
      <h3 className="text-sm font-semibold text-gray-500 mb-1">{title}</h3>
      {subtitle && <p className="text-xs">{subtitle}</p>}
    </div>
  )
}

// ── TOAST ─────────────────────────────────────────
interface ToastItem { id: number; message: string; type: 'success' | 'error' | 'info' }
interface ToastContextType { toast: (msg: string, type?: ToastItem['type']) => void }
const ToastContext = createContext<ToastContextType>({ toast: () => {} })

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const toast = useCallback((message: string, type: ToastItem['type'] = 'info') => {
    const id = Date.now()
    setToasts(p => [...p, { id, message, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000)
  }, [])
  const colors = { success: 'bg-green-500', error: 'bg-red-500', info: 'bg-gray-900' }
  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-5 right-4 left-4 z-[999] flex flex-col gap-2 pointer-events-none items-center">
        {toasts.map(t => (
          <div key={t.id} className={cn('px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-lg max-w-xs w-full text-center', colors[t.type])} style={{ animation: 'slideUp .2s ease' }}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
export const useToast = () => useContext(ToastContext)

// ── PROGRESS BAR ──────────────────────────────────
export function ProgressBar({ value, max, className }: { value: number; max: number; className?: string }) {
  const pct = Math.min(Math.round((value / max) * 100), 100)
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-green-500'
  return (
    <div className={cn('h-1.5 bg-gray-100 rounded-full overflow-hidden', className)}>
      <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${pct}%` }} />
    </div>
  )
}

// ── AVATAR ────────────────────────────────────────
export function Avatar({ name, gender, size = 'md', className }: { name: string; gender?: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-base', lg: 'w-12 h-12 text-lg' }
  const colors = gender === 'erkek' ? 'bg-blue-100 text-blue-700' : gender === 'kiz' ? 'bg-pink-100 text-pink-700' : 'bg-green-500 text-white'
  return (
    <div className={cn('rounded-full flex items-center justify-center font-bold flex-shrink-0', sizes[size], colors, className)}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

// ── ACCORDION ─────────────────────────────────────
interface AccordionProps {
  header: ReactNode
  children: ReactNode
  leftBorder?: string
  defaultOpen?: boolean
}
export function Accordion({ header, children, leftBorder, defaultOpen = false }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={cn('bg-white rounded-xl shadow-sm overflow-hidden mb-2', leftBorder && `border-l-[3px]`)} style={leftBorder ? { borderLeftColor: leftBorder } : {}}>
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors select-none" onClick={() => setOpen(o => !o)}>
        {header}
        <span className="text-gray-400 text-xs flex-shrink-0 ml-auto">{open ? '▲' : '▼'}</span>
      </div>
      {open && <div className="border-t border-gray-100 px-4 pb-3 pt-2 acc-body-enter">{children}</div>}
    </div>
  )
}
