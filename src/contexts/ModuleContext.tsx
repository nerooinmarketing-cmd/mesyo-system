import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { ALL_MODULES, isModuleActive } from '@/lib/modules'
import { modulesApi } from '@/lib/api'

interface ModuleContextType {
  modules: Record<string, boolean>
  isActive: (moduleId: string) => boolean
  activeNavItems: typeof ALL_MODULES
  loading: boolean
}

const ModuleContext = createContext<ModuleContextType | null>(null)

export function ModuleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [modules, setModules] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!user) return
      setLoading(true)
      try {
        // Superadmin her şeyi görebilir, API çağrısına gerek yok
        if (user.role === 'superadmin') {
          if (!cancelled) setModules(Object.fromEntries(ALL_MODULES.map(m => [m.id, true])))
        } else {
          const myModules = await modulesApi.myModules()
          if (!cancelled) setModules(myModules)
        }
      } catch {
        // API başarısız olursa statik varsayılanlara düş — menü tamamen kaybolmasın
        if (!cancelled) setModules(Object.fromEntries(ALL_MODULES.map(m => [m.id, m.default])))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [user])

  const isActive = (moduleId: string) => {
    if (user?.role === 'superadmin') return true
    return isModuleActive(modules, moduleId)
  }

  const activeNavItems = ALL_MODULES.filter(m => m.navItem && isActive(m.id))

  return (
    <ModuleContext.Provider value={{ modules, isActive, activeNavItems, loading }}>
      {children}
    </ModuleContext.Provider>
  )
}

export function useModules() {
  const ctx = useContext(ModuleContext)
  if (!ctx) throw new Error('useModules must be used within ModuleProvider')
  return ctx
}
