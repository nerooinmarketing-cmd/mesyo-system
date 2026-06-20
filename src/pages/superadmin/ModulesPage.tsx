import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { SuperadminLayout } from '@/components/layout/SuperadminLayout'
import { useToast, Alert } from '@/components/ui'
import { modulesApi, superadminApi } from '@/lib/api'

const CATEGORY_LABELS: Record<string, string> = {
  core: '🏗️ Temel Modüller',
  advanced: '⚡ Gelişmiş Modüller',
  communication: '💬 İletişim Modülleri',
  reporting: '📊 Raporlama Modülleri',
}

export default function ModulesPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [instName, setInstName] = useState('Kurum')
  const [allModules, setAllModules] = useState<any[]>([])
  const [modules, setModules] = useState<Record<string, { is_active: boolean; custom_name: string | null }>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    const institutionId = id
    let cancelled = false
    async function load() {
      setLoading(true)
      setLoadError('')
      try {
        const [inst, catalog, current] = await Promise.all([
          superadminApi.institution(institutionId),
          modulesApi.allModules(),
          modulesApi.institutionModules(institutionId),
        ])
        if (cancelled) return
        setInstName(inst.name)
        setAllModules(catalog)
        const normalized: Record<string, { is_active: boolean; custom_name: string | null }> = {}
        for (const [k, v] of Object.entries(current as any)) {
          if (typeof v === 'boolean') {
            normalized[k] = { is_active: v, custom_name: null }
          } else {
            normalized[k] = { is_active: (v as any).is_active, custom_name: (v as any).custom_name || null }
          }
        }
        setModules(normalized)
      } catch (e: any) {
        if (!cancelled) setLoadError(e.message || 'Modüller yüklenirken bir hata oluştu')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  const toggle = (moduleId: string) => {
    const mod = allModules.find(m => m.id === moduleId)
    if (mod?.category === 'core') { toast('Temel modüller kapatılamaz', 'error'); return }
    setModules(p => ({ ...p, [moduleId]: { ...p[moduleId], is_active: !p[moduleId]?.is_active } }))
  }

  const setCustomName = (moduleId: string, name: string) => {
    setModules(p => ({ ...p, [moduleId]: { ...p[moduleId], custom_name: name || null } }))
  }

  const save = async () => {
    if (!id) return
    setSaving(true)
    try {
      const updates = allModules.map(m => ({
        module_id: m.id,
        is_active: modules[m.id]?.is_active ?? m.is_default,
        custom_name: modules[m.id]?.custom_name || null,
      }))
      await modulesApi.updateInstitutionModules(id, updates)
      toast('Modüller kaydedildi ✅', 'success')
      await modulesApi.updateInstitutionModules(id, updates)
      toast('Modüller kaydedildi ✅', 'success')
    } catch (e: any) {
      toast(e.message || 'Kaydetme başarısız oldu', 'error')
    } finally {
      setSaving(false)
    }
  }

  const enableAll = () => setModules(Object.fromEntries(allModules.map(m => [m.id, { is_active: true, custom_name: modules[m.id]?.custom_name || null }])))
  const resetDefaults = () => setModules(Object.fromEntries(allModules.map(m => [m.id, { is_active: m.is_default, custom_name: modules[m.id]?.custom_name || null }])))

  const categories = ['core', 'advanced', 'communication', 'reporting'] as const

  if (loading) return (
    <SuperadminLayout>
      <div className="flex items-center justify-center py-24 text-gray-400">
        <div className="text-center">
          <div className="text-3xl mb-2 animate-pulse">⏳</div>
          <p className="text-sm">Yükleniyor...</p>
        </div>
      </div>
    </SuperadminLayout>
  )

  if (loadError) return (
    <SuperadminLayout>
      <Alert variant="warn">{loadError}</Alert>
      <button onClick={() => window.location.reload()}
        className="mt-3 px-4 py-2 bg-green-500 text-white text-sm font-bold rounded-lg">
        Tekrar Dene
      </button>
    </SuperadminLayout>
  )

  return (
    <SuperadminLayout>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4 text-sm text-gray-400">
        <button onClick={() => navigate('/superadmin')} className="hover:text-gray-600">Kurumlar</button>
        <span>/</span>
        <button onClick={() => navigate(`/superadmin/institutions/${id}`)} className="hover:text-gray-600">{instName}</button>
        <span>/</span>
        <span className="text-gray-900 font-semibold">Modül Yönetimi</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-5 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-lg font-extrabold text-gray-900">{instName}</div>
          <div className="text-sm text-gray-400 mt-0.5">
            {Object.values(modules).filter(m => m.is_active).length} / {allModules.length} modül aktif
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={resetDefaults}
            className="px-3 py-2 border border-gray-200 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50">
            Varsayılana Dön
          </button>
          <button onClick={enableAll}
            className="px-3 py-2 border border-green-200 text-green-700 text-sm font-semibold rounded-lg hover:bg-green-50">
            Hepsini Aç
          </button>
          <button onClick={save} disabled={saving}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-lg disabled:opacity-50 transition-colors">
            {saving ? '⏳ Kaydediliyor...' : '💾 Kaydet'}
          </button>
        </div>
      </div>

      {/* Modüller */}
      <div className="space-y-5">
        {categories.map(cat => {
          const catModules = allModules.filter(m => m.category === cat)
          if (catModules.length === 0) return null
          return (
            <div key={cat}>
              <div className="text-sm font-bold text-gray-700 mb-2">{CATEGORY_LABELS[cat]}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {catModules.map(mod => {
                  const active = modules[mod.id]?.is_active ?? mod.is_default
                  const customName = modules[mod.id]?.custom_name || ''
                  const isCore = mod.category === 'core'
                  return (
                    <div key={mod.id}
                      className={`bg-white rounded-xl shadow-sm p-4 border-2 transition-all ${active ? 'border-green-200' : 'border-gray-100 opacity-60'}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${active ? 'bg-green-50' : 'bg-gray-50'}`}>
                          {mod.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-900">{mod.name}</span>
                            {isCore && (
                              <span className="text-[9px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full uppercase">Zorunlu</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">{mod.description}</p>
                          {active && (
                            <input
                              value={customName}
                              onChange={e => setCustomName(mod.id, e.target.value)}
                              placeholder={`Özel isim (varsayılan: ${mod.name})`}
                              className="mt-2 w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-green-500"
                              onClick={e => e.stopPropagation()}
                            />
                          )}
                        </div>
                        {/* Toggle */}
                        <button
                          onClick={() => toggle(mod.id)}
                          disabled={isCore}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 disabled:cursor-not-allowed ${active ? 'bg-green-500' : 'bg-gray-200'}`}>
                          <span className={`inline-block w-4 h-4 transform rounded-full bg-white shadow transition-transform ${active ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </SuperadminLayout>
  )
}
