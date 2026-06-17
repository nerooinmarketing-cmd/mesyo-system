import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { SuperadminLayout } from '@/components/layout/SuperadminLayout'
import { ALL_MODULES, getInstitutionModules, saveInstitutionModules } from '@/lib/modules'
import { useToast } from '@/components/ui'

const CATEGORY_LABELS: Record<string, string> = {
  core: '🏗️ Temel Modüller',
  advanced: '⚡ Gelişmiş Modüller',
  communication: '💬 İletişim Modülleri',
  reporting: '📊 Raporlama Modülleri',
}

const DEMO_INST_NAME: Record<string, string> = {
  i1: 'Karacihan Mescidi',
  i2: 'Fatih Camii',
  i3: 'Merkez Camii',
}

export default function ModulesPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const instName = DEMO_INST_NAME[id || ''] || 'Kurum'
  const [modules, setModules] = useState<Record<string, boolean>>(getInstitutionModules(id || 'default'))
  const [saving, setSaving] = useState(false)

  const toggle = (moduleId: string) => {
    // core modüller kapatılamaz
    const mod = ALL_MODULES.find(m => m.id === moduleId)
    if (mod?.category === 'core') { toast('Temel modüller kapatılamaz', 'error'); return }
    setModules(p => ({ ...p, [moduleId]: !p[moduleId] }))
  }

  const save = async () => {
    setSaving(true)
    saveInstitutionModules(id || 'default', modules)
    await new Promise(r => setTimeout(r, 400))
    setSaving(false)
    toast('Modüller kaydedildi ✅', 'success')
  }

  const enableAll = () => setModules(Object.fromEntries(ALL_MODULES.map(m => [m.id, true])))
  const resetDefaults = () => setModules(Object.fromEntries(ALL_MODULES.map(m => [m.id, m.default])))

  const categories = ['core', 'advanced', 'communication', 'reporting'] as const

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
            {Object.values(modules).filter(Boolean).length} / {ALL_MODULES.length} modül aktif
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
          const catModules = ALL_MODULES.filter(m => m.category === cat)
          return (
            <div key={cat}>
              <div className="text-sm font-bold text-gray-700 mb-2">{CATEGORY_LABELS[cat]}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {catModules.map(mod => {
                  const active = modules[mod.id] !== false
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
