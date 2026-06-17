import { useState } from 'react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Button, useToast } from '@/components/ui'
import { DEMO_STUDENTS, DEMO_CLASSROOMS } from '@/lib/demo-data'
import { waLink, assignmentMessage } from '@/lib/utils'

interface Assignment {
  id: number; title: string; description: string
  classId: string; dueDate: string; createdAt: string; sentCount: number
}

const DEMO_ASSIGNMENTS: Assignment[] = [
  {id:1, title:'Fatiha Suresi Tekrarı', description:'Fatiha suresini akıcı okuma çalışması yapılacak.', classId:'c1', dueDate:'2026-06-20', createdAt:'2026-06-14', sentCount:5},
  {id:2, title:'Namaz Duaları',         description:'Sübhaneke ve Ettehiyyatü dualarını ezberle.',    classId:'c1', dueDate:'2026-06-16', createdAt:'2026-06-10', sentCount:5},
]

export default function AssignmentsPage() {
  const { toast } = useToast()
  const [assignments, setAssignments] = useState<Assignment[]>(DEMO_ASSIGNMENTS)
  const [selCls, setSelCls] = useState(DEMO_CLASSROOMS[0]?.id || '')
  const [selStudents, setSelStudents] = useState<string[]>([])
  const [toAll, setToAll] = useState(true)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [sending, setSending] = useState(false)
  const [sentIdx, setSentIdx] = useState(0)
  const [tab, setTab] = useState<'gonder'|'gecmis'>('gonder')

  const cls = DEMO_CLASSROOMS.find(c => c.id === selCls)
  const clsStudents = DEMO_STUDENTS.filter(s => s.classroom_id === selCls && s.status === 'approved')
  const targets = toAll ? clsStudents : clsStudents.filter(s => selStudents.includes(s.id))

  const toggleSel = (id: string) => setSelStudents(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  const send = async () => {
    if (!title.trim() || !desc.trim()) { toast('Başlık ve açıklama zorunlu', 'error'); return }
    if (!targets.length) { toast('Hedef öğrenci seçin', 'error'); return }
    setSending(true); setSentIdx(0)
    targets.forEach((s, i) => {
      setTimeout(() => {
        window.open(waLink(s.parent_phone, assignmentMessage((s.first_name + ' ' + s.last_name), (s.parent_first_name + ' ' + s.parent_last_name), cls?.name || '', title, desc, dueDate || undefined)), '_blank')
        setSentIdx(i + 1)
      }, i * 700)
    })
    await new Promise(r => setTimeout(r, targets.length * 700 + 500))
    setAssignments(p => [{
      id: Date.now(), title, description: desc, classId: selCls,
      dueDate: dueDate || '', createdAt: new Date().toISOString().split('T')[0], sentCount: targets.length
    }, ...p])
    toast(`📱 ${targets.length} veliye ödev gönderildi!`, 'success')
    setSending(false); setTitle(''); setDesc(''); setDueDate(''); setSelStudents([])
  }

  const sendSingle = (s: typeof clsStudents[0]) => {
    if (!title.trim() || !desc.trim()) { toast('Önce başlık ve açıklama yazın', 'error'); return }
    window.open(waLink(s.parent_phone, assignmentMessage((s.first_name + ' ' + s.last_name), (s.parent_first_name + ' ' + s.parent_last_name), cls?.name || '', title, desc, dueDate || undefined)), '_blank')
    toast(`${(s.first_name + ' ' + s.last_name)} için ödev gönderildi 📱`, 'success')
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Tab */}
        <div className="flex bg-gray-100 rounded-xl p-1">
          {([['gonder','📚 Ödev Gönder'],['gecmis','📋 Geçmiş']] as const).map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${tab===t?'bg-white text-gray-900 shadow-sm':'text-gray-400'}`}>
              {l}
            </button>
          ))}
        </div>

        {tab === 'gonder' && (
          <div className="space-y-3">
            {/* Ödev detayları */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="text-sm font-bold text-gray-900 mb-3">📝 Ödev Bilgileri</div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Ödev Başlığı *</label>
                  <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="örn: Fatiha Suresi Tekrarı"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Açıklama *</label>
                  <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={3}
                    placeholder="Ödev detaylarını yazın..."
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500 resize-none"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Teslim Tarihi (opsiyonel)</label>
                  <input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"/>
                </div>
              </div>
            </div>

            {/* Hedef seçimi */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="text-sm font-bold text-gray-900 mb-3">🎯 Kime Gönderilecek?</div>

              {/* Sınıf seçimi */}
              <div className="mb-3">
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Sınıf</label>
                <select value={selCls} onChange={e=>{setSelCls(e.target.value);setSelStudents([])}}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500">
                  {DEMO_CLASSROOMS.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Tümü / Seç */}
              <div className="flex gap-2 mb-3">
                <button onClick={()=>{setToAll(true);setSelStudents([])}}
                  className={`flex-1 py-2 rounded-xl border-2 text-xs font-bold transition-all ${toAll?'border-green-500 bg-green-50 text-green-700':'border-gray-200 text-gray-500'}`}>
                  👥 Tüm Sınıf ({clsStudents.length})
                </button>
                <button onClick={()=>setToAll(false)}
                  className={`flex-1 py-2 rounded-xl border-2 text-xs font-bold transition-all ${!toAll?'border-green-500 bg-green-50 text-green-700':'border-gray-200 text-gray-500'}`}>
                  🎯 Seç
                </button>
              </div>

              {!toAll && (
                <div className="space-y-1.5 mb-3 max-h-48 overflow-y-auto">
                  {clsStudents.map(s=>(
                    <label key={s.id} className={`flex items-center gap-3 px-3 py-2 rounded-xl border cursor-pointer transition-all ${selStudents.includes(s.id)?'border-green-400 bg-green-50':'border-gray-200 hover:bg-gray-50'}`}>
                      <input type="checkbox" checked={selStudents.includes(s.id)} onChange={()=>toggleSel(s.id)}
                        className="w-4 h-4 accent-green-500"/>
                      <span className="text-sm font-semibold text-gray-800">{(s.first_name + ' ' + s.last_name)}</span>
                      <span className="text-xs text-gray-400 ml-auto">{(s.parent_first_name + ' ' + s.parent_last_name)}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Özet */}
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-3 flex items-center justify-between">
                <div className="text-xs font-bold text-green-700">{targets.length} veliye gönderilecek</div>
                <div className="text-xl font-extrabold text-green-600">{targets.length}</div>
              </div>

              <Button onClick={send} loading={sending} className="w-full justify-center">
                {sending ? `📱 ${sentIdx}/${targets.length} Gönderiliyor...` : `📱 Tümüne Gönder (${targets.length})`}
              </Button>
            </div>

            {/* Tek tek gönder */}
            {clsStudents.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 text-sm font-bold text-gray-900">Tek Tek Gönder</div>
                {clsStudents.map(s=>(
                  <div key={s.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 last:border-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${s.gender==='erkek'?'bg-blue-100 text-blue-700':'bg-pink-100 text-pink-700'}`}>
                      {(s.first_name + ' ' + s.last_name).charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">{(s.first_name + ' ' + s.last_name)}</div>
                      <div className="text-xs text-gray-400">{(s.parent_first_name + ' ' + s.parent_last_name)}</div>
                    </div>
                    <button onClick={()=>sendSingle(s)}
                      className="px-3 py-1.5 bg-[#25D366] text-white text-xs font-semibold rounded-lg hover:bg-[#128C7E] transition-colors">
                      📱 Gönder
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'gecmis' && (
          <div className="space-y-2">
            {assignments.length === 0
              ? <div className="text-center py-12 bg-white rounded-xl shadow-sm text-gray-400"><div className="text-3xl mb-2">📚</div><p className="text-sm">Henüz ödev gönderilmedi</p></div>
              : assignments.map(a=>{
                  const cls = DEMO_CLASSROOMS.find(c=>c.id===a.classId)
                  return (
                    <div key={a.id} className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-amber-400">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="text-sm font-bold text-gray-900">{a.title}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{a.description}</div>
                          <div className="flex gap-2 mt-1.5 flex-wrap">
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">{cls?.name}</span>
                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">{a.sentCount} kişi</span>
                            {a.dueDate && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">⏰ {a.dueDate}</span>}
                            <span className="text-[10px] text-gray-400">{a.createdAt}</span>
                          </div>
                        </div>
                        <button onClick={()=>setAssignments(p=>p.filter(x=>x.id!==a.id))}
                          className="text-gray-300 hover:text-red-400 text-xl leading-none flex-shrink-0">×</button>
                      </div>
                    </div>
                  )
                })
            }
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
