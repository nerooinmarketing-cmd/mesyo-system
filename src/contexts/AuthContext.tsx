import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { AuthUser, Role } from '@/types'

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  login: (phone: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
  isRole: (role: Role) => boolean
  isSuperadmin: boolean
  isAdmin: boolean
  isTeacher: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const t = localStorage.getItem('mesyo_token')
    const u = localStorage.getItem('mesyo_user')
    if (t && u) {
      try { setToken(t); setUser(JSON.parse(u)) } catch {}
    }
    setIsLoading(false)
  }, [])

  const login = async (phone: string, password: string) => {
    const { authApi } = await import('@/lib/api')
    const res = await authApi.login(phone, password)
    localStorage.setItem('mesyo_token', res.token)
    localStorage.setItem('mesyo_user', JSON.stringify(res.user))
    setToken(res.token)
    setUser(res.user)
  }

  const logout = () => {
    localStorage.clear()
    setToken(null); setUser(null)
  }

  const isRole = (role: Role) => user?.role === role
  const isSuperadmin = user?.role === 'superadmin'
  const isAdmin = user?.role === 'institution_admin' || user?.role === 'superadmin'
  const isTeacher = user?.role === 'teacher'

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, isRole, isSuperadmin, isAdmin, isTeacher }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
