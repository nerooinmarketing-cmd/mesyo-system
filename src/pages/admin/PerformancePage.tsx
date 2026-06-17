import { useState } from 'react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Badge, Button, useToast, Select } from '@/components/ui'
import { DEMO_STUDENTS, DEMO_CLASSROOMS } from '@/lib/demo-data'

const LEVELS = [
  { id:'baslamadi', label:'Başlamadı', color:'bg-gray-100 text-gray-500', icon:'⬜' },
  { id:'baslangic', label:'Başlangıç', color:'bg-red-100 text-red-600', icon:'🔴' },
  { id:'orta', label:'Orta', color:'bg-amber-100 text-amber-700', icon:'🟡' },
  { id:'iyi', label:'İyi', color:'bg-blue-100 text-blue-700', icon:'🔵' },
  { id:'mukemmel', label:'Mükemmel', color:'bg-green-100 text-green-700', icon:'🟢' },
]

const SKILLS = [
  'Fatiha Suresi', 'Felak Suresi', 'Nas Suresi', 'İhlas Suresi', 'Kevser Suresi',
  'Asr Suresi', 'Fil Suresi', 'Kuran Okuma', 'Namaz Bilgisi', 'Dua Bilgisi',
]

export default function PerformancePage() {
  const { toast } = useToast()
  const [selCls, setSelCls] = useState(DEMO_CLASSROOMS[0]?.id||'')
  const [perf, setPerf] = useState<Record<string,Record<string,string>>>({})

  const students = DEMO_STUDENTS.filter(s=>s.classroom_id===selCls)
  const cls = DEMO_CLASSROOMS.find(c=>c.id===selCls)

  const setLevel = (studentId:string, skill:string, level:string) => {
    setPerf(p=>({...p,[studentId]:{...(p[studentId]||{}),[skill]:level}}))
  }

  const getLevel = (studentId:string, skill:string) => perf[studentId]?.[skill]||'baslamadi'

  const save = () => toast('Performans kaydedildi ✅','success')

  return (
    <AdminLayout>
      <div className="flex gap-3 items-center mb-4 flex-wrap">
        <select value={selCls} onChange={e=>setSelCls(e.target.value)}
          className="flex-1 min-w-40 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500 bg-white">
          {DEMO_CLASSROOMS.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <Button onClick={save}>💾 Kaydet</Button>
      </div>

      {/* Seviye açıklaması */}
      <div className="flex gap-2 flex-wrap mb-4">
        {LEVELS.map(l=>(
          <span key={l.id} className={`px-2.5 py-1 rounded-full text-xs font-semibold ${l.color}`}>{l.icon} {l.label}</span>
        ))}
      </div>

      {students.length===0
        ? <div className="text-center py-12 bg-white rounded-xl shadow-sm text-gray-400 text-sm">Bu sınıfta öğrenci yok</div>
        : <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-400 uppercase sticky left-0 bg-gray-50 w-36">Öğrenci</th>
                    {SKILLS.map(s=>(
                      <th key={s} className="px-2 py-2.5 text-[10px] font-bold text-gray-400 text-center whitespace-nowrap">{s}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map(student=>(
                    <tr key={student.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-2 sticky left-0 bg-white">
                        <div className="text-xs font-semibold text-gray-900 truncate w-28">{(student.first_name + ' ' + student.last_name).split(' ')[0]}</div>
                      </td>
                      {SKILLS.map(skill=>{
                        const lvl = getLevel(student.id, skill)
                        const conf = LEVELS.find(l=>l.id===lvl)
                        return (
                          <td key={skill} className="px-1 py-2 text-center">
                            <select value={lvl} onChange={e=>setLevel(student.id,skill,e.target.value)}
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
