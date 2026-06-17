import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Button, useToast, Alert } from '@/components/ui'
import { classroomsApi, studentsApi, skillsApi, seasonsApi } from '@/lib/api'

const LEVELS = [
  { id:'baslamadi', label:'Başlamadı', color:'bg-gray-100 text-gray-500', icon:'⬜' },
  { id:'basladi', label:'Başladı', color:'bg-red-100 text-red-600', icon:'🔴' },
  { id:'gelisiyor', label:'Gelişiyor', color:'bg-amber-100 text-amber-700', icon:'🟡' },
  { id:'iyi', label:'İyi', color:'bg-blue-100 text-blue-700', icon:'🔵' },
  { id:'mukemmel', label:'Mükemmel', color:'bg-green-100 text-green-700', icon:'🟢' },
]

export default function PerformancePage() {
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [classrooms, setClassrooms] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [skills, setSkills] = useState<{id:string;name:string}[]>([])
  const [selCls, setSelCls] = useState('')
  const [perf, setPerf] = useState<Record<string,Record<string,string>>>({})
  const [dirty, setDirty] = useState<Set<string>>(new Set()) // "studentId:skillId" formatında değişen hücreler
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setLoadError('')
      try {
        const seasonList = await seasonsApi.list()
        const activeSeason = seasonList.find((s: any) => s.is_active) || seasonList[0]
        const seasonId = activeSeason?.id

        const [clsList, stdList, skillList] = await Promise.all([
          classroomsApi.list(seasonId || undefined),
          studentsApi.list({ season_id: seasonId || undefined }),
          skillsApi.list(),
        ])
        if (cancelled) return
        setClassrooms(clsList)
        setStudents(stdList)
        setSkills(skillList)
        if (clsList.length) setSelCls(clsList[0].id)
      } catch (e: any) {
        if (!cancelled) setLoadError(e.message || 'Veriler yüklenirken bir hata oluştu')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Sınıf değişince o sınıfın mevcut seviyelerini çek
  useEffect(() => {
    if (!selCls) return
    let cancelled = false
    skillsApi.classroomLevels(selCls).then(levels => {
      if (!cancelled) { setPerf(levels); setDirty(new Set()) }
    }).catch(() => {})
    return () => { cancelled = true }
  }, [selCls])

  const clsStudents = students.filter(s=>s.classroom_id===selCls)

  const setLevel = (studentId:string, skillId:string, level:string) => {
    setPerf(p=>({...p,[studentId]:{...(p[studentId]||{}),[skillId]:level}}))
    setDirty(p => new Set(p).add(`${studentId}:${skillId}`))
  }

  const getLevel = (studentId:string, skillId:string) => perf[studentId]?.[skillId]||'baslamadi'

  const save = async () => {
    if (dirty.size === 0) { toast('Değişiklik yok','info'); return }
    setSaving(true)
    try {
      const updates = Array.from(dirty).map(key => {
        const [student_id, skill_id] = key.split(':')
        return { student_id, skill_id, level: perf[student_id][skill_id] }
      })
      await skillsApi.updateLevels(updates)
      setDirty(new Set())
      toast('Performans kaydedildi ✅','success')
    } catch (e: any) {
      toast(e.message || 'Kaydetme başarısız oldu', 'error')
    } finally {
      setSaving(false)
    }
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
    <AdminLayout>
      <div className="flex gap-3 items-center mb-4 flex-wrap">
        <select value={selCls} onChange={e=>setSelCls(e.target.value)}
          className="flex-1 min-w-40 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500 bg-white">
          {classrooms.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <Button onClick={save} loading={saving}>💾 Kaydet{dirty.size > 0 ? ` (${dirty.size})` : ''}</Button>
      </div>

      {/* Seviye açıklaması */}
      <div className="flex gap-2 flex-wrap mb-4">
        {LEVELS.map(l=>(
          <span key={l.id} className={`px-2.5 py-1 rounded-full text-xs font-semibold ${l.color}`}>{l.icon} {l.label}</span>
        ))}
      </div>

      {clsStudents.length===0
        ? <div className="text-center py-12 bg-white rounded-xl shadow-sm text-gray-400 text-sm">Bu sınıfta öğrenci yok</div>
        : <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-400 uppercase sticky left-0 bg-gray-50 w-36">Öğrenci</th>
                    {skills.map(s=>(
                      <th key={s.id} className="px-2 py-2.5 text-[10px] font-bold text-gray-400 text-center whitespace-nowrap">{s.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clsStudents.map(student=>(
                    <tr key={student.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-2 sticky left-0 bg-white">
                        <div className="text-xs font-semibold text-gray-900 truncate w-28">{(student.first_name + ' ' + student.last_name).split(' ')[0]}</div>
                      </td>
                      {skills.map(skill=>{
                        const lvl = getLevel(student.id, skill.id)
                        const conf = LEVELS.find(l=>l.id===lvl)
                        return (
                          <td key={skill.id} className="px-1 py-2 text-center">
                            <select value={lvl} onChange={e=>setLevel(student.id,skill.id,e.target.value)}
                              className={`w-20 px-1 py-1 rounded text-[10px] font-semibold border-0 outline-none cursor-pointer ${conf?.color}`}>
                              {LEVELS.map(l=><option key={l.id} value={l.id}>{l.icon} {l.label}</option>)}
                            </select>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
      }
    </AdminLayout>
  )
}
