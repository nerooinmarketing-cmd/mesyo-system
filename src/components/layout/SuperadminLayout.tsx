import { ReactNode, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Building2, Users, Settings, LogOut, Menu, X, ChevronUp, Bell } from 'lucide-react'

const nav = [
  { to: '/superadmin',                  icon: LayoutDashboard, label: 'Genel Bakış',  exact: true,  badge: false },
  { to: '/superadmin/institutions',     icon: Building2,       label: 'Kurumlar',     exact: false, badge: false },
  { to: '/superadmin/applications',     icon: Settings,   label: 'Başvurular',   exact: false, badge: true },
  { to: '/superadmin/payments',         icon: Settings,      label: 'Ödemeler',     exact: false, badge: false },
  { to: '/superadmin/messages',         icon: Settings,   label: 'Mesaj Gönder', exact: false, badge: false },
  { to: '/superadmin/requests',         icon: Bell,            label: 'İstekler',     exact: false, badge: true },
  { to: '/superadmin/users',            icon: Users,           label: 'Kullanıcılar', exact: false, badge: false },
  { to: '/superadmin/settings',         icon: Settings,        label: 'Ayarlar',      exact: false, badge: false },
]

export function SuperadminLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0F172A' }}>
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={cn(
        'fixed lg:static inset-y-0 left-0 z-50 w-56 flex flex-col transition-transform duration-300 lg:translate-x-0',
        'bg-[#1E293B] border-r border-white/5',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-white/5 flex-shrink-0">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-base flex-shrink-0">📚</div>
          <div>
            <div className="text-white font-bold text-sm tracking-wide">Mesyo Soft</div>
            <div className="text-white/30 text-[9px] font-semibold uppercase tracking-widest">Superadmin</div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto text-white/30 hover:text-white lg:hidden"><X size={16} /></button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {nav.map(item => (
            <NavLink key={item.to} to={item.to} end={item.exact} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-4 py-2.5 text-sm transition-all mx-2 rounded-lg mb-0.5',
                isActive ? 'bg-green-500/15 text-green-400 font-semibold' : 'text-white/50 hover:text-white hover:bg-white/5'
              )}>
              <item.icon size={17} className="flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-3 py-3 border-t border-white/5 flex-shrink-0 relative">
          {userMenuOpen && (
            <div className="absolute bottom-14 left-2 right-2 bg-[#0F172A] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-10">
              <button onClick={() => { navigate('/superadmin/settings'); setUserMenuOpen(false) }}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5">
                <Settings size={14} /><span>Ayarlar</span>
              </button>
              <div className="h-px bg-white/5" />
              <button onClick={() => { logout(); window.location.href = '/login' }}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10">
                <LogOut size={14} /><span>Çıkış</span>
              </button>
            </div>
          )}
          <button onClick={() => setUserMenuOpen(o => !o)}
            className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
              {(user?.full_name || 'S').charAt(0)}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-white text-xs font-semibold truncate">{user?.full_name}</div>
              <div className="text-white/30 text-[9px]">Superadmin</div>
            </div>
            <ChevronUp size={10} className={cn('text-white/30 transition-transform', userMenuOpen ? '' : 'rotate-180')} />
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-gray-50">
        <header className="h-13 bg-white border-b border-gray-200 flex items-center px-4 gap-3 flex-shrink-0" style={{height:'52px'}}>
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-400 hover:text-gray-600"><Menu size={20} /></button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
              🔐 Superadmin
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
