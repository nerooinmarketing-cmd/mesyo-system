import { ReactNode, useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useModules } from '@/contexts/ModuleContext'
import { PaymentAlert } from '@/components/admin/PaymentAlert'
import { cn } from '@/lib/utils'
import { institutionSettingsApi } from '@/lib/api'
import {
  LayoutDashboard, ClipboardList, School, Users, CheckSquare,
  Map, Settings, LogOut, KeyRound, Menu, X, ChevronUp,
  Archive, BookOpen, Calendar, ChevronRight, Star
} from 'lucide-react'

const ICON_MAP: Record<string, any> = {
  '/admin/students': Users,
  '/admin/registrations': ClipboardList,
  '/admin/classrooms': School,
  '/admin/teachers': Users,
  '/admin/attendance': CheckSquare,
  '/admin/assignments': BookOpen,
  '/admin/performance': Star,
  '/admin/calendar': Calendar,
  '/admin/notifications': CheckSquare,
  '/admin/announcements': ClipboardList,
  '/admin/qr-register': School,
  '/admin/progress': Star,
  '/admin/accounting': BookOpen,
  '/admin/assets': BookOpen,
  '/admin/game': Star,
  '/admin/sohbetler': Users,
  '/admin/game-guide': BookOpen,
  '/admin/address': Map,
  '/admin/seasons': Archive,
  '/admin/settings': Settings,
}

const adminTools = [
  { to:'/admin/address', icon:Map, label:'Mahalle Yönetimi', moduleId:'address_mgmt' },
  { to:'/admin/seasons', icon:Archive, label:'Sezonlar', moduleId:'seasons' },
  { to:'/admin/requests', icon:Settings, label:'İstekler & Destek' },
  { to:'/admin/settings', icon:Settings, label:'Ayarlar' },
]

interface AdminLayoutProps { children: ReactNode; pendingCount?: number }

