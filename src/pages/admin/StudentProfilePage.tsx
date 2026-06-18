import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Badge, Button, useToast, Modal, Input, Select, Alert } from '@/components/ui'
import { calcAge, waLink, absenceMessage } from '@/lib/utils'
import { studentsApi, classroomsApi, attendanceApi } from '@/lib/api'

type Tab = 'genel' | 'devam' | 'odevler' | 'notlar'

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [student, setStudent] = useState<any|null>(null)
  const [classrooms, setClassrooms] = useState<any[]>([])
  const [attSummary, setAttSummary] = useState<{total:number;present:number;absent:number;rate:number;records:any[]}|null>(null)
  const [attLoaded, setAttLoaded] = useState(false)

  const [tab, setTab] = useState<Tab>('genel')
  const [editModal, setEditModal] = useState(false)
  const [editForm, setEditForm] = useState<any>({})
  const [saving, setSaving] = useState(false)

  const [note, setNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  useEffect(() => {
    if (!id) return
    const studentId = id
    let cancelled = false
    async function load() {
      setLoading(true)
      setLoadError('')
      try {
        const [s, c] = await Promise.all([studentsApi.get(studentId), classroomsApi.list()])
        if (cancelled) return
        setStudent(s)
        setClassrooms(c)
        setNote(s.notes || '')
      } catch (e: any) {
        if (!cancelled) setLoadError(e.message || 'Öğrenci bilgisi yüklenirken bir hata oluştu')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    if (tab === 'devam' && !attLoaded && id) {
      attendanceApi.studentSummary(id).then(setAttSummary).catch(() => {}).finally(() => setAttLoaded(true))
    }
  }, [tab, attLoaded, id])

  const openEdit = () => {
    setEditForm({
      first_name: student.first_name, last_name: student.last_name, birth_date: student.birth_date,
      parent_first_name: student.parent_first_name, parent_last_name: student.parent_last_name,
      parent_phone: student.parent_phone, parent_phone2: student.parent_phone2 || '',
      mahalle: student.mahalle || '', classroom_id: student.classroom_id || '',
    })
    setEditModal(true)
  }

  const saveEdit = async () => {
    if (!id) return
    setSaving(true)
    try {
      const payload = { ...editForm, classroom_id: editForm.classroom_id || null }
      const updated = await studentsApi.update(id, payload)
      setStudent(updated)
      toast('Kaydedildi ✅','success')
      setEditModal(false)
    } catch (e: any) {
      toast(e.message || 'Kaydetme başarısız oldu', 'error')
    } finally {
      setSaving(false)
    }
  }

  const saveNote = async () => {
    if (!id) return
    setSavingNote(true)
    try {
      const updated = await studentsApi.update(id, { notes: note })
      setStudent(updated)
      toast('Not kaydedildi ✅','success')
    } catch (e: any) {
      toast(e.message || 'Not kaydedilemedi', 'error')
    } finally {
      setSavingNote(false)
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

  if (loadError || !student) return (
    <AdminLayout>
      <Alert variant="warn">{loadError || 'Öğrenci bulunamadı'}</Alert>
      <button onClick={() => navigate('/admin/students')}
        className="mt-3 px-4 py-2 bg-green-500 text-white text-sm font-bold rounded-lg">
        Öğrenci Listesine Dön
      </button>
    </AdminLayout>
  )

  const cls = classrooms.find(c=>c.id===student.classroom_id)
  const age = calcAge(student.birth_date)
  const fullName = `${student.first_name} ${student.last_name}`
  const parentName = `${student.parent_first_name} ${student.parent_last_name}`
  const rate = attSummary?.rate ?? 0

  return (
    <AdminLayout>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4 text-sm text-gray-400">
        <button onClick={() => navigate('/admin/students')} className="hover:text-gray-600">Öğrenciler</button>
        <span>/</span>
        <span className="text-gray-900 font-semibold">{fullName}</span>
      </div>

      {/* Header kartı */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
        <div className="flex items-start gap-4 flex-wrap">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl flex-shrink-0 ${student.gender==='erkek'?'bg-blue-100 text-blue-600':'bg-pink-100 text-pink-600'}`}>
            {fullName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xl font-extrabold text-gray-900">{fullName}</div>
            <div className="flex flex-wrap gap-2 mt-1.5">
              <Badge variant={student.gender==='erkek'?'blue':'green'}>{student.gender==='erkek'?'👦 Erkek':'👧 Kız'}</Badge>
              <Badge variant="gray">{age} yaş</Badge>
              <Badge variant={cls?'green':'amber'}>{cls?cls.name:'Sınıf atanmamış'}</Badge>
              {attLoaded && <Badge variant={rate>=80?'green':rate>=60?'amber':'red'}>%{rate} devam</Badge>}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button size="sm" variant="outline" onClick={openEdit}>✏️ Düzenle</Button>
            <a href={waLink(student.parent_phone,`Sayın ${parentName}, ${fullName} ile ilgili bilgi vermek istiyoruz.`)}
              target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] text-white text-xs font-semibold rounded-lg">
              💬 Veliye WA
            </a>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
        {([['genel','📋 Genel'],['devam','✅ Devam'],['odevler','📚 Ödevler'],['notlar','📝 Notlar']] as const).map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${tab===t?'bg-white text-gray-900 shadow-sm':'text-gray-400'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* GENEL */}
      {tab==='genel' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-sm font-bold text-gray-900 mb-3">📋 Öğrenci Bilgileri</div>
            {[
              ['Ad Soyad',fullName],
              ['Doğum Tarihi',student.birth_date],
              ['Cinsiyet',student.gender==='erkek'?'Erkek':'Kız'],
              ['Yaş',`${age} yaş`],
              ['Sınıf',cls?.name||'Atanmamış'],
              ['Mahalle',student.mahalle||'—'],
              ['Sokak',student.sokak||'—'],
              ['Kayıt Tarihi',student.created_at?.split('T')[0]],
            ].map(([l,v])=>(
              <div key={l} className="flex items-center py-2 border-b border-gray-50 last:border-0 text-sm gap-3">
                <span className="text-xs font-semibold text-gray-400 w-24 flex-shrink-0">{l}</span>
                <span className="text-gray-700">{v}</span>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-sm font-bold text-gray-900 mb-3">👤 Veli Bilgileri</div>
            {[
              ['Veli Adı',parentName],
              ['Telefon 1',student.parent_phone],
              ['Telefon 2',student.parent_phone2||'—'],
            ].map(([l,v])=>(
              <div key={l} className="flex items-center py-2 border-b border-gray-50 last:border-0 text-sm gap-3">
                <span className="text-xs font-semibold text-gray-400 w-24 flex-shrink-0">{l}</span>
                <span className="text-gray-700">{v}</span>
              </div>
            ))}
            <div className="mt-4 space-y-2">
              <a href={waLink(student.parent_phone,`Sayın ${parentName}, ${fullName} ile ilgili bilgi vermek istiyoruz.`)} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 w-full py-2.5 px-3 bg-[#25D366] text-white text-sm font-bold rounded-lg justify-center">
                💬 WhatsApp Mesaj Gönder
              </a>
              <a href={`tel:${student.parent_phone}`}
                className="flex items-center gap-2 w-full py-2.5 px-3 border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg justify-center hover:bg-gray-50">
                📞 Ara
              </a>
            </div>
          </div>
        </div>
      )}

      {/* DEVAM */}
      {tab==='devam' && (
        <div className="space-y-4">
          {!attLoaded ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-3xl mb-2 animate-pulse">⏳</div>
              <p className="text-sm">Yükleniyor...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                {[
                  {l:'Geldi',v:attSummary?.present||0,c:'text-green-600 border-green-400'},
                  {l:'Gelmedi',v:attSummary?.absent||0,c:'text-red-500 border-red-400'},
                  {l:'Devam Oranı',v:`%${rate}`,c:rate>=80?'text-green-600 border-green-400':rate>=60?'text-amber-500 border-amber-400':'text-red-500 border-red-400'},
                ].map(s=>(
                  <div key={s.l} className={`bg-white rounded-xl shadow-sm p-4 text-center border-t-[3px] ${s.c.split(' ')[1]}`}>
                    <div className={`text-2xl font-extrabold ${s.c.split(' ')[0]}`}>{s.v}</div>
                    <div className="text-xs font-semibold text-gray-400 mt-1">{s.l}</div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 text-sm font-bold text-gray-900">Devam Geçmişi</div>
                {(!attSummary || attSummary.records.length === 0) ? (
                  <div className="text-center py-10 text-gray-400 text-sm">Henüz devam kaydı yok</div>
                ) : (
                  attSummary.records.sort((a,b)=>b.date.localeCompare(a.date)).map((r: any)=>(
                    <div key={r.date} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-600 w-28">{r.date}</span>
                      <Badge variant={r.status==='present'?'green':'red'}>{r.status==='present'?'✅ Geldi':'❌ Gelmedi'}</Badge>
                      {r.status==='absent' && (
                        <a href={waLink(student.parent_phone, absenceMessage(fullName,parentName,cls?.name||'',r.date))}
                          target="_blank" rel="noreferrer"
                          className="ml-auto text-xs px-2 py-1 bg-[#25D366] text-white font-semibold rounded">📱 WA</a>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ÖDEVLER */}
      {tab==='odevler' && (
        <div className="bg-white rounded-xl shadow-sm p-5 text-center text-gray-400">
          <div className="text-3xl mb-2">📚</div>
          <p className="text-sm">Bu öğrenciye özel ödev geçmişi için Ödevler sayfasını kullanabilirsiniz</p>
        </div>
      )}

      {/* NOTLAR */}
      {tab==='notlar' && (
        <div className="space-y-3">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-sm font-bold text-gray-900 mb-3">📝 Not</div>
            <textarea value={note} onChange={e=>setNote(e.target.value)} rows={4} placeholder="Bu öğrenci hakkında not..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500 resize-none mb-2" />
            <Button size="sm" onClick={saveNote} disabled={savingNote}>{savingNote ? 'Kaydediliyor...' : 'Notu Kaydet'}</Button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <Modal open={editModal} onClose={()=>setEditModal(false)} title="✏️ Öğrenciyi Düzenle"
        footer={<><Button variant="outline" onClick={()=>setEditModal(false)}>İptal</Button><Button onClick={saveEdit} loading={saving}>Kaydet</Button></>}>
        <Input label="Ad" value={editForm.first_name||''} onChange={e=>setEditForm((p:any)=>({...p,first_name:e.target.value}))} />
        <Input label="Soyad" value={editForm.last_name||''} onChange={e=>setEditForm((p:any)=>({...p,last_name:e.target.value}))} />
        <Input label="Doğum Tarihi" type="date" value={editForm.birth_date||''} onChange={e=>setEditForm((p:any)=>({...p,birth_date:e.target.value}))} />
        <Input label="Veli Adı" value={editForm.parent_first_name||''} onChange={e=>setEditForm((p:any)=>({...p,parent_first_name:e.target.value}))} />
        <Input label="Veli Soyadı" value={editForm.parent_last_name||''} onChange={e=>setEditForm((p:any)=>({...p,parent_last_name:e.target.value}))} />
        <Input label="Veli Telefon" type="tel" value={editForm.parent_phone||''} onChange={e=>setEditForm((p:any)=>({...p,parent_phone:e.target.value}))} />
        <Input label="Veli Telefon 2 (opsiyonel)" type="tel" value={editForm.parent_phone2||''} onChange={e=>setEditForm((p:any)=>({...p,parent_phone2:e.target.value}))} />
        <Input label="Mahalle" value={editForm.mahalle||''} onChange={e=>setEditForm((p:any)=>({...p,mahalle:e.target.value}))} />
        <Select label="Sınıf" value={editForm.classroom_id||''} onChange={e=>setEditForm((p:any)=>({...p,classroom_id:e.target.value}))}>
          <option value="">Sınıf atanmamış</option>
          {classrooms.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </Modal>
    </AdminLayout>
  )
}
