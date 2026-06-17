import { useState } from 'react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Card, CardHeader, CardTitle, CardBody, Button, Badge, Alert, useToast, EmptyState } from '@/components/ui'
import { waLink, absenceMessage, dateRangeDays, calcAge, cn, todayISO } from '@/lib/utils'
import { DEMO_STUDENTS, DEMO_CLASSROOMS, DEMO_TEACHERS } from '@/lib/demo-data'
import * as XLSX from 'xlsx'

type Tab = 'gunluk' | 'ogretmen' | 'rapor'

// Demo devamsızlık verisi
const DEMO_ATT: Record<string, Record<string, 'present'|'absent'>> = {
  '2026-06-09': {s1:'present',s2:'absent',s8:'present',s3:'present'},
  '2026-06-10': {s1:'absent', s2:'present',s8:'present',s3:'absent'},
  '2026-06-11': {s1:'present',s2:'present',s8:'absent', s3:'present'},
  '2026-06-12': {s1:'present',s2:'absent', s8:'present',s3:'present'},
  '2026-06-13': {s1:'absent', s2:'present',s8:'present',s3:'absent'},
  '2026-06-16': {s1:'present',s2:'present',s8:'present',s3:'present'},
}

// Demo öğretmen yoklama logları
const DEMO_TEACHER_LOGS = [
  {date:'2026-06-16', teacherId:'t1', classId:'c1', enteredAt:'09:05', count:5, absent:0},
  {date:'2026-06-13', teacherId:'t1', classId:'c1', enteredAt:'09:12', count:5, absent:2},
  {date:'2026-06-12', teacherId:'t1', classId:'c1', enteredAt:'09:03', count:5, absent:0},
  {date:'2026-06-16', teacherId:'t2', classId:'c3', enteredAt:'14:08', count:4, absent:1},
  {date:'2026-06-13', teacherId:'t2', classId:'c3', enteredAt:'—',    count:0, absent:0, missing:true},
  {date:'2026-06-12', teacherId:'t2', classId:'c3', enteredAt:'14:15', count:4, absent:0},
]

function exportAttXLSX(data: any[], filename: string) {
  const rows = data.map(r=>({
    'Tarih':r.date,'Öğrenci':r.studentName,'Sınıf':r.className,
    'Öğretmen':r.teacherName,'Durum':r.status==='present'?'Geldi':'Gelmedi',
    'Devam %':r.rate+'%'
  }))
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [{wch:12},{wch:22},{wch:18},{wch:20},{wch:10},{wch:10}]
  XLSX.utils.book_append_sheet(wb,ws,'Devam Raporu')
  XLSX.writeFile(wb,filename+'.xlsx')
}

