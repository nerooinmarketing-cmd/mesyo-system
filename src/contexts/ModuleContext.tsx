import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getInstitutionModules, saveInstitutionModules, isModuleActive, getActiveNavItems, ALL_MODULES } from '@/lib/modules'

interface ModuleContextType {
  modules: Record<string, boolean>
  isActive: (moduleId: string) => boolean
  setModule: (moduleId: string, active: boolean) => void
  activeNavItems: typeof ALL_MODULES
  loading: boolean
}

const ModuleContext = createContext<ModuleContextType | null>(null)

export function ModuleProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [modules, setModules] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  const institutionId = user?.institution_id || 'default'

  useEffect(() => {
    if (user) {
      // Superadmin her şeyi görebilir
      if (user.role === 'superadmin') {
        setModules(Object.fromEntries(ALL_MODULES.map(m => [m.id, true])))
      } else {
        setModules(getInstitutionModules(institutionId))
      }
      setLoading(false)
    }
  }, [user, institutionId])

  const isActive = (moduleId: string) => {
    if (user?.role === 'superadmin') return true
    return isModuleActive(modules, moduleId)
  }

  const setModule = (moduleId: string, active: boolean) => {
    const updated = { ...modules, [moduleId]: active }
    setModules(updated)
    saveInstitutionModules(institutionId, updated)
  }

  const activeNavItems = getActiveNavItems(modules).filter(m =>
    user?.role === 'superadmin' ? true : isModuleActive(modules, m.id)
  )

  return (
    <ModuleContext.Provider value={{ modules, isActive, setModule, activeNavItems, loading }}>
      {children}
    </ModuleContext.Provider>
  )
}

export function useModules() {
  const ctx = useContext(ModuleContext)
  if (!ctx) throw new Error('useModules must be used within ModuleProvider')
  return ctx
}
