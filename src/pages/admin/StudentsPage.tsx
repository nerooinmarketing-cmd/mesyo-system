import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Badge, Button, Modal, Input, Select, useToast, Alert } from '@/components/ui'
import { calcAge, waLink } from '@/lib/utils'
import { exportStudentsXLSX } from '@/lib/export'
import { studentsApi, seasonsApi, classroomsApi } from '@/lib/api'

type GenderTab = 'tumu' | 'erkek' | 'kiz'

export default function StudentsPage() {
  const { toast } = useToast()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [seasons, setSeasons] = useState<any[]>([])
  const [classrooms, setClassrooms] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])

  const [season, setSeason] = useState('')
  const [gender, setGender] = useState<GenderTab>('tumu')
  const [search, setSearch] = useState('')
  const [ageFilter, setAgeFilter] = useState('')
  const [clsFilter, setClsFilter] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [editModal, setEditModal] = useState<{ open: boolean; student: any | null }>({ open: false, student: null })
  const [editForm, setEditForm] = useState<any>({})
  const [savingEdit, setSavingEdit] = useState(false)
  const [waModal, setWaModal] = useState(false)
  const [addModal, setAddModal] = useState(false)
  const [addForm, setAddForm] = useState({ first_name: '', last_name: '', birth_date: '', gender: 'kiz', parent_name: '', parent_phone: '', classroom_id: '', mahalle: '' })
  const [savingAdd, setSavingAdd] = useState(false)

  // İlk yükleme: sezonlar + sınıflar + öğrenciler.
  // Sezon henüz bilinmediği için önce sezonları çekip aktif olanı seçiyoruz,
  // sonra ona göre öğrenci/sınıf listesini çekiyoruz.
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setLoadError('')
      try {
        const seasonList = await seasonsApi.list()
        if (cancelled) return
        setSeasons(seasonList)
        const activeSeason = seasonList.find((s: any) => s.is_active) || seasonList[0]
        const seasonId = activeSeason?.id || ''
        setSeason(seasonId)

        const [clsList, studentList] = await Promise.all([
          classroomsApi.list(seasonId || undefined),
          studentsApi.list({ season_id: seasonId || undefined }),
        ])
        if (cancelled) return
        setClassrooms(clsList)
        setStudents(studentList)
      } catch (e: any) {
        if (!cancelled) setLoadError(e.message || 'Veriler yüklenirken bir hata oluştu')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Sezon değiştirildiğinde o sezona ait öğrenci/sınıf listesini yeniden çek
  const changeSeason = async (seasonId: string) => {
    setSeason(seasonId)
    setSelected(new Set())
    setLoading(true)
    try {
      const [clsList, studentList] = await Promise.all([
        classroomsApi.list(seasonId),
        studentsApi.list({ season_id: seasonId }),
      ])
      setClassrooms(clsList)
      setStudents(studentList)
    } catch (e: any) {
      toast(e.message || 'Veriler yüklenemedi', 'error')
    } finally {
      setLoading(false)
    }
  }

  const filtered = students.filter(s => {
    const q = search.toLowerCase()
    const mq = !q || (s.first_name + ' ' + s.last_name).toLowerCase().includes(q) || (s.parent_first_name + ' ' + s.parent_last_name).toLowerCase().includes(q) || (s.mahalle || '').toLowerCase().includes(q) || s.parent_phone.includes(q)
    const mg = gender === 'tumu' || s.gender === gender
    const ma = !ageFilter || calcAge(s.birth_date) === parseInt(ageFilter)
    const mc = !clsFilter || (clsFilter === 'null' ? !s.classroom_id : s.classroom_id === clsFilter)
    return mq && mg && ma && mc
  })

  const counts = {
    tumu: students.length,
    erkek: students.filter(s => s.gender === 'erkek').length,
    kiz: students.filter(s => s.gender === 'kiz').length,
  }

  const toggleSel = (id: string) => setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  const selAll = () => setSelected(new Set(filtered.map(s => s.id)))
  const clearSel = () => setSelected(new Set())

  const addStudent = async () => {
    if (!addForm.first_name || !addForm.last_name || !addForm.parent_name || !addForm.parent_phone) {
      toast('Ad, soyad, veli adı ve telefon zorunlu', 'error'); return
    }
    setSavingAdd(true)
    try {
      const payload = {
        first_name: addForm.first_name,
        last_name: addForm.last_name,
        full_name: `${addForm.first_name} ${addForm.last_name}`,
        birth_date: addForm.birth_date || null,
        gender: addForm.gender,
        parent_name: addForm.parent_name,
        parent_phone: addForm.parent_phone,
        classroom_id: addForm.classroom_id || null,
        mahalle: addForm.mahalle || null,
        season_id: season,
        status: 'approved',
        registration_source: 'manual',
        kvkk_consent: true,
      }
      const newStudent = await studentsApi.create(payload as any)
      setStudents(prev => [newStudent, ...prev])
      setAddModal(false)
      setAddForm({ first_name: '', last_name: '', birth_date: '', gender: 'kiz', parent_name: '', parent_phone: '', classroom_id: '', mahalle: '' })
      toast('Öğrenci eklendi ✅', 'success')
    } catch (e: any) {
      toast(e.message || 'Eklenemedi', 'error')
    } finally {
      setSavingAdd(false)
    }
  }

  const openEdit = (s: any) => {
    setEditForm({ ...s })
    setEditModal({ open: true, student: s })
  }

  const saveEdit = async () => {
    setSavingEdit(true)
    try {
      // Sadece backend'in beklediği alanları gönder (id, created_at gibi salt-okunur alanları çıkar)
      const { id, institution_id, season_id, created_at, updated_at, status, registration_source, kvkk_consent, kvkk_consent_at, ...payload } = editForm
      const updated = await studentsApi.update(editForm.id, payload)
      setStudents(p => p.map(s => s.id === updated.id ? updated : s))
      toast('Öğrenci güncellendi ✅', 'success')
      setEditModal({ open: false, student: null })
    } catch (e: any) {
      toast(e.message || 'Güncelleme başarısız oldu', 'error')
    } finally {
      setSavingEdit(false)
    }
  }

  const doDelete = async (id: string, name: string) => {
    if (!confirm(`${name} silinsin mi?`)) return
    try {
      await studentsApi.delete(id)
      setStudents(p => p.filter(s => s.id !== id))
      setSelected(p => { const n = new Set(p); n.delete(id); return n })
      toast('Öğrenci silindi', 'info')
    } catch (e: any) {
      toast(e.message || 'Silme işlemi başarısız oldu', 'error')
    }
  }

  const selectedStudents = filtered.filter(s => selected.has(s.id))

  const sendBulkWA = (toParent: boolean) => {
    const targets = selectedStudents
    if (!targets.length) { toast('Öğrenci seçin', 'error'); return }
    targets.forEach((s, i) => {
      const phone = s.parent_phone
      const msg = toParent
        ? `Sayın ${(s.parent_first_name + ' ' + s.parent_last_name)}, öğrenciniz ${(s.first_name + ' ' + s.last_name)} ile ilgili bilgi için kurum ile iletişime geçebilirsiniz.`
        : `Merhaba ${(s.first_name + ' ' + s.last_name)}, kurs ile ilgili bilgi almak için arayabilirsiniz.`
      setTimeout(() => window.open(waLink(phone, msg), '_blank'), i * 700)
    })
    toast(`${targets.length} kişiye WhatsApp gönderiliyor 📱`, 'success')
    setWaModal(false)
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
      <div className="space-y-3">
        {/* Sezon seçici */}
        <div className="flex gap-2 items-center flex-wrap">
          {seasons.map(s => (
            <button key={s.id} onClick={() => changeSeason(s.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${season === s.id ? 'bg-green-500 text-white border-green-500' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
              {s.is_active ? '📅 ' : '📦 '}{s.name}
            </button>
          ))}
          <span className="text-xs text-gray-400 ml-auto">{counts.tumu} öğrenci</span>
          <button onClick={() => setAddModal(true)}
            className="px-3 py-1.5 bg-green-500 text-white text-xs font-bold rounded-full hover:bg-green-600 transition-colors">
            + Öğrenci Ekle
          </button>
        </div>

        {/* Cinsiyet sekmeleri */}
        <div className="flex bg-gray-100 rounded-xl p-1">
          <button onClick={() => setGender('tumu')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${gender === 'tumu' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}>
            Tümü ({counts.tumu})
          </button>
          <button onClick={() => setGender('erkek')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${gender === 'erkek' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-400'}`}>
            👦 Erkek ({counts.erkek})
          </button>
          <button onClick={() => setGender('kiz')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${gender === 'kiz' ? 'bg-pink-500 text-white shadow-sm' : 'text-gray-400'}`}>
            👧 Kız ({counts.kiz})
          </button>
        </div>

        {/* Filtreler */}
        <div className="flex gap-2 flex-wrap">
          <input type="text" placeholder="🔍 İsim, veli, telefon, mahalle..." value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-40 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
          <select value={ageFilter} onChange={e => setAgeFilter(e.target.value)}
            className="px-2 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-green-500">
            <option value="">Tüm yaşlar</option>
            {Array.from({ length: 8 }, (_, i) => 7 + i).map(y => <option key={y} value={y}>{y} Yaş</option>)}
          </select>
          <select value={clsFilter} onChange={e => setClsFilter(e.target.value)}
            className="px-2 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-green-500">
            <option value="">Tüm sınıflar</option>
            <option value="null">Sınıf atanmamış</option>
            {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Aksiyon bar */}
        <div className="flex gap-2 items-center flex-wrap">
          <button onClick={selAll} className="text-xs text-green-600 font-semibold hover:underline">Tümünü Seç</button>
          {selected.size > 0 && <button onClick={clearSel} className="text-xs text-gray-400 hover:underline">Seçimi Kaldır</button>}
          <span className="text-xs text-gray-400">{selected.size > 0 ? `${selected.size} seçildi` : ''}</span>
          <div className="ml-auto flex gap-2">
            {selected.size > 0 && (
              <button onClick={() => setWaModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] text-white text-xs font-bold rounded-lg">
                📱 WhatsApp ({selected.size})
              </button>
            )}
            <button onClick={() => exportStudentsXLSX(filtered, `ogrenciler-${season}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 bg-white text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50">
              ⬇ Excel İndir
            </button>
          </div>
        </div>

        {/* Liste */}
        {filtered.length === 0
          ? <div className="text-center py-16 text-gray-400"><div className="text-4xl mb-2">👥</div><p className="text-sm">Öğrenci bulunamadı</p></div>
          : <div className="space-y-2">
              {filtered.map(s => {
                const cls = classrooms.find(c => c.id === s.classroom_id)
                const a = calcAge(s.birth_date)
                const isSel = selected.has(s.id)
                return (
                  <div key={s.id}
                    className={`bg-white rounded-xl shadow-sm border-[2px] transition-all ${isSel ? 'border-green-400' : 'border-transparent'}`}>
                    {/* Header satır */}
                    <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => toggleSel(s.id)}>
                      <input type="checkbox" checked={isSel} onChange={() => toggleSel(s.id)}
                        onClick={e => e.stopPropagation()}
                        className="w-4 h-4 accent-green-500 flex-shrink-0" />
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0 ${s.gender === 'erkek' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                        {(s.first_name + ' ' + s.last_name).charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <button onClick={() => navigate(`/admin/students/${s.id}`)} className="text-sm font-bold text-gray-900 hover:text-green-600 hover:underline text-left">{(s.first_name + ' ' + s.last_name)}</button>
                        <div className="text-xs text-gray-400">
                          {a} yaş • {s.gender === 'erkek' ? '👦' : '👧'} •
                          {cls ? ` 🏫 ${cls.name}` : ' ⏳ Sınıf atanmamış'}
                        </div>
                      </div>
                      <Badge variant={s.classroom_id ? 'green' : 'amber'}>
                        {s.classroom_id ? cls?.name || '—' : 'Atanmamış'}
                      </Badge>
                    </div>

                    {/* Veli + aksiyonlar */}
                    <div className="flex items-center gap-3 px-4 pb-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500">
                          👤 {(s.parent_first_name + ' ' + s.parent_last_name)} &nbsp;•&nbsp;
                          <a href={`tel:${s.parent_phone}`} className="text-green-600 font-semibold" onClick={e => e.stopPropagation()}>{s.parent_phone}</a>
                        </div>
                        <div className="text-xs text-gray-400">📍 {s.mahalle || '—'}{s.sokak ? ' / ' + s.sokak : ''}</div>
                      </div>
                      <div className="flex gap-1.5 flex-wrap" onClick={e => e.stopPropagation()}>
                        <a href={waLink(s.parent_phone, `Sayın ${(s.parent_first_name + ' ' + s.parent_last_name)}, öğrenciniz ${(s.first_name + ' ' + s.last_name)} ile ilgili bilgi almak için arayabilirsiniz.`)}
                          target="_blank" rel="noreferrer"
                          className="px-2.5 py-1 bg-[#25D366] text-white text-xs font-semibold rounded-lg">💬</a>
                        <button onClick={() => openEdit(s)}
                          className="px-2.5 py-1 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50">✏️</button>
                        <button onClick={() => doDelete(s.id, (s.first_name + ' ' + s.last_name))}
                          className="px-2.5 py-1 border border-red-200 text-red-500 text-xs font-semibold rounded-lg hover:bg-red-50">🗑️</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
        }
      </div>

      {/* Düzenle Modal */}
      <Modal open={editModal.open} onClose={() => setEditModal({ open: false, student: null })}
        title={`✏️ ${editModal.student ? editModal.student.first_name + ' ' + editModal.student.last_name : ''}`}
        footer={<>
          <Button variant="outline" onClick={() => setEditModal({ open: false, student: null })}>İptal</Button>
          <Button onClick={saveEdit} loading={savingEdit}>Kaydet</Button>
        </>}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Öğrenci Adı" value={editForm.first_name || ''} onChange={e => setEditForm((p: any) => ({ ...p, first_name: e.target.value }))} />
            <Input label="Öğrenci Soyadı" value={editForm.last_name || ''} onChange={e => setEditForm((p: any) => ({ ...p, last_name: e.target.value }))} />
          </div>
          <Input label="T.C. No (opsiyonel)" value={editForm.tc_no || ''} onChange={e => setEditForm((p: any) => ({ ...p, tc_no: e.target.value.replace(/\D/g,'').slice(0,11) }))} />
          <Select label="Cinsiyet" value={editForm.gender || ''} onChange={e => setEditForm((p: any) => ({ ...p, gender: e.target.value }))}>
            <option value="erkek">👦 Erkek</option>
            <option value="kiz">👧 Kız</option>
          </Select>
          <Input label="Doğum Tarihi" type="date" value={editForm.birth_date || ''} onChange={e => setEditForm((p: any) => ({ ...p, birth_date: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Veli Adı" value={editForm.parent_first_name || ''} onChange={e => setEditForm((p: any) => ({ ...p, parent_first_name: e.target.value }))} />
            <Input label="Veli Soyadı" value={editForm.parent_last_name || ''} onChange={e => setEditForm((p: any) => ({ ...p, parent_last_name: e.target.value }))} />
          </div>
          <Input label="Veli Telefonu" type="tel" value={editForm.parent_phone || ''} onChange={e => setEditForm((p: any) => ({ ...p, parent_phone: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="İl" value={editForm.city || ''} onChange={e => setEditForm((p: any) => ({ ...p, city: e.target.value }))} />
            <Input label="İlçe" value={editForm.district || ''} onChange={e => setEditForm((p: any) => ({ ...p, district: e.target.value }))} />
          </div>
          <Input label="Mahalle" value={editForm.mahalle || ''} onChange={e => setEditForm((p: any) => ({ ...p, mahalle: e.target.value }))} />
          <Input label="Sokak" value={editForm.sokak || ''} onChange={e => setEditForm((p: any) => ({ ...p, sokak: e.target.value }))} />
          <Select label="Sınıf" value={editForm.classroom_id || ''} onChange={e => setEditForm((p: any) => ({ ...p, classroom_id: e.target.value || null }))}>
            <option value="">Sınıf atanmamış</option>
            {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
      </Modal>

      {/* WA Modal */}
      <Modal open={waModal} onClose={() => setWaModal(false)}
        title={`📱 WhatsApp — ${selectedStudents.length} öğrenci`}
        footer={<Button variant="outline" onClick={() => setWaModal(false)}>Kapat</Button>}>
        <Alert variant="info">Velilere kişiselleştirilmiş mesaj gönderilecek. Her biri için ayrı WhatsApp penceresi açılır.</Alert>
        <div className="space-y-3">
          <button onClick={() => sendBulkWA(true)}
            className="w-full py-3 bg-[#25D366] text-white font-bold rounded-xl text-sm hover:bg-[#128C7E] transition-colors">
            📱 Velilere Gönder ({selectedStudents.length} veli)
          </button>
          <div className="border-t border-gray-100 pt-3">
            <div className="text-xs font-semibold text-gray-500 mb-2 uppercase">Gönderilecekler</div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {selectedStudents.map(s => (
                <div key={s.id} className="flex items-center gap-2 text-sm">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${s.gender === 'erkek' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                    {(s.first_name + ' ' + s.last_name).charAt(0)}
                  </div>
                  <span className="flex-1 font-semibold truncate">{(s.first_name + ' ' + s.last_name)}</span>
                  <span className="text-xs text-gray-400">{(s.parent_first_name + ' ' + s.parent_last_name)} • {s.parent_phone}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Öğrenci Ekle Modal */}
      {addModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setAddModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-5 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg text-gray-900">➕ Öğrenci Ekle</h2>
              <button onClick={() => setAddModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Ad *</label>
                  <input value={addForm.first_name} onChange={e => setAddForm(p => ({ ...p, first_name: e.target.value }))}
                    placeholder="Ahmet" className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Soyad *</label>
                  <input value={addForm.last_name} onChange={e => setAddForm(p => ({ ...p, last_name: e.target.value }))}
                    placeholder="Yılmaz" className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Doğum Tarihi</label>
                  <input type="date" value={addForm.birth_date} onChange={e => setAddForm(p => ({ ...p, birth_date: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Cinsiyet</label>
                  <select value={addForm.gender} onChange={e => setAddForm(p => ({ ...p, gender: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500">
                    <option value="kiz">👧 Kız</option>
                    <option value="erkek">👦 Erkek</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Veli Adı Soyadı *</label>
                <input value={addForm.parent_name} onChange={e => setAddForm(p => ({ ...p, parent_name: e.target.value }))}
                  placeholder="Mehmet Yılmaz" className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Veli Telefonu *</label>
                <input value={addForm.parent_phone} onChange={e => setAddForm(p => ({ ...p, parent_phone: e.target.value }))}
                  placeholder="05xx xxx xx xx" className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Sınıf</label>
                <select value={addForm.classroom_id} onChange={e => setAddForm(p => ({ ...p, classroom_id: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500">
                  <option value="">-- Sınıf Seçiniz --</option>
                  {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Mahalle</label>
                <input value={addForm.mahalle} onChange={e => setAddForm(p => ({ ...p, mahalle: e.target.value }))}
                  placeholder="Mahalle adı" className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setAddModal(false)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold">
                İptal
              </button>
              <button onClick={addStudent} disabled={savingAdd}
                className="flex-1 py-2.5 bg-green-500 text-white rounded-xl text-sm font-bold disabled:opacity-50">
                {savingAdd ? '⏳ Kaydediliyor...' : '✅ Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
