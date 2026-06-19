import { ReactNode, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useModules } from '@/contexts/ModuleContext'
import { PaymentAlert } from '@/components/admin/PaymentAlert'
import { cn } from '@/lib/utils'
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

  const goTo = (path: string) => { navigate(path); setUserMenuOpen(false); setSidebarOpen(false) }

  // Dashboard her zaman var
  const dashItem = { to:'/admin/dashboard', icon:LayoutDashboard, label:'Genel Bakış', badge:false, moduleId:undefined }
  const coreItems = [
    { to:'/admin/seasons',    icon:Archive,   label:'Sezonlar', badge:false, moduleId:undefined },
    { to:'/admin/classrooms', icon:School,    label:'Sınıflar', badge:false, moduleId:undefined },
    { to:'/admin/teachers',   icon:Users,     label:'Öğretmenler', badge:false, moduleId:undefined },
  ]
  const navItems = [
    dashItem,
    ...activeNavItems.map(m => ({
      to: m.route || '',
      icon: ICON_MAP[m.route || ''] || LayoutDashboard,
      label: m.name.replace(' Yönetimi','').replace(' Takibi',''),
      badge: m.id === 'registrations',
      moduleId: m.id,
    })).filter(i => i.to && !coreItems.find(c => c.to === i.to)),
    ...coreItems,
  ]

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

        <PaymentAlert dueDate={new Date(new Date().getTime() + 7*24*60*60*1000).toISOString().split('T')[0]} />
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
    </div>
  )
}
