import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SuperadminLayout } from '@/components/layout/SuperadminLayout'
import { Alert } from '@/components/ui'
import type { Institution } from '@/types'
import { superadminApi } from '@/lib/api'

type FilterType = 'all' | 'active' | 'trial' | 'passive' | 'expired'

function StatusBadge({ status, is_active }: { status: string; is_active: boolean }) {
  if (!is_active) return <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-gray-100 text-gray-500">⛔ Pasif</span>
  const map: Record<string,[string,string]> = {
    active:    ['bg-green-100 text-green-700',  '✅ Aktif'],
    trial:     ['bg-blue-100 text-blue-700',    '🔵 Deneme'],
    expired:   ['bg-red-100 text-red-500',      '⚠️ Doldu'],
    cancelled: ['bg-gray-100 text-gray-500',    '❌ İptal'],
  }
  const [cls, label] = map[status] || ['bg-gray-100 text-gray-500', status]
  return <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${cls}`}>{label}</span>
}

export default function SuperadminDashboardPage() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [insts, setInsts] = useState<Institution[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [expandedId, setExpandedId] = useState<string|null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setLoadError('')
      try {
        const list = await superadminApi.institutions()
        if (!cancelled) setInsts(list)
      } catch (e: any) {
        if (!cancelled) setLoadError(e.message || 'Kurum listesi yüklenirken bir hata oluştu')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const stats = {
    total:   insts.length,
    active:  insts.filter(i => i.is_active && i.subscription_status === 'active').length,
    trial:   insts.filter(i => i.subscription_status === 'trial').length,
    expired: insts.filter(i => i.subscription_status === 'expired' || i.subscription_status === 'cancelled').length,
    passive: insts.filter(i => !i.is_active).length,
    students: insts.reduce((a,i) => a + (i.student_count||0), 0),
    teachers: insts.reduce((a,i) => a + (i.teacher_count||0), 0),
  }

  const filtered = insts.filter(i => {
    const q = search.toLowerCase()
    const mq = !q || i.name.toLowerCase().includes(q) || i.slug.includes(q) || i.district.toLowerCase().includes(q) || i.responsible_name.toLowerCase().includes(q) || i.responsible_phone.includes(q)
    const mf =
      filter === 'all'     ? true :
      filter === 'active'  ? (i.is_active && i.subscription_status === 'active') :
      filter === 'trial'   ? (i.subscription_status === 'trial') :
      filter === 'passive' ? (!i.is_active) :
      filter === 'expired' ? (i.subscription_status === 'expired' || i.subscription_status === 'cancelled') : true
    return mq && mf
  })

  const toggleActive = async (id: string, current: boolean) => {
    setInsts(p => p.map(i => i.id===id ? {...i, is_active: !current} : i))
    try {
      await superadminApi.toggleActive(id, !current)
    } catch (e: any) {
      setInsts(p => p.map(i => i.id===id ? {...i, is_active: current} : i))
    }
  }

  const statCards = [
    { label:'Toplam Kurum',   value:stats.total,   sub:undefined,             color:'border-gray-300',  filter:'all'     as FilterType },
    { label:'Aktif',          value:stats.active,   sub:`${stats.students} öğrenci`, color:'border-green-500', filter:'active'  as FilterType },
    { label:'Deneme',         value:stats.trial,    sub:undefined,             color:'border-blue-400',  filter:'trial'   as FilterType },
    { label:'Süresi Doldu',   value:stats.expired,  sub:undefined,             color:'border-red-400',   filter:'expired' as FilterType },
  ]

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
      <div className="space-y-5">

        {/* İstatistik kartları */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map(s => (
            <button key={s.filter} onClick={() => setFilter(f => f===s.filter?'all':s.filter)}
              className={`bg-white rounded-xl shadow-sm p-5 border-t-[3px] text-left transition-all hover:-translate-y-0.5 ${s.color} ${filter===s.filter?'ring-2 ring-offset-1 ring-gray-300':''}`}>
              <div className="text-2xl font-extrabold text-gray-900">{s.value}</div>
              <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">{s.label}</div>
              {s.sub && <div className="text-xs text-gray-400 mt-0.5">{s.sub}</div>}
            </button>
          ))}
        </div>

        {/* Ekstra istatistikler */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {l:'Toplam Öğrenci', v:stats.students, c:'text-green-600'},
            {l:'Toplam Öğretmen', v:stats.teachers, c:'text-blue-600'},
            {l:'Pasif Kurum', v:stats.passive, c:'text-gray-500'},
          ].map(s=>(
            <div key={s.l} className="bg-white rounded-xl shadow-sm px-4 py-3 text-center">
              <div className={`text-xl font-extrabold ${s.c}`}>{s.v}</div>
              <div className="text-xs text-gray-400 mt-0.5 font-semibold">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Arama + filtreler */}
        <div className="flex gap-2 flex-wrap items-center">
          <input type="text" placeholder="🔍 Kurum ara — isim, slug, ilçe, sorumlu, telefon..."
            value={search} onChange={e=>setSearch(e.target.value)}
            className="flex-1 min-w-60 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500 bg-white"/>
          <div className="flex gap-1.5 flex-wrap">
            {([
              ['all','Tümü'],['active','Aktif'],['trial','Deneme'],['passive','Pasif'],['expired','Doldu']
            ] as [FilterType,string][]).map(([v,l])=>(
              <button key={v} onClick={()=>setFilter(f=>f===v?'all':v)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${filter===v?'bg-green-500 text-white border-green-500':'border-gray-200 text-gray-500 bg-white hover:border-gray-300'}`}>
                {l} {v!=='all'?`(${insts.filter(i=>v==='active'?(i.is_active&&i.subscription_status==='active'):v==='trial'?(i.subscription_status==='trial'):v==='passive'?(!i.is_active):(i.subscription_status==='expired'||i.subscription_status==='cancelled')).length})`:'' }
              </button>
            ))}
          </div>
          <button onClick={()=>navigate('/superadmin/institutions/new')}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-lg transition-colors ml-auto">
            + Kurum Ekle
          </button>
        </div>

        {/* Kurum tablosu */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="text-sm font-bold text-gray-900">Kurumlar</div>
            <div className="text-xs text-gray-400">{filtered.length} kurum</div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-3xl mb-2">🏛️</div>
              <p className="text-sm">Kurum bulunamadı</p>
            </div>
          ) : (
            <div>
              {filtered.map(inst => {
                const isExpanded = expandedId === inst.id
                const isActive = inst.is_active
                const fillPct = inst.student_limit ? Math.round((inst.student_count||0)/inst.student_limit*100) : 0

                return (
                  <div key={inst.id} className={`border-b border-gray-50 last:border-0 transition-all ${isExpanded?'bg-green-50/30':''}`}>
                    {/* Ana satır */}
                    <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                      {/* Aktif/Pasif toggle */}
                      <button onClick={()=>toggleActive(inst.id, isActive)}
                        className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${isActive?'bg-green-500':'bg-gray-200'}`}>
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isActive?'translate-x-4':'translate-x-0.5'}`}/>
                      </button>

                      {/* Kurum adı */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-gray-900">{inst.name}</span>
                          <StatusBadge status={inst.subscription_status} is_active={isActive}/>
                        </div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">{inst.slug}.mesyosoft.com.tr</div>
                      </div>

                      {/* İlçe */}
                      <div className="hidden md:block text-xs text-gray-500 w-28 flex-shrink-0">{inst.district}</div>

                      {/* Öğrenci doluluk */}
                      <div className="hidden lg:block w-24 flex-shrink-0">
                        <div className="flex items-center justify-between text-xs mb-0.5">
                          <span className="text-gray-600 font-semibold">{inst.student_count||0}</span>
                          <span className="text-gray-400">/{inst.student_limit}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${fillPct>80?'bg-red-400':fillPct>60?'bg-amber-400':'bg-green-400'}`}
                            style={{width:`${Math.min(fillPct,100)}%`}}/>
                        </div>
                      </div>

                      {/* İşlemler */}
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button onClick={()=>setExpandedId(isExpanded?null:inst.id)}
                          className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${isExpanded?'bg-green-500 text-white border-green-500':'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                          {isExpanded?'Kapat':'Detay'}
                        </button>
                        <button onClick={()=>navigate(`/superadmin/institutions/${inst.id}`)}
                          className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                          Tam Sayfa
                        </button>
                        <button onClick={()=>window.open(`/admin/dashboard`,'_blank')}
                          className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-green-200 text-green-700 bg-green-50 hover:bg-green-100 transition-colors">
                          Paneli Aç ↗
                        </button>
                      </div>
                    </div>

                    {/* Genişletilmiş detay */}
                    {isExpanded && (
                      <div className="px-5 pb-4 border-t border-green-100 bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">

                          {/* Kurum bilgileri */}
                          <div>
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Kurum Bilgileri</div>
                            <div className="space-y-1.5">
                              {[
                                ['Şehir/İlçe', `${inst.city} / ${inst.district}`],
                                ['Sorumlu', inst.responsible_name],
                                ['Telefon', inst.responsible_phone],
                                ['Kayıt Tarihi', inst.created_at],
                              ].map(([l,v])=>(
                                <div key={l} className="flex gap-2 text-xs">
                                  <span className="text-gray-400 w-24 flex-shrink-0">{l}</span>
                                  <span className="text-gray-700 font-semibold">{v}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* İstatistikler */}
                          <div>
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">İstatistikler</div>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                {l:'Öğrenci', v:`${inst.student_count||0}/${inst.student_limit}`, c:'text-green-600'},
                                {l:'Öğretmen', v:inst.teacher_count||0, c:'text-blue-600'},
                                {l:'Doluluk', v:`%${fillPct}`, c:fillPct>80?'text-red-500':'text-gray-700'},
                                {l:'Durum', v:isActive?'Aktif':'Pasif', c:isActive?'text-green-600':'text-gray-500'},
                              ].map(s=>(
                                <div key={s.l} className="bg-gray-50 rounded-lg p-2.5 text-center">
                                  <div className={`text-base font-extrabold ${s.c}`}>{s.v}</div>
                                  <div className="text-[10px] text-gray-400 mt-0.5">{s.l}</div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Hızlı işlemler */}
                          <div>
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Hızlı İşlemler</div>
                            <div className="space-y-2">
                              <button onClick={()=>navigate(`/superadmin/institutions/${inst.id}`)}
                                className="w-full py-2 px-3 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors">
                                📋 Tam Detay Sayfası
                              </button>
                              <button onClick={()=>navigate(`/superadmin/institutions/${inst.id}/modules`)}
                                className="w-full py-2 px-3 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors">
                                🔧 Modül Yönetimi
                              </button>
                              <button onClick={()=>navigate(`/superadmin/institutions/${inst.id}?tab=abonelik`)}
                                className="w-full py-2 px-3 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors">
                                💳 Abonelik Yönetimi
                              </button>
                              <button onClick={()=>{if(window.confirm(`${inst.name} kurumunu ${isActive?'pasif':'aktif'} yapmak istiyor musunuz?`))toggleActive(inst.id, isActive)}}
                                className={`w-full py-2 px-3 text-xs font-semibold border rounded-lg text-left transition-colors ${isActive?'border-red-200 text-red-500 hover:bg-red-50':'border-green-200 text-green-600 hover:bg-green-50'}`}>
                                {isActive?'⛔ Pasif Yap':'✅ Aktif Et'}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Abonelik bilgisi */}
                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3 flex-wrap">
                          <StatusBadge status={inst.subscription_status} is_active={isActive}/>
                          {inst.subscription_expires_at && (
                            <span className="text-xs text-gray-500">
                              Bitiş: <strong>{inst.subscription_expires_at}</strong>
                            </span>
                          )}
                          {inst.trial_ends_at && (
                            <span className="text-xs text-amber-600 font-semibold">
                              ⏰ Deneme bitiş: {inst.trial_ends_at}
                            </span>
                          )}
                          <span className="text-xs text-gray-400 font-mono ml-auto">
                            {inst.slug}.mesyosoft.com.tr
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </SuperadminLayout>
  )
}
