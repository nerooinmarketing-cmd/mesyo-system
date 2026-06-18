import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Accordion, Button, Badge, Alert, useToast, Modal, Select } from '@/components/ui'
import { calcAge, waLink } from '@/lib/utils'
import { studentsApi, classroomsApi, seasonsApi } from '@/lib/api'

type Filter = 'tumu' | 'bekleyen' | 'onaylandi' | 'reddedildi'
type GenderFilter = 'tumu' | 'erkek' | 'kiz'

export default function RegistrationsPage() {
  const { toast } = useToast()
  const [searchParams] = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [seasons, setSeasons] = useState<any[]>([])
  const [classrooms, setClassrooms] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [activeSeason, setActiveSeason] = useState('')

  const [filter, setFilter] = useState<Filter>('tumu')
  const [gender, setGender] = useState<GenderFilter>('tumu')
  const [search, setSearch] = useState('')
  const [ageFilter, setAgeFilter] = useState(searchParams.get('age')||'')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkCls, setBulkCls] = useState('')
  const [assignModal, setAssignModal] = useState<{open:boolean;sid:string;sname:string}>({open:false,sid:'',sname:''})
  const [assignCls, setAssignCls] = useState('')
  const [rejectModal, setRejectModal] = useState<{open:boolean;sid:string;sname:string}>({open:false,sid:'',sname:''})
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setLoadError('')
      try {
        const [seasonList, classroomList] = await Promise.all([seasonsApi.list(), classroomsApi.list()])
        if (cancelled) return
        setSeasons(seasonList)
        setClassrooms(classroomList)
        const active = seasonList.find((s: any) => s.is_active) || seasonList[0]
        if (active) setActiveSeason(active.id)
      } catch (e: any) {
        if (!cancelled) setLoadError(e.message || 'Veriler yüklenirken bir hata oluştu')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!activeSeason) return
    let cancelled = false
    async function loadStudents() {
      try {
        const list = await studentsApi.list({ season_id: activeSeason })
        if (!cancelled) setStudents(list)
      } catch (e: any) {
        if (!cancelled) toast(e.message || 'Öğrenciler yüklenemedi', 'error')
      }
    }
    loadStudents()
    return () => { cancelled = true }
  }, [activeSeason])

  const pending = students.filter(s=>s.status==='pending').length

  const filtered = students.filter(s => {
    const fullName = `${s.first_name} ${s.last_name}`
    const parentName = `${s.parent_first_name} ${s.parent_last_name}`
    const q = search.toLowerCase()
    const mq = !q || fullName.toLowerCase().includes(q) || parentName.toLowerCase().includes(q) || (s.mahalle||'').toLowerCase().includes(q)
    const ma = !ageFilter || calcAge(s.birth_date)===parseInt(ageFilter)
    const mf = filter==='bekleyen'?s.status==='pending':filter==='onaylandi'?s.status==='approved':filter==='reddedildi'?s.status==='rejected':true
    const mg = gender==='tumu'?true:s.gender===gender
    return mq && ma && mf && mg
  })

  const approve = async (sid: string) => {
    const s = students.find(x=>x.id===sid)
    try {
      await studentsApi.approve(sid)
      setStudents(p=>p.map(x=>x.id===sid?{...x,status:'approved'}:x))
      toast('Başvuru onaylandı ✅','success')
      if (s) {
        const fullName = `${s.first_name} ${s.last_name}`
        const parentName = `${s.parent_first_name} ${s.parent_last_name}`
        const msg = `Sayın ${parentName} 👋\n\n${fullName} için yaptığınız başvuru onaylandı! 🎉\n\nEğitim programımıza hoş geldiniz.\n\nSevgi ve saygılarımızla 🌿\nMesyo Eğitim`
        setTimeout(() => window.open(waLink(s.parent_phone, msg),'_blank'), 300)
      }
    } catch (e: any) {
      toast(e.message || 'Onaylama başarısız oldu', 'error')
    }
  }

  const reject = async (sid: string) => {
    const s = students.find(x=>x.id===sid)
    try {
      await studentsApi.reject(sid, rejectReason || undefined)
      setStudents(p=>p.map(x=>x.id===sid?{...x,status:'rejected'}:x))
      setRejectModal(p=>({...p,open:false})); setRejectReason('')
      toast('Başvuru reddedildi','info')
      if (s) {
        const fullName = `${s.first_name} ${s.last_name}`
        const parentName = `${s.parent_first_name} ${s.parent_last_name}`
        const msg = `Sayın ${parentName} 👋\n\n${fullName} için yaptığınız başvuru değerlendirilmiş olup maalesef kabul edilememiştir.${rejectReason?'\n\nNeden: '+rejectReason:''}\n\nAnlayışınız için teşekkür ederiz.\n\nSaygılarımızla 🌿\nMesyo Eğitim`
        setTimeout(() => window.open(waLink(s.parent_phone, msg),'_blank'), 300)
      }
    } catch (e: any) {
      toast(e.message || 'Reddetme başarısız oldu', 'error')
    }
  }

  const doAssign = async (sid:string,cid:string) => {
    try {
      const updated = await studentsApi.assignClassroom(sid, cid)
      setStudents(p=>p.map(s=>s.id===sid?updated:s))
      toast('Sınıfa atandı ✅','success')
    } catch (e: any) {
      toast(e.message || 'Atama başarısız oldu', 'error')
    }
  }

  const doDelete = async (sid:string,name:string) => {
    if(!confirm(`${name} silinsin mi?`)) return
    try {
      await studentsApi.delete(sid)
      setStudents(p=>p.filter(s=>s.id!==sid))
      toast('Silindi','info')
    } catch (e: any) {
      toast(e.message || 'Silme başarısız oldu', 'error')
    }
  }

  const toggleSel = (id:string) => setSelected(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n})

  const doBulk = async () => {
    if(!bulkCls||!selected.size){toast('Sınıf ve öğrenci seçin','error');return}
    try {
      const ids = Array.from(selected)
      for (const sid of ids) {
        await studentsApi.assignClassroom(sid, bulkCls)
        await studentsApi.approve(sid)
      }
      setStudents(p=>p.map(s=>selected.has(s.id)?{...s,classroom_id:bulkCls,status:'approved'}:s))
      toast(`${selected.size} öğrenci atandı ve onaylandı ✅`,'success')
      setSelected(new Set()); setBulkCls('')
    } catch (e: any) {
      toast(e.message || 'Toplu işlem sırasında bir hata oluştu', 'error')
    }
  }

  const counts = {
    bekleyen: students.filter(s=>s.status==='pending').length,
    onaylandi: students.filter(s=>s.status==='approved').length,
    reddedildi: students.filter(s=>s.status==='rejected').length,
  }

  if (loading) return (
    <AdminLayout>
      <div className="flex items-center justify-center py-24 text-gray-400">
        <div className="text-center">
          <div className="text-3xl mb-2 animate-pulse">⏳</div>
          <p className="text-sm">Yükleniyor...</p>
        </div>
      </div>
    </AdminLayout>
  )

  if (loadError) return (
    <AdminLayout>
      <Alert variant="warn">{loadError}</Alert>
      <button onClick={() => window.location.reload()}
        className="mt-3 px-4 py-2 bg-green-500 text-white text-sm font-bold rounded-lg">
        Tekrar Dene
      </button>
    </AdminLayout>
  )

  return (
    <AdminLayout pendingCount={pending}>
      <div className="space-y-3">
        {/* Sezon */}
        {seasons.length > 0 && (
          <div className="flex gap-2 flex-wrap items-center">
            {seasons.map(s=>(
              <button key={s.id} onClick={()=>setActiveSeason(s.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${activeSeason===s.id?'bg-green-500 text-white border-green-500':'border-gray-200 text-gray-500'}`}>
                {!s.is_active?'📦 ':'📅 '}{s.name}
              </button>
            ))}
          </div>
        )}

        {/* Onay özeti */}
        <div className="grid grid-cols-3 gap-2">
          {([['bekleyen','⏳ Bekleyen',counts.bekleyen,'amber'],['onaylandi','✅ Onaylı',counts.onaylandi,'green'],['reddedildi','❌ Reddedildi',counts.reddedildi,'red']] as const).map(([f,l,v,c])=>(
            <button key={f} onClick={()=>setFilter(f as Filter)}
              className={`bg-white rounded-xl shadow-sm p-3 text-center border-t-[3px] transition-all ${filter===f?'ring-2 ring-offset-1':''}  border-${c}-400`}>
              <div className={`text-2xl font-extrabold text-${c}-500`}>{v}</div>
              <div className="text-xs font-semibold text-gray-500 mt-0.5">{l}</div>
            </button>
          ))}
        </div>

        {pending>0 && filter!=='bekleyen' && <Alert variant="warn">⏳ <strong>{pending}</strong> yeni başvuru onay bekliyor.</Alert>}

        {/* Cinsiyet */}
        <div className="flex bg-gray-100 rounded-xl p-1">
          {([['tumu','Tümü'],['erkek','👦 Erkek'],['kiz','👧 Kız']] as const).map(([g,l])=>(
            <button key={g} onClick={()=>setGender(g)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${gender===g?'bg-white text-gray-900 shadow-sm':'text-gray-400'}`}>{l}</button>
          ))}
        </div>

        {/* Arama + filtre */}
        <div className="flex gap-2 flex-wrap">
          <input type="text" placeholder="🔍 İsim, veli, mahalle..." value={search} onChange={e=>setSearch(e.target.value)}
            className="flex-1 min-w-40 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
          <select value={ageFilter} onChange={e=>setAgeFilter(e.target.value)}
            className="px-2 py-2 border border-gray-200 rounded-lg text-xs outline-none">
            <option value="">Tüm yaşlar</option>
            {Array.from({length:8},(_,i)=>7+i).map(y=><option key={y} value={y}>{y} Yaş</option>)}
          </select>
        </div>

        {/* Toplu */}
        {selected.size>0 && (
          <div className="bg-white rounded-xl shadow-sm px-4 py-2.5 flex items-center gap-3 flex-wrap">
            <span className="text-sm font-semibold text-gray-700">{selected.size} seçildi</span>
            <select value={bulkCls} onChange={e=>setBulkCls(e.target.value)} className="flex-1 min-w-40 px-2 py-1.5 border border-gray-200 rounded-lg text-sm outline-none">
              <option value="">Sınıf seç...</option>
              {classrooms.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <Button size="sm" onClick={doBulk}>Ata ve Onayla</Button>
            <Button size="sm" variant="outline" onClick={()=>setSelected(new Set())}>İptal</Button>
          </div>
        )}

        {/* Liste */}
        {filtered.length===0
          ? <div className="text-center py-12 text-gray-400"><div className="text-4xl mb-2">👥</div><p className="text-sm">Başvuru bulunamadı</p></div>
          : filtered.map(s=>{
              const cls = classrooms.find(c=>c.id===s.classroom_id)
              const a = calcAge(s.birth_date)
              const fullName = `${s.first_name} ${s.last_name}`
              const parentName = `${s.parent_first_name} ${s.parent_last_name}`
              const statusColor = s.status==='approved'?'#16A34A':s.status==='rejected'?'#EF4444':'#F59E0B'
              return (
                <Accordion key={s.id} leftBorder={statusColor}
                  header={
                    <>
                      <input type="checkbox" checked={selected.has(s.id)} onChange={()=>toggleSel(s.id)} onClick={e=>e.stopPropagation()} className="w-4 h-4 accent-green-500 flex-shrink-0" />
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${s.gender==='erkek'?'bg-blue-100 text-blue-700':'bg-pink-100 text-pink-700'}`}>{fullName.charAt(0)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-gray-900 truncate">{fullName}</div>
                        <div className="text-xs text-gray-400">{a} yaş • {s.gender==='erkek'?'👦':'👧'} • {s.mahalle||'—'} • {s.created_at?.split('T')[0]}</div>
                      </div>
                      <Badge variant={s.status==='approved'?'green':s.status==='rejected'?'red':'amber'}>
                        {s.status==='approved'?'✅ Onaylı':s.status==='rejected'?'❌ Reddedildi':'⏳ Bekliyor'}
                      </Badge>
                    </>
                  }>
                  <div className="space-y-0 mb-3">
                    {[
                      ['👤 Veli',parentName],['📱 Telefon',s.parent_phone],
                      ['🎂 Yaş',`${a} yaş`],['📍 Adres',`${s.mahalle||'—'}${s.sokak?' / '+s.sokak:''}`],
                      ['🏫 Sınıf',s.classroom_id?cls?.name||'—':'Atanmamış'],
                    ].map(([l,v])=>(
                      <div key={l} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0 text-sm">
                        <span className="text-xs font-semibold text-gray-400 w-20 flex-shrink-0">{l}</span>
                        <span className="text-gray-700">{v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {s.status==='pending' && <>
                      <Button size="sm" onClick={()=>approve(s.id)}>✅ Onayla + WA Gönder</Button>
                      <Button size="sm" variant="danger" onClick={()=>{setRejectModal({open:true,sid:s.id,sname:fullName});setRejectReason('')}}>❌ Reddet</Button>
                    </>}
                    {s.status==='approved' && !s.classroom_id && (
                      <Button size="sm" onClick={()=>{setAssignModal({open:true,sid:s.id,sname:fullName});setAssignCls('')}}>🏫 Sınıfa Ata</Button>
                    )}
                    <a href={waLink(s.parent_phone,`Sayın ${parentName}, öğrenciniz ${fullName} ile ilgili iletişime geçebilirsiniz.`)}
                      target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] text-white text-xs font-semibold rounded-lg">💬 WA</a>
                    <Button size="sm" variant="danger" onClick={()=>doDelete(s.id,fullName)}>🗑️</Button>
                  </div>
                </Accordion>
              )
            })
        }
      </div>

      <Modal open={assignModal.open} onClose={()=>setAssignModal(p=>({...p,open:false}))}
        title={`${assignModal.sname} → Sınıfa Ata`}
        footer={<><Button variant="outline" onClick={()=>setAssignModal(p=>({...p,open:false}))}>İptal</Button><Button onClick={()=>{if(assignCls){doAssign(assignModal.sid,assignCls);setAssignModal(p=>({...p,open:false}))}else toast('Sınıf seçin','error')}}>Ata</Button></>}>
        <Select label="Sınıf" value={assignCls} onChange={e=>setAssignCls(e.target.value)}>
          <option value="">Seçin...</option>
          {classrooms.map(c=><option key={c.id} value={c.id}>{c.name} ({c.student_count}/{c.capacity})</option>)}
        </Select>
      </Modal>

      <Modal open={rejectModal.open} onClose={()=>setRejectModal(p=>({...p,open:false}))}
        title={`❌ Reddet — ${rejectModal.sname}`}
        footer={<><Button variant="outline" onClick={()=>setRejectModal(p=>({...p,open:false}))}>İptal</Button><Button variant="danger" onClick={()=>reject(rejectModal.sid)}>Reddet + WA Gönder</Button></>}>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Ret Nedeni (opsiyonel — veliye WA ile gönderilir)</label>
          <textarea value={rejectReason} onChange={e=>setRejectReason(e.target.value)} rows={3}
            placeholder="örn: Kontenjan doldu, yaş uygun değil..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500 resize-none" />
        </div>
      </Modal>
    </AdminLayout>
  )
}
