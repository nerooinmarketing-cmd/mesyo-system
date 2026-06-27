import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { useToast } from '@/components/ui'
import { classroomsApi } from '@/lib/api'

const token = () => localStorage.getItem('mesyo_token') || ''
const api = (url: string, opts?: RequestInit) =>
  fetch(`/api${url}`, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}`, ...(opts?.headers || {}) } })

const PERIOD_LABELS: Record<string, string> = { daily: '📅 Günlük', weekly: '📆 Haftalık', monthly: '🗓️ Aylık' }
const PERIOD_COLORS: Record<string, string> = { daily: 'bg-blue-100 text-blue-700', weekly: 'bg-green-100 text-green-700', monthly: 'bg-purple-100 text-purple-700' }

export default function CurriculumPage() {
  const { toast } = useToast()
  const [tab, setTab] = useState<'topics' | 'assignments' | 'reports'>('topics')
  const [classrooms, setClassrooms] = useState<any[]>([])
  const [selCls, setSelCls] = useState('')
  const [topics, setTopics] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [completions, setCompletions] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(false)

  // Modaller
  const [topicModal, setTopicModal] = useState(false)
  const [editTopic, setEditTopic] = useState<any>(null)
  const [topicForm, setTopicForm] = useState({ title: '', description: '', period_type: 'weekly', classroom_id: '' })

  const [assignModal, setAssignModal] = useState(false)
  const [assignForm, setAssignForm] = useState({ topic_id: '', title: '', description: '', due_date: '', classroom_id: '' })

  const [reportModal, setReportModal] = useState(false)
  const [reportStudent, setReportStudent] = useState<any>(null)
  const [reportForm, setReportForm] = useState({ week_start: '', week_end: '', teacher_comment: '', focus_areas: '' })

  const [selAssignment, setSelAssignment] = useState<any>(null)

  useEffect(() => {
    classroomsApi.list().then(setClassrooms).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selCls) return
    loadTopics()
    loadAssignments()
    loadReports()
    api(`/students?classroom_id=${selCls}&status=approved`).then(r => r.json()).then(setStudents).catch(() => {})
  }, [selCls])

  const loadTopics = async () => {
    const r = await api(`/curriculum/topics${selCls ? `?classroom_id=${selCls}` : ''}`)
    setTopics(await r.json())
  }

  const loadAssignments = async () => {
    const r = await api(`/curriculum/assignments${selCls ? `?classroom_id=${selCls}` : ''}`)
    setAssignments(await r.json())
  }

  const loadReports = async () => {
    const r = await api(`/curriculum/reports${selCls ? `?classroom_id=${selCls}` : ''}`)
    setReports(await r.json())
  }

  const loadCompletions = async (assignmentId: string) => {
    if (completions[assignmentId]) return
    const r = await api(`/curriculum/assignments/${assignmentId}/completions`)
    const data = await r.json()
    setCompletions(p => ({ ...p, [assignmentId]: data }))
  }

  const saveTopic = async () => {
    if (!topicForm.title) { toast('Başlık zorunlu', 'error'); return }
    try {
      if (editTopic) {
        await api(`/curriculum/topics/${editTopic.id}`, { method: 'PATCH', body: JSON.stringify(topicForm) })
        toast('Güncellendi ✅', 'success')
      } else {
        await api('/curriculum/topics', { method: 'POST', body: JSON.stringify({ ...topicForm, classroom_id: selCls || null }) })
        toast('Konu eklendi ✅', 'success')
      }
      setTopicModal(false); setEditTopic(null)
      setTopicForm({ title: '', description: '', period_type: 'weekly', classroom_id: '' })
      loadTopics()
    } catch { toast('Kaydedilemedi', 'error') }
  }

  const deleteTopic = async (id: string) => {
    if (!window.confirm('Bu konuyu silmek istediğinize emin misiniz?')) return
    await api(`/curriculum/topics/${id}`, { method: 'DELETE' })
    setTopics(p => p.filter(t => t.id !== id))
    toast('Silindi', 'success')
  }

  const saveAssignment = async () => {
    if (!assignForm.title || !assignForm.classroom_id) { toast('Başlık ve sınıf zorunlu', 'error'); return }
    try {
      await api('/curriculum/assignments', { method: 'POST', body: JSON.stringify(assignForm) })
      toast('Ödev verildi ✅', 'success')
      setAssignModal(false)
      setAssignForm({ topic_id: '', title: '', description: '', due_date: '', classroom_id: selCls })
      loadAssignments()
    } catch { toast('Kaydedilemedi', 'error') }
  }

  const toggleCompletion = async (assignmentId: string, studentId: string, isDone: boolean) => {
    await api('/curriculum/completions', { method: 'PATCH', body: JSON.stringify({ assignment_id: assignmentId, student_id: studentId, is_done: !isDone }) })
    setCompletions(p => ({
      ...p,
      [assignmentId]: (p[assignmentId] || []).map(c => c.student_id === studentId ? { ...c, is_done: !isDone } : c)
    }))
  }

  const saveReport = async () => {
    if (!reportForm.week_start || !reportStudent) { toast('Tarih zorunlu', 'error'); return }
    try {
      await api('/curriculum/reports', { method: 'POST', body: JSON.stringify({ ...reportForm, student_id: reportStudent.id, classroom_id: selCls }) })
      toast('Karne kaydedildi ✅', 'success')
      setReportModal(false)
      loadReports()
    } catch { toast('Kaydedilemedi', 'error') }
  }

  const weekStart = () => {
    const d = new Date()
    d.setDate(d.getDate() - d.getDay() + 1)
    return d.toISOString().split('T')[0]
  }
  const weekEnd = () => {
    const d = new Date()
    d.setDate(d.getDate() - d.getDay() + 7)
    return d.toISOString().split('T')[0]
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">📚 Müfredat</h1>
            <p className="text-sm text-gray-500">Konu planı, ödev takibi ve haftalık karne</p>
          </div>
          <select value={selCls} onChange={e => setSelCls(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500">
            <option value="">Sınıf seçin</option>
            {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Sekmeler */}
        <div className="flex gap-2">
          {([['topics', '📋 Konular'], ['assignments', '✏️ Ödevler'], ['reports', '📊 Karneler']] as const).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === t ? 'bg-green-500 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* KONULAR */}
        {tab === 'topics' && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <button onClick={() => { setEditTopic(null); setTopicForm({ title: '', description: '', period_type: 'weekly', classroom_id: selCls }); setTopicModal(true) }}
                className="px-4 py-2 bg-green-500 text-white text-sm font-bold rounded-xl hover:bg-green-600">
                + Konu Ekle
              </button>
            </div>

            {['daily', 'weekly', 'monthly'].map(period => {
              const filtered = topics.filter(t => t.period_type === period)
              if (filtered.length === 0) return null
              return (
                <div key={period}>
                  <div className="text-xs font-bold text-gray-400 uppercase mb-2">{PERIOD_LABELS[period]}</div>
                  <div className="space-y-2">
                    {filtered.map(topic => (
                      <div key={topic.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-start gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900">{topic.title}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${PERIOD_COLORS[topic.period_type]}`}>
                              {PERIOD_LABELS[topic.period_type]}
                            </span>
                          </div>
                          {topic.description && <p className="text-xs text-gray-500">{topic.description}</p>}
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <button onClick={() => {
                            setEditTopic(topic)
                            setTopicForm({ title: topic.title, description: topic.description || '', period_type: topic.period_type, classroom_id: topic.classroom_id || '' })
                            setTopicModal(true)
                          }} className="px-2.5 py-1 text-xs font-bold border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">
                            ✏️ Düzenle
                          </button>
                          <button onClick={() => {
                            setAssignForm({ topic_id: topic.id, title: topic.title, description: topic.description || '', due_date: '', classroom_id: selCls })
                            setAssignModal(true)
                          }} className="px-2.5 py-1 text-xs font-bold bg-green-50 border border-green-200 text-green-700 rounded-lg hover:bg-green-100">
                            📤 Ödev Ver
                          </button>
                          <button onClick={() => deleteTopic(topic.id)}
                            className="px-2.5 py-1 text-xs font-bold bg-red-50 border border-red-200 text-red-600 rounded-lg hover:bg-red-100">
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
            {topics.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-2">📋</div>
                <p>Henüz konu eklenmemiş</p>
                <p className="text-xs mt-1">Konu ekle butonuyla başlayın</p>
              </div>
            )}
          </div>
        )}

        {/* ÖDEVLER */}
        {tab === 'assignments' && (
          <div className="space-y-3">
            <div className="flex justify-end gap-2">
              <button onClick={() => { setAssignForm({ topic_id: '', title: '', description: '', due_date: '', classroom_id: selCls }); setAssignModal(true) }}
                className="px-4 py-2 bg-green-500 text-white text-sm font-bold rounded-xl">
                + Yeni Ödev
              </button>
            </div>

            {assignments.map(a => (
              <div key={a.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                <div className="p-4 flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">{a.title}</span>
                      {a.curriculum_topics && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${PERIOD_COLORS[a.curriculum_topics.period_type]}`}>
                          {PERIOD_LABELS[a.curriculum_topics.period_type]}
                        </span>
                      )}
                    </div>
                    {a.description && <p className="text-xs text-gray-500 mb-1">{a.description}</p>}
                    <div className="text-xs text-gray-400">
                      📅 Verildi: {a.assigned_date}
                      {a.due_date && ` • ⏳ Teslim: ${a.due_date}`}
                    </div>
                  </div>
                  <button onClick={async () => {
                    if (selAssignment?.id === a.id) { setSelAssignment(null); return }
                    await loadCompletions(a.id)
                    setSelAssignment(a)
                  }} className="px-3 py-1.5 text-xs font-bold border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50">
                    {selAssignment?.id === a.id ? '▲ Kapat' : '👥 Öğrenciler'}
                  </button>
                </div>

                {selAssignment?.id === a.id && completions[a.id] && (
                  <div className="border-t border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-gray-500">
                        ✅ {completions[a.id].filter(c => c.is_done).length} / {completions[a.id].length} tamamladı
                      </span>
                      <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-2 bg-green-500 rounded-full"
                          style={{ width: `${completions[a.id].length ? Math.round(completions[a.id].filter(c => c.is_done).length / completions[a.id].length * 100) : 0}%` }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-1.5 max-h-60 overflow-y-auto">
                      {completions[a.id].map(c => (
                        <div key={c.id} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                          <button onClick={() => toggleCompletion(a.id, c.student_id, c.is_done)}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${c.is_done ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'}`}>
                            {c.is_done && <span className="text-xs">✓</span>}
                          </button>
                          <span className={`text-sm flex-1 ${c.is_done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                            {c.students?.full_name || c.students?.first_name + ' ' + c.students?.last_name}
                          </span>
                          {c.is_done && <span className="text-xs text-green-500">✅ Yaptı</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {assignments.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-2">✏️</div>
                <p>Henüz ödev verilmemiş</p>
              </div>
            )}
          </div>
        )}

        {/* KARNELER */}
        {tab === 'reports' && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <button onClick={() => {
                setReportStudent(null)
                setReportForm({ week_start: weekStart(), week_end: weekEnd(), teacher_comment: '', focus_areas: '' })
                setReportModal(true)
              }} className="px-4 py-2 bg-green-500 text-white text-sm font-bold rounded-xl">
                + Karne Yaz
              </button>
            </div>

            {reports.map(r => (
              <div key={r.id} className="bg-white border border-gray-100 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-gray-900">
                      {r.students?.full_name || r.students?.first_name + ' ' + r.students?.last_name}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      📅 {r.week_start} — {r.week_end}
                    </div>
                  </div>
                  <button onClick={async () => {
                    if (!window.confirm('Bu karneyi silmek istiyor musunuz?')) return
                    await api(`/curriculum/reports/${r.id}`, { method: 'DELETE' })
                    setReports(p => p.filter(x => x.id !== r.id))
                    toast('Silindi', 'success')
                  }} className="text-gray-300 hover:text-red-400 text-lg">×</button>
                </div>
                {r.focus_areas && (
                  <div className="mt-2 bg-amber-50 border border-amber-100 rounded-lg p-2.5 text-xs text-amber-700">
                    🎯 <strong>Odak Alanları:</strong> {r.focus_areas}
                  </div>
                )}
                {r.teacher_comment && (
                  <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg p-2.5 text-xs text-blue-700">
                    💬 <strong>Hoca Yorumu:</strong> {r.teacher_comment}
                  </div>
                )}
              </div>
            ))}
            {reports.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-2">📊</div>
                <p>Henüz karne yazılmamış</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* KONU MODAL */}
      {topicModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setTopicModal(false)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-lg mb-4">{editTopic ? '✏️ Konuyu Düzenle' : '+ Yeni Konu'}</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Konu Başlığı *</label>
                <input value={topicForm.title} onChange={e => setTopicForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Örn: Fatiha Suresi Ezberi"
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Kısa İçerik</label>
                <textarea value={topicForm.description} onChange={e => setTopicForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Konunun kısa açıklaması..."
                  rows={3} className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500 resize-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Periyot</label>
                <div className="flex gap-2 mt-1">
                  {[['daily', '📅 Günlük'], ['weekly', '📆 Haftalık'], ['monthly', '🗓️ Aylık']].map(([v, l]) => (
                    <button key={v} onClick={() => setTopicForm(p => ({ ...p, period_type: v }))}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border-2 transition-all ${topicForm.period_type === v ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500'}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setTopicModal(false); setEditTopic(null) }}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm">İptal</button>
              <button onClick={saveTopic}
                className="flex-1 py-2.5 bg-green-500 text-white rounded-xl text-sm font-bold">Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {/* ÖDEV MODAL */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setAssignModal(false)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-lg mb-4">📤 Ödev Ver</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Sınıf *</label>
                <select value={assignForm.classroom_id} onChange={e => setAssignForm(p => ({ ...p, classroom_id: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500">
                  <option value="">Seçin</option>
                  {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Müfredattan Seç</label>
                <select value={assignForm.topic_id} onChange={e => {
                  const t = topics.find(x => x.id === e.target.value)
                  setAssignForm(p => ({ ...p, topic_id: e.target.value, title: t?.title || p.title, description: t?.description || p.description }))
                }} className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500">
                  <option value="">-- Müfredattan seç veya manuel gir --</option>
                  {topics.map(t => <option key={t.id} value={t.id}>{PERIOD_LABELS[t.period_type]} — {t.title}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Ödev Başlığı *</label>
                <input value={assignForm.title} onChange={e => setAssignForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Ödev başlığı"
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Açıklama</label>
                <textarea value={assignForm.description} onChange={e => setAssignForm(p => ({ ...p, description: e.target.value }))}
                  rows={2} placeholder="Ödev detayları..."
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500 resize-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Teslim Tarihi</label>
                <input type="date" value={assignForm.due_date} onChange={e => setAssignForm(p => ({ ...p, due_date: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setAssignModal(false)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm">İptal</button>
              <button onClick={saveAssignment}
                className="flex-1 py-2.5 bg-green-500 text-white rounded-xl text-sm font-bold">Ödev Ver</button>
            </div>
          </div>
        </div>
      )}

      {/* KARNE MODAL */}
      {reportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setReportModal(false)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-lg mb-4">📊 Haftalık Karne</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Öğrenci *</label>
                <select value={reportStudent?.id || ''} onChange={e => setReportStudent(students.find(s => s.id === e.target.value))}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500">
                  <option value="">Öğrenci seçin</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.full_name || s.first_name + ' ' + s.last_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Hafta Başlangıcı</label>
                  <input type="date" value={reportForm.week_start} onChange={e => setReportForm(p => ({ ...p, week_start: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Hafta Bitişi</label>
                  <input type="date" value={reportForm.week_end} onChange={e => setReportForm(p => ({ ...p, week_end: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">🎯 Odak Alanları</label>
                <textarea value={reportForm.focus_areas} onChange={e => setReportForm(p => ({ ...p, focus_areas: e.target.value }))}
                  placeholder="Örn: Fatiha suresine çalışsın, Namaz vakitlerine dikkat etsin..."
                  rows={3} className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500 resize-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">💬 Hoca Yorumu</label>
                <textarea value={reportForm.teacher_comment} onChange={e => setReportForm(p => ({ ...p, teacher_comment: e.target.value }))}
                  placeholder="Bu haftaki genel değerlendirme, gelişmeler, öneriler..."
                  rows={4} className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500 resize-none" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setReportModal(false)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm">İptal</button>
              <button onClick={saveReport}
                className="flex-1 py-2.5 bg-green-500 text-white rounded-xl text-sm font-bold">Karneyi Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
