import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Button, Modal, Input, Select, useToast, Badge, Alert } from '@/components/ui'
import { teachersApi, classroomsApi } from '@/lib/api'
import { waLink } from '@/lib/utils'

export default function TeachersPage() {
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [teachers, setTeachers] = useState<any[]>([])
  const [classrooms, setClassrooms] = useState<any[]>([])

  const [addModal, setAddModal] = useState(false)
  const [editTeacher, setEditTeacher] = useState<any|null>(null)
  const [resetTeacher, setResetTeacher] = useState<any|null>(null)
  const [newPw, setNewPw] = useState('')
  const [form, setForm] = useState({full_name:'', phone:'', password:'', class_id:'', see_all:false})
  const [processing, setProcessing] = useState(false)
  const ff = (k:string,v:any)=>setForm(p=>({...p,[k]:v}))

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setLoadError('')
      try {
        const [t, c] = await Promise.all([teachersApi.list(), classroomsApi.list()])
        if (!cancelled) { setTeachers(t); setClassrooms(c) }
      } catch (e: any) {
        if (!cancelled) setLoadError(e.message || 'Öğretmenler yüklenirken bir hata oluştu')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const addTeacher = async () => {
    if (!form.full_name || !form.phone || !form.password) { toast('Ad, telefon ve şifre zorunlu','error'); return }
    setProcessing(true)
    try {
      const created = await teachersApi.create({
        full_name: form.full_name, phone: form.phone, password: form.password, see_all: form.see_all,
      })
      if (form.class_id) {
        await teachersApi.update(created.id, { class_id: form.class_id })
        created.class_id = form.class_id
        created.class_name = classrooms.find(c => c.id === form.class_id)?.name
      }
      setTeachers(p => [...p, created])
      toast('Öğretmen eklendi ✅','success')
      setForm({full_name:'',phone:'',password:'',class_id:'',see_all:false})
      setAddModal(false)
    } catch (e: any) {
      toast(e.message || 'Öğretmen eklenemedi', 'error')
    } finally {
      setProcessing(false)
    }
  }

  const toggleActive = async (id:string, current: boolean) => {
    setTeachers(p=>p.map(t=>t.id===id?{...t,is_active:!current}:t))
    try {
      await teachersApi.update(id, { is_active: !current })
      toast('Durum güncellendi','success')
    } catch (e: any) {
      setTeachers(p=>p.map(t=>t.id===id?{...t,is_active:current}:t))
      toast(e.message || 'İşlem başarısız oldu', 'error')
    }
  }

  const deleteTeacher = async (id:string, name:string) => {
    if (!confirm(`${name} öğretmenini silmek istiyor musunuz?`)) return
    try {
      await teachersApi.delete(id)
      setTeachers(p=>p.filter(t=>t.id!==id))
      toast('Öğretmen silindi','info')
    } catch (e: any) {
      toast(e.message || 'Silme işlemi başarısız oldu', 'error')
    }
  }

  const resetPassword = async () => {
    if (!newPw || newPw.length < 4) { toast('En az 4 karakter','error'); return }
    if (!resetTeacher) return
    setProcessing(true)
    try {
      await teachersApi.resetPassword(resetTeacher.id, newPw)
      toast(`${resetTeacher.full_name} şifresi sıfırlandı ✅`,'success')
      setResetTeacher(null); setNewPw('')
    } catch (e: any) {
      toast(e.message || 'Şifre sıfırlama başarısız oldu', 'error')
    } finally {
      setProcessing(false)
    }
  }

  const assignClass = async (teacherId:string, classId:string) => {
    try {
      const updated = await teachersApi.update(teacherId, { class_id: classId || null })
      setTeachers(p=>p.map(t=>t.id===teacherId?updated:t))
      toast('Sınıf atandı ✅','success')
      setEditTeacher(null)
    } catch (e: any) {
      toast(e.message || 'Sınıf atama başarısız oldu', 'error')
    }
  }

  const toggleSeeAll = async (teacherId: string, current: boolean) => {
    try {
      const updated = await teachersApi.update(teacherId, { see_all_classrooms: !current } as any)
      setTeachers(p=>p.map(t=>t.id===teacherId?updated:t))
      setEditTeacher(updated)
    } catch (e: any) {
      toast(e.message || 'İşlem başarısız oldu', 'error')
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
      <div className="space-y-4">
        {/* Özet */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {l:'Toplam', v:teachers.length, c:'text-gray-900'},
            {l:'Aktif', v:teachers.filter(t=>t.is_active).length, c:'text-green-600'},
            {l:'WA Bağlı', v:teachers.filter(t=>t.wa_connected).length, c:'text-blue-600'},
          ].map(s=>(
            <div key={s.l} className="bg-white rounded-xl shadow-sm p-4 text-center">
              <div className={`text-2xl font-extrabold ${s.c}`}>{s.v}</div>
              <div className="text-xs text-gray-400 font-semibold mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <Button onClick={()=>setAddModal(true)}>+ Öğretmen Ekle</Button>
        </div>

        {/* Öğretmen kartları */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {teachers.map(t=>(
            <div key={t.id} className={`bg-white rounded-2xl shadow-sm p-5 border-2 ${t.is_active?'border-gray-100':'border-gray-100 opacity-60'}`}>
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center font-extrabold text-lg flex-shrink-0 ${t.is_active?'bg-green-500 text-white':'bg-gray-300 text-gray-600'}`}>
                  {t.full_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-gray-900">{t.full_name}</div>
                  <div className="text-xs text-gray-400 font-mono">{t.phone}</div>
                  <div className="flex gap-1.5 mt-1 flex-wrap">
                    {t.is_active ? <Badge variant="green">✅ Aktif</Badge> : <Badge variant="gray">⛔ Pasif</Badge>}
                    {t.wa_connected && <Badge variant="green">📱 WA Bağlı</Badge>}
                    {t.see_all && <Badge variant="blue">👁 Tümünü Görür</Badge>}
                  </div>
                </div>
                <button onClick={()=>toggleActive(t.id, t.is_active)}
                  className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${t.is_active?'bg-green-500':'bg-gray-200'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${t.is_active?'translate-x-5':'translate-x-0.5'}`}/>
                </button>
              </div>

              <div className="flex items-center gap-2 py-2 border-b border-gray-50 mb-3">
                <span className="text-xs text-gray-400 w-16">Sınıf:</span>
                <span className={`text-xs font-semibold ${t.class_name?'text-gray-700':'text-amber-500'}`}>
                  {t.class_name || '⚠️ Atanmamış'}
                </span>
              </div>

              <div className="flex gap-1.5 flex-wrap">
                <button onClick={()=>setEditTeacher(t)}
                  className="flex-1 py-1.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors">
                  ✏️ Düzenle
                </button>
                <button onClick={()=>{setResetTeacher(t);setNewPw('')}}
                  className="flex-1 py-1.5 border border-amber-200 text-amber-600 bg-amber-50 text-xs font-semibold rounded-lg hover:bg-amber-100 transition-colors">
                  🔑 Şifre
                </button>
                <a href={waLink(t.phone,'Sayın hocamız, iletişim için yazıyorum.')} target="_blank" rel="noreferrer"
                  className="py-1.5 px-3 bg-[#25D366] text-white text-xs font-semibold rounded-lg">
                  💬
                </a>
                <button onClick={()=>deleteTeacher(t.id,t.full_name)}
                  className="py-1.5 px-3 border border-red-200 text-red-400 text-xs font-semibold rounded-lg hover:bg-red-50">
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>

        {teachers.length===0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm text-gray-400">
            <div className="text-3xl mb-2">👨‍🏫</div>
            <p className="text-sm">Henüz öğretmen eklenmemiş</p>
            <Button onClick={()=>setAddModal(true)} className="mt-3">+ Öğretmen Ekle</Button>
          </div>
        )}
      </div>

      {/* Ekle Modal */}
      <Modal open={addModal} onClose={()=>setAddModal(false)} title="👨‍🏫 Öğretmen Ekle"
        footer={<><Button variant="outline" onClick={()=>setAddModal(false)}>İptal</Button><Button onClick={addTeacher} loading={processing}>Ekle</Button></>}>
        <Input label="Ad Soyad *" value={form.full_name} onChange={e=>ff('full_name',e.target.value)} placeholder="Fatma Hanım"/>
        <Input label="Telefon * (Giriş için)" type="tel" value={form.phone} onChange={e=>ff('phone',e.target.value)} placeholder="05XX..."/>
        <Input label="Şifre *" type="password" value={form.password} onChange={e=>ff('password',e.target.value)} placeholder="En az 4 karakter"/>
        <Select label="Sınıf Ata (opsiyonel)" value={form.class_id} onChange={e=>ff('class_id',e.target.value)}>
          <option value="">Sınıf atanmamış</option>
          {classrooms.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <div className="flex items-center justify-between py-3 border-t border-gray-100">
          <div>
            <div className="text-sm font-semibold text-gray-900">Tüm sınıfları görebilir</div>
            <div className="text-xs text-gray-400">Açıksa tüm öğrencileri görür</div>
          </div>
          <button onClick={()=>ff('see_all',!form.see_all)}
            className={`relative w-10 h-5 rounded-full transition-colors ${form.see_all?'bg-green-500':'bg-gray-200'}`}>
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.see_all?'translate-x-5':'translate-x-0.5'}`}/>
          </button>
        </div>
      </Modal>

      {/* Düzenle Modal */}
      {editTeacher && (
        <Modal open={!!editTeacher} onClose={()=>setEditTeacher(null)} title={`✏️ ${editTeacher.full_name}`}
          footer={<><Button variant="outline" onClick={()=>setEditTeacher(null)}>Kapat</Button></>}>
          <Select label="Sınıf Ata" value={editTeacher.class_id||''} onChange={e=>assignClass(editTeacher.id,e.target.value)}>
            <option value="">Sınıf atanmamış</option>
            {classrooms.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <div className="flex items-center justify-between py-3 mt-2 border-t border-gray-100">
            <div>
              <div className="text-sm font-semibold text-gray-900">Tüm sınıfları görebilir</div>
            </div>
            <button onClick={()=>toggleSeeAll(editTeacher.id, editTeacher.see_all)}
              className={`relative w-10 h-5 rounded-full transition-colors ${editTeacher.see_all?'bg-green-500':'bg-gray-200'}`}>
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${editTeacher.see_all?'translate-x-5':'translate-x-0.5'}`}/>
            </button>
          </div>
        </Modal>
      )}

      {/* Şifre Modal */}
      <Modal open={!!resetTeacher} onClose={()=>setResetTeacher(null)} title={`🔑 ${resetTeacher?.full_name} — Şifre Sıfırla`}
        footer={<><Button variant="outline" onClick={()=>setResetTeacher(null)}>İptal</Button><Button onClick={resetPassword} loading={processing}>Sıfırla</Button></>}>
        <Input label="Yeni Şifre" type="text" value={newPw} onChange={e=>setNewPw(e.target.value)} placeholder="Yeni şifre"/>
        <p className="text-xs text-gray-400 mt-1">Şifreyi öğretmene iletmeyi unutmayın.</p>
      </Modal>
    </AdminLayout>
  )
}
