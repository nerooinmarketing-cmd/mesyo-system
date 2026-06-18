import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Card, CardHeader, CardTitle, CardBody, Button, Badge, Alert, useToast, EmptyState } from '@/components/ui'
import { waLink, absenceMessage, dateRangeDays, cn, todayISO } from '@/lib/utils'
import { classroomsApi, studentsApi, attendanceApi } from '@/lib/api'
import * as XLSX from 'xlsx'

type Tab = 'gunluk' | 'ogretmen' | 'rapor'

function exportAttXLSX(data: any[], filename: string) {
  const rows = data.map(r=>({
    'Tarih':r.date,'Öğrenci':r.studentName,'Sınıf':r.className,
    'Durum':r.status==='present'?'Geldi':r.status==='absent'?'Gelmedi':'—',
    'Devam %':r.rate!==null?r.rate+'%':'—'
  }))
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [{wch:12},{wch:22},{wch:18},{wch:10},{wch:10}]
  XLSX.utils.book_append_sheet(wb,ws,'Devam Raporu')
  XLSX.writeFile(wb,filename+'.xlsx')
}

export default function AttendancePage() {
  const {toast} = useToast()
  const [tab, setTab] = useState<Tab>('gunluk')

  const [classrooms, setClassrooms] = useState<any[]>([])
  const [loadingClassrooms, setLoadingClassrooms] = useState(true)

  const [selCls, setSelCls] = useState('')
  const [selDate, setSelDate] = useState(todayISO())
  const [clsStudents, setClsStudents] = useState<any[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [attendance, setAttendance] = useState<Record<string,'present'|'absent'>>({})
  const [saving, setSaving] = useState(false)

  // Rapor
  const [rptStart, setRptStart] = useState(()=>{const d=new Date();d.setDate(d.getDate()-7);return d.toISOString().split('T')[0]})
  const [rptEnd, setRptEnd] = useState(todayISO())
  const [rptCls, setRptCls] = useState('')
  const [rptData, setRptData] = useState<any[]>([])
  const [rptLoading, setRptLoading] = useState(false)

  // Öğretmen takibi
  const [tchLogs, setTchLogs] = useState<any[]>([])
  const [tchLoading, setTchLoading] = useState(false)
  const [tchDateFilter, setTchDateFilter] = useState('')

  useEffect(() => {
    classroomsApi.list().then(setClassrooms).catch(() => {}).finally(() => setLoadingClassrooms(false))
  }, [])

  useEffect(() => {
    if (tab === 'ogretmen') loadTeacherLog()
  }, [tab])

  const loadTeacherLog = async () => {
    setTchLoading(true)
    try {
      const start = (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0] })()
      const logs = await attendanceApi.teacherLog(start, todayISO())
      setTchLogs(logs)
    } catch (e: any) {
      toast(e.message || 'Yoklama geçmişi yüklenemedi', 'error')
    } finally {
      setTchLoading(false)
    }
  }

  const handleClsChange = async (cid: string) => {
    setSelCls(cid)
    setAttendance({})
    if (!cid) { setClsStudents([]); return }
    setLoadingStudents(true)
    try {
      const [students, existing] = await Promise.all([
        studentsApi.list({ classroom_id: cid, status: 'approved' }),
        attendanceApi.getByDate(cid, selDate),
      ])
      setClsStudents(students)
      const map: Record<string,'present'|'absent'> = {}
      existing.forEach((r: any) => { if (r.status === 'present' || r.status === 'absent') map[r.student_id] = r.status })
      setAttendance(map)
    } catch (e: any) {
      toast(e.message || 'Öğrenciler yüklenemedi', 'error')
    } finally {
      setLoadingStudents(false)
    }
  }

  const handleDateChange = async (date: string) => {
    setSelDate(date)
    if (!selCls) return
    try {
      const existing = await attendanceApi.getByDate(selCls, date)
      const map: Record<string,'present'|'absent'> = {}
      existing.forEach((r: any) => { if (r.status === 'present' || r.status === 'absent') map[r.student_id] = r.status })
      setAttendance(map)
    } catch (e: any) {
      toast(e.message || 'Yoklama yüklenemedi', 'error')
    }
  }

  const mark = (sid:string,status:'present'|'absent')=>{
    setAttendance(prev=>{const n={...prev};n[sid]===status?delete n[sid]:n[sid]=status;return n})
  }

  const saveAtt = async () => {
    if(!Object.keys(attendance).length){toast('İşaretleme yapın','error');return}
    setSaving(true)
    try {
      const entries = Object.entries(attendance).map(([student_id, status]) => ({ student_id, status }))
      await attendanceApi.save(selCls, selDate, entries)
      toast('Yoklama kaydedildi ✅','success')
    } catch (e: any) {
      toast(e.message || 'Kaydetme başarısız oldu', 'error')
    } finally {
      setSaving(false)
    }
  }

  const cls = classrooms.find(c=>c.id===selCls)
  const absents = clsStudents.filter(s=>attendance[s.id]==='absent')
  const presents = clsStudents.filter(s=>attendance[s.id]==='present')

  const runReport = async () => {
    setRptLoading(true)
    try {
      const targetClassrooms = rptCls ? classrooms.filter(c => c.id === rptCls) : classrooms
      const dates = dateRangeDays(rptStart, rptEnd)
      const allResults: any[] = []

      for (const c of targetClassrooms) {
        const [students, records] = await Promise.all([
          studentsApi.list({ classroom_id: c.id, status: 'approved' }),
          attendanceApi.getReport(c.id, rptStart, rptEnd),
        ])
        const byStudent: Record<string, any[]> = {}
        records.forEach((r: any) => { (byStudent[r.student_id] ||= []).push(r) })

        students.forEach((s: any) => {
          const recs = byStudent[s.id] || []
          const present = recs.filter(r => r.status === 'present').length
          const absent = recs.filter(r => r.status === 'absent').length
          const rate = present + absent > 0 ? Math.round(present / (present + absent) * 100) : null
          if (present + absent > 0) {
            allResults.push({ ...s, present, absent, total: dates.length, rate, className: c.name, records: recs })
          }
        })
      }
      allResults.sort((a, b) => b.absent - a.absent)
      setRptData(allResults)
    } catch (e: any) {
      toast(e.message || 'Rapor oluşturulamadı', 'error')
    } finally {
      setRptLoading(false)
    }
  }

  const warnings = rptData.filter(r=>r.absent>=3)

  const filteredTchLogs = tchLogs.filter(l => !tchDateFilter || l.date.startsWith(tchDateFilter))

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
            <select value={selCls} onChange={e=>handleClsChange(e.target.value)} disabled={loadingClassrooms}
              className="flex-1 min-w-40 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500">
              <option value="">{loadingClassrooms ? 'Yükleniyor...' : 'Sınıf seçin...'}</option>
              {classrooms.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input type="date" value={selDate} onChange={e=>handleDateChange(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"/>
          </div>

          {selCls && loadingStudents && (
            <div className="text-center py-12 text-gray-400">
              <div className="text-3xl mb-2 animate-pulse">⏳</div>
              <p className="text-sm">Yükleniyor...</p>
            </div>
          )}

          {selCls && !loadingStudents && clsStudents.length===0 && <EmptyState icon="👥" title="Bu sınıfta öğrenci yok"/>}

          {selCls && !loadingStudents && clsStudents.length>0 && (
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
                  const fullName = `${s.first_name} ${s.last_name}`
                  const parentName = `${s.parent_first_name} ${s.parent_last_name}`
                  return (
                    <div key={s.id} className={cn('bg-white rounded-xl shadow-sm border-2 overflow-hidden transition-all',
                      status==='present'?'border-green-300 bg-green-50':status==='absent'?'border-red-300 bg-red-50':'border-gray-100')}>
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className={cn('w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0',
                          s.gender==='erkek'?'bg-blue-100 text-blue-700':'bg-pink-100 text-pink-700')}>
                          {fullName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-gray-900 truncate">{fullName}</div>
                          <div className="text-xs text-gray-400">{parentName} • {s.parent_phone}</div>
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
                          <a href={waLink(s.parent_phone, absenceMessage(fullName,parentName,cls?.name||'',selDate))}
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
                <Button onClick={saveAtt} disabled={saving} className="flex-1 justify-center">{saving ? '⏳ Kaydediliyor...' : '💾 Kaydet'}</Button>
                {absents.length>0 && (
                  <button onClick={()=>absents.forEach((s,i)=>{
                    const fullName = `${s.first_name} ${s.last_name}`
                    const parentName = `${s.parent_first_name} ${s.parent_last_name}`
                    setTimeout(()=>window.open(waLink(s.parent_phone,absenceMessage(fullName,parentName,cls?.name||'',selDate)),'_blank'),i*700)
                  })}
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
          {tchLoading ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-3xl mb-2 animate-pulse">⏳</div>
              <p className="text-sm">Yükleniyor...</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
                <div className="text-sm font-bold text-gray-900">Yoklama Giriş Geçmişi (son 30 gün)</div>
                <input type="month" value={tchDateFilter} onChange={e=>setTchDateFilter(e.target.value)}
                  className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-green-500"/>
              </div>
              {filteredTchLogs.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-3xl mb-2">📋</div>
                  <p className="text-sm">Bu aralıkta yoklama kaydı yok</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Tarih','Öğretmen','Sınıf','Yoklama','Devamsız'].map(h=>(
                          <th key={h} className="text-left px-4 py-2.5 text-xs font-bold text-gray-400 uppercase whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTchLogs.map((l,i)=>(
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">{l.date}</td>
                          <td className="px-4 py-2.5 font-semibold text-gray-900">{l.teacher_name}</td>
                          <td className="px-4 py-2.5 text-gray-600">{l.classroom_name}</td>
                          <td className="px-4 py-2.5"><span className="text-green-600 font-semibold text-xs">{l.count} öğrenci</span></td>
                          <td className="px-4 py-2.5">
                            {l.absent>0?<span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full">{l.absent} kişi</span>:<span className="text-gray-400 text-xs">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
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
                  {classrooms.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <Button onClick={runReport} disabled={rptLoading}>{rptLoading ? '⏳ Oluşturuluyor...' : 'Raporu Oluştur'}</Button>
                {rptData.length>0 && (
                  <button onClick={()=>{
                    const exportData = rptData.flatMap(r=>
                      dateRangeDays(rptStart,rptEnd).map(d=>{
                        const rec = r.records.find((x: any) => x.date === d)
                        return {
                          date:d, studentName:`${r.first_name} ${r.last_name}`, className:r.className,
                          status: rec?.status || '—',
                          rate:r.rate
                        }
                      })
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
                      const msg=`Sayın ${w.parent_first_name} ${w.parent_last_name} 👋\n\n${w.first_name} ${w.last_name} adlı öğrenciniz ${rptStart}-${rptEnd} tarihleri arasında *${w.absent} gün* eğitime katılmamıştır.\n\nLütfen kontrol ediniz 🌿`
                      setTimeout(()=>window.open(waLink(w.parent_phone,msg),'_blank'),i*700)
                    })} className="px-3 py-1.5 bg-[#25D366] text-white text-xs font-bold rounded-lg">
                      📱 Hepsine WA
                    </button>
                  </CardHeader>
                  <CardBody className="space-y-2">
                    {warnings.map(w=>{
                      const fullName = `${w.first_name} ${w.last_name}`
                      const msg=`Sayın ${w.parent_first_name} ${w.parent_last_name} 👋\n\n${fullName} adlı öğrenciniz ${rptStart}-${rptEnd} tarihleri arasında *${w.absent} gün* eğitime katılmamıştır.\n\nSaygılarımızla 🌿`
                      return (
                        <div key={w.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                          <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',w.gender==='erkek'?'bg-blue-100 text-blue-700':'bg-pink-100 text-pink-700')}>{fullName.charAt(0)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold truncate">{fullName}</div>
                            <div className="text-xs text-gray-400">{w.className}</div>
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
                        {['Öğrenci','Sınıf','Geldi','Gelmedi','Oran',''].map(h=>(
                          <th key={h} className="text-left px-4 py-2.5 text-xs font-bold text-gray-400 uppercase whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rptData.map(r=>{
                        const fullName = `${r.first_name} ${r.last_name}`
                        const msg=`Sayın ${r.parent_first_name} ${r.parent_last_name} 👋\n\n${fullName} adlı öğrenciniz ${rptStart}-${rptEnd} tarihleri arasında *${r.absent} gün* eğitime katılmamıştır.\n\nSaygılarımızla 🌿`
                        return (
                          <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="px-4 py-2.5">
                              <div className="font-semibold">{fullName}</div>
                              <div className="text-xs text-gray-400">{r.parent_first_name} {r.parent_last_name}</div>
                            </td>
                            <td className="px-4 py-2.5 text-xs text-gray-500">{r.className}</td>
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