export default function AttendancePage() {
  const {toast} = useToast()
  const [tab, setTab] = useState<Tab>('gunluk')
  const [selCls, setSelCls] = useState('')
  const [selDate, setSelDate] = useState(todayISO())
  const [attendance, setAttendance] = useState<Record<string,'present'|'absent'>>({})
  // Rapor
  const [rptStart, setRptStart] = useState(()=>{const d=new Date();d.setDate(d.getDate()-7);return d.toISOString().split('T')[0]})
  const [rptEnd, setRptEnd] = useState(todayISO())
  const [rptCls, setRptCls] = useState('')
  const [rptData, setRptData] = useState<any[]>([])
  // Öğretmen takip
  const [tchFilter, setTchFilter] = useState('')
  const [tchDateFilter, setTchDateFilter] = useState('')

  const cls = DEMO_CLASSROOMS.find(c=>c.id===selCls)
  const clsStudents = DEMO_STUDENTS.filter(s=>s.classroom_id===selCls)

  const handleClsChange = (cid:string) => {
    setSelCls(cid)
    const dayData = DEMO_ATT[selDate]||{}
    const clsStudentIds = DEMO_STUDENTS.filter(s=>s.classroom_id===cid).map(s=>s.id)
    const filtered = Object.fromEntries(Object.entries(dayData).filter(([k])=>clsStudentIds.includes(k)))
    setAttendance(filtered as Record<string,'present'|'absent'>)
  }

  const handleDateChange = (date:string) => {
    setSelDate(date)
    if(!selCls) return
    const dayData = DEMO_ATT[date]||{}
    const clsStudentIds = DEMO_STUDENTS.filter(s=>s.classroom_id===selCls).map(s=>s.id)
    const filtered = Object.fromEntries(Object.entries(dayData).filter(([k])=>clsStudentIds.includes(k)))
    setAttendance(filtered as Record<string,'present'|'absent'>)
  }

  const mark = (sid:string,status:'present'|'absent')=>{
    setAttendance(prev=>{const n={...prev};n[sid]===status?delete n[sid]:n[sid]=status;return n})
  }

  const saveAtt = ()=>{
    if(!Object.keys(attendance).length){toast('İşaretleme yapın','error');return}
    toast('Yoklama kaydedildi ✅','success')
  }

  const absents = clsStudents.filter(s=>attendance[s.id]==='absent')
  const presents = clsStudents.filter(s=>attendance[s.id]==='present')

  const runReport = ()=>{
    const dates = dateRangeDays(rptStart, rptEnd)
    const targetStudents = rptCls
      ? DEMO_STUDENTS.filter(s=>s.classroom_id===rptCls)
      : DEMO_STUDENTS.filter(s=>s.classroom_id)

    const results = targetStudents.map(s=>{
      let present=0, absent=0
      dates.forEach(d=>{
        const st = (DEMO_ATT[d]||{})[s.id]
        if(st==='present') present++
        else if(st==='absent') absent++
      })
      const rate = present+absent>0?Math.round(present/(present+absent)*100):null
      const cls = DEMO_CLASSROOMS.find(c=>c.id===s.classroom_id)
      const teacher = DEMO_TEACHERS.find(t=>t.class_id===s.classroom_id)
      return {...s, present, absent, total:dates.length, rate, className:cls?.name||'—', teacherName:teacher?.full_name||'—'}
    }).filter(s=>s.present+s.absent>0).sort((a,b)=>b.absent-a.absent)
    setRptData(results)
  }

  const warnings = rptData.filter(r=>r.absent>=3)

  // Öğretmen yoklama takibi
  const filteredLogs = DEMO_TEACHER_LOGS.filter(l=>{
    const mt = !tchFilter||l.teacherId===tchFilter
    const md = !tchDateFilter||l.date.startsWith(tchDateFilter)
    return mt&&md
  }).sort((a,b)=>b.date.localeCompare(a.date))

  // Öğretmen yoklama istatistikleri
  const tchStats = DEMO_TEACHERS.map(t=>{
    const logs = DEMO_TEACHER_LOGS.filter(l=>l.teacherId===t.id)
    const girenler = logs.filter(l=>!l.missing).length
    const eksikler = logs.filter(l=>l.missing).length
    const cls = DEMO_CLASSROOMS.find(c=>c.id===t.class_id)
    return {...t, logs, girenler, eksikler, className:cls?.name||'—'}
  })

  return (
    <AdminLayout>
      {/* Tab */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
        {([['gunluk','📋 Günlük Yoklama'],['ogretmen','👨‍🏫 Öğretmen Takibi'],['rapor','📊 Devamsızlık Raporu']] as const).map(([t,label])=>(
          <button key={t} onClick={()=>setTab(t)}
            className={cn('flex-1 py-2 text-xs font-semibold rounded-lg transition-all',tab===t?'bg-white text-gray-900 shadow-sm':'text-gray-400')}>
            {label}
          </button>
        ))}
      </div>

      {/* GÜNLÜK YOKLAMA */}
      {tab==='gunluk' && (
        <div className="space-y-3">
          <Alert variant="info">ℹ️ Öğretmenler kendi panelinden yoklama alır. Yönetici olarak buradan görüntüleyebilir ve düzenleyebilirsiniz.</Alert>
          <div className="flex gap-2 flex-wrap">
            <select value={selCls} onChange={e=>handleClsChange(e.target.value)}
              className="flex-1 min-w-40 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500">
              <option value="">Sınıf seçin...</option>
              {DEMO_CLASSROOMS.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input type="date" value={selDate} onChange={e=>handleDateChange(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"/>
          </div>

          {selCls && clsStudents.length===0 && <EmptyState icon="👥" title="Bu sınıfta öğrenci yok"/>}

          {selCls && clsStudents.length>0 && (
            <>
              <div className="grid grid-cols-3 gap-2">
                {[{l:'Geldi',v:presents.length,c:'text-green-600'},{l:'Gelmedi',v:absents.length,c:'text-red-500'},{l:'Bekliyor',v:clsStudents.length-presents.length-absents.length,c:'text-amber-500'}].map(s=>(
                  <div key={s.l} className="bg-white rounded-xl shadow-sm p-3 text-center">
                    <div className={`text-2xl font-extrabold ${s.c}`}>{s.v}</div>
                    <div className="text-xs text-gray-400 font-semibold mt-0.5">{s.l}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                {clsStudents.map(s=>{
                  const status = attendance[s.id]
                  return (
                    <div key={s.id} className={cn('bg-white rounded-xl shadow-sm border-2 overflow-hidden transition-all',
                      status==='present'?'border-green-300 bg-green-50':status==='absent'?'border-red-300 bg-red-50':'border-gray-100')}>
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className={cn('w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0',
                          s.gender==='erkek'?'bg-blue-100 text-blue-700':'bg-pink-100 text-pink-700')}>
                          {(s.first_name + ' ' + s.last_name).charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-gray-900 truncate">{(s.first_name + ' ' + s.last_name)}</div>
                          <div className="text-xs text-gray-400">{(s.parent_first_name + ' ' + s.parent_last_name)} • {s.parent_phone}</div>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <button onClick={()=>mark(s.id,'present')}
                            className={cn('px-3 py-1.5 rounded-lg text-xs font-bold border-[1.5px] transition-all',status==='present'?'bg-green-500 text-white border-green-500':'border-green-500 text-green-600 bg-white')}>
                            ✓ Geldi
                          </button>
                          <button onClick={()=>mark(s.id,'absent')}
                            className={cn('px-3 py-1.5 rounded-lg text-xs font-bold border-[1.5px] transition-all',status==='absent'?'bg-red-500 text-white border-red-500':'border-red-400 text-red-500 bg-white')}>
                            ✗ Gelmedi
                          </button>
                        </div>
                      </div>
                      {status==='absent' && (
                        <div className="px-4 pb-3 border-t border-red-200">
                          <a href={waLink(s.parent_phone, absenceMessage((s.first_name + ' ' + s.last_name),(s.parent_first_name + ' ' + s.parent_last_name),cls?.name||'',selDate))}
                            target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-[#25D366] text-white text-xs font-semibold rounded-lg">
                            📱 Veliye WhatsApp Bildir
                          </a>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="flex gap-2 pt-1">
                <Button onClick={saveAtt} className="flex-1 justify-center">💾 Kaydet</Button>
                {absents.length>0 && (
                  <button onClick={()=>absents.forEach((s,i)=>setTimeout(()=>window.open(waLink(s.parent_phone,absenceMessage((s.first_name + ' ' + s.last_name),(s.parent_first_name + ' ' + s.parent_last_name),cls?.name||'',selDate)),'_blank'),i*700))}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#25D366] text-white text-sm font-bold rounded-lg">
                    📱 {absents.length} Devamsıza Bildir
                  </button>
                )}
              </div>
            </>
          )}
          {!selCls && <EmptyState icon="✅" title="Sınıf ve tarih seçin"/>}
        </div>
      )}

      {/* ÖĞRETMEN TAKİBİ */}
      {tab==='ogretmen' && (
        <div className="space-y-4">
          {/* Öğretmen istatistik kartları */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tchStats.map(t=>{
              const total = t.girenler + t.eksikler
              const rate = total>0?Math.round(t.girenler/total*100):100
              return (
                <div key={t.id} className={cn('bg-white rounded-xl shadow-sm p-4 border-l-4',
                  t.eksikler>0?'border-amber-400':'border-green-400')}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn('w-10 h-10 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0',
                      t.is_active?'bg-green-500 text-white':'bg-gray-200 text-gray-500')}>
                      {t.full_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-gray-900">{t.full_name}</div>
                      <div className="text-xs text-gray-400">{t.className}</div>
                    </div>
                    <div className="text-right">
                      <div className={cn('text-lg font-extrabold',rate>=80?'text-green-600':rate>=60?'text-amber-500':'text-red-500')}>%{rate}</div>
                      <div className="text-[10px] text-gray-400">Yoklama giriş</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-green-50 rounded-lg p-2">
                      <div className="text-base font-extrabold text-green-600">{t.girenler}</div>
                      <div className="text-[10px] text-gray-400">Girdi</div>
                    </div>
                    <div className={cn('rounded-lg p-2',t.eksikler>0?'bg-red-50':'bg-gray-50')}>
                      <div className={cn('text-base font-extrabold',t.eksikler>0?'text-red-500':'text-gray-400')}>{t.eksikler}</div>
                      <div className="text-[10px] text-gray-400">Girmedi</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="text-base font-extrabold text-gray-700">{t.logs.filter(l=>l.absent>0).length}</div>
                      <div className="text-[10px] text-gray-400">Devamsız var</div>
                    </div>
                  </div>
                  {t.eksikler>0 && (
                    <div className="mt-2 px-2 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 font-semibold">
                      ⚠️ {t.eksikler} günde yoklama girilmemiş
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Detay log tablosu */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
              <div className="text-sm font-bold text-gray-900">Yoklama Giriş Geçmişi</div>
              <div className="flex gap-2">
                <select value={tchFilter} onChange={e=>setTchFilter(e.target.value)}
                  className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-green-500">
                  <option value="">Tüm öğretmenler</option>
                  {DEMO_TEACHERS.map(t=><option key={t.id} value={t.id}>{t.full_name}</option>)}
                </select>
                <input type="month" value={tchDateFilter} onChange={e=>setTchDateFilter(e.target.value)}
                  className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-green-500"/>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Tarih','Öğretmen','Sınıf','Giriş Saati','Yoklama','Devamsız','Durum'].map(h=>(
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-bold text-gray-400 uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((l,i)=>{
                    const teacher = DEMO_TEACHERS.find(t=>t.id===l.teacherId)
                    const cls = DEMO_CLASSROOMS.find(c=>c.id===l.classId)
                    return (
                      <tr key={i} className={cn('border-b border-gray-50 transition-colors',l.missing?'bg-red-50 hover:bg-red-100':'hover:bg-gray-50')}>
                        <td className="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">{l.date}</td>
                        <td className="px-4 py-2.5 font-semibold text-gray-900">{teacher?.full_name||'—'}</td>
                        <td className="px-4 py-2.5 text-gray-600">{cls?.name||'—'}</td>
                        <td className="px-4 py-2.5 text-xs font-mono text-gray-500">{l.enteredAt}</td>
                        <td className="px-4 py-2.5">
                          {l.missing?<span className="text-red-400 font-semibold text-xs">Girilmedi</span>:<span className="text-green-600 font-semibold text-xs">{l.count} öğrenci</span>}
                        </td>
                        <td className="px-4 py-2.5">
                          {l.absent>0?<span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full">{l.absent} kişi</span>:<span className="text-gray-400 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold',l.missing?'bg-red-100 text-red-600':l.absent>0?'bg-amber-100 text-amber-700':'bg-green-100 text-green-700')}>
                            {l.missing?'⛔ Eksik':l.absent>0?'⚠️ Devamsız var':'✅ Tamam'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* DEVAMSIZLIK RAPORU */}
      {tab==='rapor' && (
        <div className="space-y-3">
          <Card>
            <CardHeader><CardTitle>📊 Tarih Aralığı Devamsızlık Raporu</CardTitle></CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Başlangıç</label>
                  <input type="date" value={rptStart} onChange={e=>setRptStart(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Bitiş</label>
                  <input type="date" value={rptEnd} onChange={e=>setRptEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"/>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <select value={rptCls} onChange={e=>setRptCls(e.target.value)}
                  className="flex-1 min-w-40 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none">
                  <option value="">Tüm sınıflar</option>
                  {DEMO_CLASSROOMS.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <Button onClick={runReport}>Raporu Oluştur</Button>
                {rptData.length>0 && (
                  <button onClick={()=>{
                    const exportData = rptData.flatMap(r=>
                      dateRangeDays(rptStart,rptEnd).map(d=>({
                        date:d, studentName:(r.first_name + ' ' + r.last_name), className:r.className,
                        teacherName:r.teacherName,
                        status:(DEMO_ATT[d]||{})[r.id]||'—',
                        rate:r.rate+'%'
                      }))
                    )
                    exportAttXLSX(exportData,`devam-raporu-${rptStart}-${rptEnd}`)
                    toast('Excel indiriliyor ⬇️','success')
                  }} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-lg">
                    ⬇ Excel İndir
                  </button>
                )}
              </div>
            </CardBody>
          </Card>

          {rptData.length>0 && (
            <>
              {warnings.length>0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>⚠️ 3+ Gün Devamsız — {warnings.length} Öğrenci</CardTitle>
                    <button onClick={()=>warnings.forEach((w,i)=>{
                      const msg=`Sayın ${(w.parent_first_name + ' ' + w.parent_last_name)} 👋\n\n${(w.first_name + ' ' + w.last_name)} adlı öğrenciniz ${rptStart}-${rptEnd} tarihleri arasında *${w.absent} gün* eğitime katılmamıştır.\n\nLütfen kontrol ediniz 🌿`
                      setTimeout(()=>window.open(waLink(w.parent_phone,msg),'_blank'),i*700)
                    })} className="px-3 py-1.5 bg-[#25D366] text-white text-xs font-bold rounded-lg">
                      📱 Hepsine WA
                    </button>
                  </CardHeader>
                  <CardBody className="space-y-2">
                    {warnings.map(w=>{
                      const msg=`Sayın ${(w.parent_first_name + ' ' + w.parent_last_name)} 👋\n\n${(w.first_name + ' ' + w.last_name)} adlı öğrenciniz ${rptStart}-${rptEnd} tarihleri arasında *${w.absent} gün* eğitime katılmamıştır.\n\nSaygılarımızla 🌿`
                      return (
                        <div key={w.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                          <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',w.gender==='erkek'?'bg-blue-100 text-blue-700':'bg-pink-100 text-pink-700')}>{(w.first_name + ' ' + w.last_name).charAt(0)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold truncate">{(w.first_name + ' ' + w.last_name)}</div>
                            <div className="text-xs text-gray-400">{w.className} • {w.teacherName}</div>
                          </div>
                          <Badge variant="red">{w.absent} gün</Badge>
                          <a href={waLink(w.parent_phone,msg)} target="_blank" rel="noreferrer"
                            className="px-2 py-1 bg-[#25D366] text-white text-xs font-semibold rounded-lg">📱</a>
                        </div>
                      )
                    })}
                  </CardBody>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>📋 {rptStart} — {rptEnd}</CardTitle>
                  <span className="text-xs text-gray-400">{rptData.length} öğrenci</span>
                </CardHeader>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Öğrenci','Sınıf','Öğretmen','Geldi','Gelmedi','Oran',''].map(h=>(
                          <th key={h} className="text-left px-4 py-2.5 text-xs font-bold text-gray-400 uppercase whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rptData.map(r=>{
                        const msg=`Sayın ${(r.parent_first_name + ' ' + r.parent_last_name)} 👋\n\n${(r.first_name + ' ' + r.last_name)} adlı öğrenciniz ${rptStart}-${rptEnd} tarihleri arasında *${r.absent} gün* eğitime katılmamıştır.\n\nSaygılarımızla 🌿`
                        return (
                          <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="px-4 py-2.5">
                              <div className="font-semibold">{(r.first_name + ' ' + r.last_name)}</div>
                              <div className="text-xs text-gray-400">{(r.parent_first_name + ' ' + r.parent_last_name)}</div>
                            </td>
                            <td className="px-4 py-2.5 text-xs text-gray-500">{r.className}</td>
                            <td className="px-4 py-2.5 text-xs text-gray-500">{r.teacherName}</td>
                            <td className="px-4 py-2.5 font-bold text-green-600">{r.present}</td>
                            <td className="px-4 py-2.5 font-bold text-red-500">{r.absent}</td>
                            <td className="px-4 py-2.5">
                              {r.rate!==null&&<Badge variant={r.rate>=80?'green':r.rate>=60?'amber':'red'}>%{r.rate}</Badge>}
                            </td>
                            <td className="px-4 py-2.5">
                              <a href={waLink(r.parent_phone,msg)} target="_blank" rel="noreferrer"
                                className="px-2 py-1 bg-[#25D366] text-white text-xs font-semibold rounded-lg">📱</a>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
          {rptData.length===0&&<EmptyState icon="📊" title="Rapor oluşturun" subtitle="Tarih aralığı seçip Raporu Oluştur'a tıklayın"/>}
        </div>
      )}
    </AdminLayout>
  )
}
