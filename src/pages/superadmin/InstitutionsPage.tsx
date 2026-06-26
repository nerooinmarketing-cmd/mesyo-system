import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SuperadminLayout } from '@/components/layout/SuperadminLayout'
import { Alert } from '@/components/ui'
import type { Institution } from '@/types'
import { superadminApi } from '@/lib/api'

function Badge({ status, is_active }: { status: string; is_active: boolean }) {
  if (!is_active) return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-gray-100 text-gray-500">⛔ Pasif</span>
  const m: Record<string,[string,string]> = {
    active:    ['bg-green-100 text-green-700','✅ Aktif'],
    trial:     ['bg-blue-100 text-blue-700','🔵 Deneme'],
    expired:   ['bg-red-100 text-red-500','⚠️ Doldu'],
    cancelled: ['bg-gray-100 text-gray-500','❌ İptal'],
  }
  const [cls, label] = m[status]||['bg-gray-100 text-gray-500', status]
  return <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${cls}`}>{label}</span>
}

export default function InstitutionsPage() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [insts, setInsts] = useState<Institution[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState<'name'|'students'|'created'>('name')

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

  const filtered = insts
    .filter(i => {
      const q = search.toLowerCase()
      const mq = !q || i.name.toLowerCase().includes(q) || i.slug.includes(q) || i.district.toLowerCase().includes(q) || i.responsible_name.toLowerCase().includes(q) || i.responsible_phone.includes(q)
      const mf = filter==='all'?true:filter==='active'?(i.is_active&&i.subscription_status==='active'):filter==='trial'?(i.subscription_status==='trial'):filter==='passive'?(!i.is_active):(i.subscription_status==='expired'||i.subscription_status==='cancelled')
      return mq && mf
    })
    .sort((a,b) => sort==='students'?(b.student_count||0)-(a.student_count||0):sort==='created'?b.created_at.localeCompare(a.created_at):a.name.localeCompare(b.name))

  const toggleActive = async (id: string, current: boolean) => {
    // Önce ekranda anında yansıt, başarısız olursa geri al — kullanıcı beklemesin
    setInsts(p => p.map(i => i.id===id ? {...i, is_active: !current} : i))
    try {
      await superadminApi.toggleActive(id, !current)
    } catch (e: any) {
      setInsts(p => p.map(i => i.id===id ? {...i, is_active: current} : i))
    }
  }

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
      <div className="space-y-4">
        {/* Üst bar */}
        <div className="flex gap-2 flex-wrap items-center">
          <input type="text" placeholder="🔍 İsim, slug, ilçe, sorumlu, telefon..."
            value={search} onChange={e=>setSearch(e.target.value)}
            className="flex-1 min-w-52 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500 bg-white"/>
          <select value={sort} onChange={e=>setSort(e.target.value as any)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white">
            <option value="name">A-Z</option>
            <option value="students">Öğrenci Sayısı</option>
            <option value="created">Kayıt Tarihi</option>
          </select>
          <button onClick={()=>navigate('/superadmin/institutions/new')}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-lg transition-colors">
            + Kurum Ekle
          </button>
        </div>

        {/* Filtreler */}
        <div className="flex gap-2 flex-wrap">
          {([
            ['all','Tümü',insts.length],
            ['active','✅ Aktif',insts.filter(i=>i.is_active&&i.subscription_status==='active').length],
            ['trial','🔵 Deneme',insts.filter(i=>i.subscription_status==='trial').length],
            ['passive','⛔ Pasif',insts.filter(i=>!i.is_active).length],
            ['expired','⚠️ Doldu',insts.filter(i=>i.subscription_status==='expired'||i.subscription_status==='cancelled').length],
          ] as [string,string,number][]).map(([v,l,n])=>(
            <button key={v} onClick={()=>setFilter(f=>f===v?'all':v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${filter===v?'bg-green-500 text-white border-green-500':'border-gray-200 text-gray-500 bg-white'}`}>
              {l} <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${filter===v?'bg-white/20':'bg-gray-100'}`}>{n}</span>
            </button>
          ))}
        </div>

        {/* Tablo */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex justify-between">
            <span className="text-sm font-bold text-gray-900">Kurumlar</span>
            <span className="text-xs text-gray-400">{filtered.length} kurum</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Kurum','İlçe','Sorumlu','Öğrenci','Durum','İşlem'].map(h=>(
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(i=>{
                  const fill = i.student_limit?Math.round((i.student_count||0)/i.student_limit*100):0
                  return (
                    <tr key={i.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">{i.name}</div>
                        <div className="text-xs text-gray-400 font-mono">{i.slug}.mesyosoft.com.tr</div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{i.city} / {i.district}</td>
                      <td className="px-4 py-3">
                        <div className="text-gray-700">{i.responsible_name}</div>
                        <div className="text-xs text-gray-400">{i.responsible_phone}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">{i.student_count||0}<span className="text-gray-400 font-normal text-xs">/{i.student_limit}</span></div>
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                          <div className={`h-full rounded-full ${fill>80?'bg-red-400':fill>60?'bg-amber-400':'bg-green-400'}`} style={{width:`${Math.min(fill,100)}%`}}/>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={()=>toggleActive(i.id, i.is_active)}
                            className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${i.is_active?'bg-green-500':'bg-gray-200'}`}>
                            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${i.is_active?'translate-x-4':'translate-x-0.5'}`}/>
                          </button>
                          <Badge status={i.subscription_status} is_active={i.is_active}/>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <button onClick={()=>navigate(`/superadmin/institutions/${i.id}`)}
                            className="px-2.5 py-1.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors">
                            Detay
                          </button>
                          <button onClick={()=>navigate(`/superadmin/institutions/${i.id}/modules`)}
                            className="px-2.5 py-1.5 border border-purple-200 text-purple-600 text-xs font-semibold rounded-lg hover:bg-purple-50 transition-colors">
                            Modül
                          </button>
                          <button onClick={()=>navigate('/admin/dashboard')}
                            className="px-2.5 py-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-lg hover:bg-green-100 transition-colors">
                            Panel ↗
                          </button>
                          <button onClick={async()=>{
                            if(!window.confirm(`"${i.name}" kurumunu silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`)) return
                            try {
                              await superadminApi.deleteInstitution(i.id)
                              setInsts(p => p.filter(x => x.id !== i.id))
                            } catch(e:any) { alert('Silinemedi: ' + e.message) }
                          }}
                            className="px-2.5 py-1.5 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-100 transition-colors">
                            🗑️ Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filtered.length===0 && (
            <div className="text-center py-12 text-gray-400">
              <div className="text-3xl mb-2">🏛️</div>
              <p className="text-sm">Kurum bulunamadı</p>
            </div>
          )}
        </div>
      </div>
    </SuperadminLayout>
  )
}