export function AdminLayout({ children, pendingCount = 0 }: AdminLayoutProps) {
  const { user, logout } = useAuth()
  const { activeNavItems, isActive } = useModules()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [paymentInfo, setPaymentInfo] = useState<any>(null)
  const [loadingPayment, setLoadingPayment] = useState(false)

  // Ödeme durumu
  const [paymentDue, setPaymentDue] = useState<string | null>(null)
  const [showPaymentAlert, setShowPaymentAlert] = useState(false)

  useEffect(() => {
    institutionSettingsApi.getPaymentStatus().then(data => {
      const today = new Date()
      const status = data.subscription_status
      if (status === 'expired') {
        setPaymentDue(data.subscription_expires_at || new Date().toISOString().split('T')[0])
        setShowPaymentAlert(true)
        return
      }
      if (status === 'trial' && data.trial_ends_at) {
        const daysLeft = Math.ceil((new Date(data.trial_ends_at).getTime() - today.getTime()) / 86400000)
        if (daysLeft <= 14) { setPaymentDue(data.trial_ends_at); setShowPaymentAlert(true) }
        return
      }
      if (status === 'active' && data.subscription_expires_at) {
        const daysLeft = Math.ceil((new Date(data.subscription_expires_at).getTime() - today.getTime()) / 86400000)
        if (daysLeft <= 40) { setPaymentDue(data.subscription_expires_at); setShowPaymentAlert(true) }
      }
    }).catch(() => {})
  }, [])

  const goTo = (path: string) => { navigate(path); setUserMenuOpen(false); setSidebarOpen(false) }

  // Dashboard her zaman var
  const dashItem = { to:'/admin/dashboard', icon:LayoutDashboard, label:'Genel Bakış', badge:false, moduleId:undefined }

  // Sabit öncelikli sayfalar — her zaman bu sırada üstte görünür
  const priorityRoutes = [
    '/admin/students',
    '/admin/registrations',
    '/admin/seasons',
    '/admin/classrooms',
    '/admin/teachers',
    '/admin/assignments',
    '/admin/attendance',
    '/admin/calendar',
    '/admin/game',
    '/admin/sohbetler',
    '/admin/notifications',
    '/admin/announcements',
    '/admin/assets',
    '/admin/accounting',
  ]

  // Dinamik modüllerden öncelikli olanları sıralı al
  const priorityItems = priorityRoutes.map(route => {
    const mod = activeNavItems.find(m => m.route === route)
    if (mod) return {
      to: route,
      icon: ICON_MAP[route] || LayoutDashboard,
      label: mod.name.replace(' Yönetimi','').replace(' Takibi',''),
      badge: mod.id === 'registrations',
      moduleId: mod.id,
    }
    // Modül aktif değilse bile Sınıflar, Öğretmenler, Sezonlar her zaman göster
    if (['/admin/classrooms','/admin/teachers','/admin/seasons'].includes(route)) return {
      to: route,
      icon: ICON_MAP[route] || LayoutDashboard,
      label: route === '/admin/classrooms' ? 'Sınıflar' : route === '/admin/teachers' ? 'Öğretmenler' : 'Sezonlar',
      badge: false,
      moduleId: undefined,
    }
    return null
  }).filter(Boolean) as any[]

  // Geri kalan dinamik modüller (öncelikli listede olmayanlar)
  const otherItems = activeNavItems
    .filter(m => m.route && !priorityRoutes.includes(m.route || ''))
    .map(m => ({
      to: m.route || '',
      icon: ICON_MAP[m.route || ''] || LayoutDashboard,
      label: m.name.replace(' Yönetimi','').replace(' Takibi',''),
      badge: false,
      moduleId: m.id,
    })).filter(i => i.to)

  const navItems = [dashItem, ...priorityItems, ...otherItems]

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={cn(
        'fixed lg:static inset-y-0 left-0 z-50 w-60 flex flex-col transition-transform duration-300 lg:translate-x-0 bg-[#1B4332]',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 flex-shrink-0">
          <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center text-lg flex-shrink-0">📚</div>
          <div>
            <div className="text-white font-bold text-lg tracking-widest">Mesyo Soft</div>
            <div className="text-white/40 text-[10px] truncate max-w-[100px]">{user?.institution_name || 'Eğitim Yönetimi'}</div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto text-white/40 hover:text-white lg:hidden"><X size={18} /></button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          <div className="px-5 py-2 text-[10px] font-bold text-white/30 uppercase tracking-widest">Menü</div>
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-5 py-2.5 text-sm transition-all border-l-[3px] border-transparent',
                isActive ? 'bg-white/10 text-white border-l-green-500 font-semibold' : 'text-white/70 hover:bg-white/7 hover:text-white'
              )}>
              <item.icon size={17} className="flex-shrink-0" />
              <span>{item.label}</span>
              {item.badge && pendingCount > 0 && (
                <span className="ml-auto bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pendingCount}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-white/10 flex-shrink-0 relative">
          {userMenuOpen && (
            <div className="absolute bottom-16 left-3 right-3 bg-white rounded-xl shadow-xl overflow-hidden z-10"
              style={{ animation: 'slideUp .15s ease' }}>
              <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                Yönetici Araçları
              </div>
              {adminTools.map(item => (
                (!item.moduleId || isActive(item.moduleId)) && (
                  <button key={item.to} onClick={() => goTo(item.to)}
                    className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors">
                    <item.icon size={16} className="text-gray-400 flex-shrink-0" />
                    <span>{item.label}</span>
                    <ChevronRight size={14} className="ml-auto text-gray-300" />
                  </button>
                )
              ))}
              <div className="h-px bg-gray-100" />
              <button onClick={() => goTo('/admin/settings')}
                className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <KeyRound size={16} className="text-gray-400" /><span>Şifre Değiştir</span>
              </button>
              <div className="h-px bg-gray-100" />
              <button onClick={() => setShowUpgrade(true)}
                className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-green-600 hover:bg-green-50 transition-colors font-semibold">
                <span>💳</span><span>Üyeliği Yükselt / Yenile</span>
              </button>
              <div className="h-px bg-gray-100" />
              <button onClick={() => { logout(); window.location.href = '/login' }}
                className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors">
                <LogOut size={16} /><span>Çıkış Yap</span>
              </button>
            </div>
          )}
          <button onClick={() => setUserMenuOpen(o => !o)}
            className="flex items-center gap-2.5 w-full px-2 py-2 rounded-lg hover:bg-white/7 transition-colors">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {(user?.full_name || 'Y').charAt(0)}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-white text-xs font-semibold truncate">{user?.full_name}</div>
              <div className="text-white/40 text-[10px]">Kurum Yöneticisi</div>
            </div>
            <ChevronUp size={12} className={cn('text-white/40 transition-transform', userMenuOpen ? '' : 'rotate-180')} />
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-4 flex-shrink-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500 hover:text-gray-700"><Menu size={22} /></button>
          <div className="flex-1" />
          {isActive('registrations') && (
            <NavLink to="/admin/registrations" className="relative">
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                📋 Başvurular
                {pendingCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </button>
            </NavLink>
          )}
        </header>

        {showPaymentAlert && paymentDue && (
          <PaymentAlert dueDate={paymentDue} />
        )}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>

        <nav className="lg:hidden flex bg-white border-t border-gray-200 flex-shrink-0">
          {navItems.slice(0, 5).map(item => (
            <NavLink key={item.to} to={item.to}
              className={({ isActive }) => cn(
                'flex-1 flex flex-col items-center py-2 gap-0.5 text-[10px] font-semibold transition-colors',
                isActive ? 'text-green-500' : 'text-gray-400'
              )}>
              <item.icon size={20} />
              <span>{item.label.split(' ')[0]}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Üyeliği Yükselt Modal */}
      {showUpgrade && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowUpgrade(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="text-4xl mb-2">💳</div>
              <h2 className="text-lg font-bold text-gray-900">Üyelik Yenileme / Yükseltme</h2>
              <p className="text-xs text-gray-400 mt-1">Aşağıdaki banka hesabına ödeme yapın</p>
            </div>
            {!paymentInfo ? (
              <div className="text-center py-4">
                <button onClick={async () => {
                  setLoadingPayment(true)
                  try {
                    const data = await fetch('/api/superadmin/settings/public').then(r => r.json())
                    setPaymentInfo(data)
                  } catch {}
                  setLoadingPayment(false)
                }} className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-bold">
                  {loadingPayment ? '⏳ Yükleniyor...' : 'Ödeme Bilgilerini Göster'}
                </button>
              </div>
            ) : (
              <div className="space-y-3 mb-5">
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <div className="text-xs font-bold text-green-700 uppercase mb-3">Banka Bilgileri</div>
                  {[
                    ['Banka', paymentInfo.payment_bank],
                    ['Hesap Sahibi', paymentInfo.payment_name],
                    ['IBAN', paymentInfo.payment_iban],
                    ['Tutar', `₺${paymentInfo.payment_amount} + KDV`],
                    ['Açıklama', paymentInfo.payment_note],
                  ].map(([l, v]) => (
                    <div key={l} className="flex items-start gap-3 py-2 border-b border-green-100 last:border-0">
                      <span className="text-xs font-semibold text-green-600 w-28 flex-shrink-0">{l}</span>
                      <span className="text-sm text-gray-800 font-mono break-all">{v}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-700 border border-amber-100">
                  ⚠️ Ödeme sonrası dekontunuzu WhatsApp veya e-posta ile iletiniz. Üyeliğiniz 1 iş günü içinde aktive edilir.
                </div>
              </div>
            )}
            <button onClick={() => setShowUpgrade(false)}
              className="w-full py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl text-sm">
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
