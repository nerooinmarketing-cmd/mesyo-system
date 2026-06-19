import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Alert, Badge, useToast } from '@/components/ui'
import { waLink } from '@/lib/utils'
import { exportStudentsXLSX } from '@/lib/export'
import { seasonsApi, studentsApi } from '@/lib/api'

export default function SeasonsPage() {
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [seasons, setSeasons] = useState<any[]>([])
  const [studentsBySeasonId, setStudentsBySeasonId] = useState<Record<string, any[]>>({})

  const [confirmModal, setConfirmModal] = useState<any|null>(null)
  const [archiving, setArchiving] = useState(false)
  const [inviteModal, setInviteModal] = useState<any|null>(null)
  const [inviteMsg, setInviteMsg] = useState('')
  const [inviteSending, setInviteSending] = useState(false)
  const [sentCount, setSentCount] = useState(0)

  // Yeni sezon ekleme
  const [addModal, setAddModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newYear, setNewYear] = useState(new Date().getFullYear())
  const [adding, setAdding] = useState(false)

  // Sezon düzenleme
  const [editModal, setEditModal] = useState<any|null>(null)
  const [editName, setEditName] = useState('')
  const [editing, setEditing] = useState(false)

  // Sezon silme
  const [deleteModal, setDeleteModal] = useState<any|null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setLoadError('')
      try {
        const seasonList = await seasonsApi.list()
        if (cancelled) return
        setSeasons(seasonList)
        const studentLists = await Promise.all(
          seasonList.map((s: any) => studentsApi.list({ season_id: s.id }))
        )
        if (cancelled) return
        const map: Record<string, any[]> = {}
        seasonList.forEach((s: any, i: number) => { map[s.id] = studentLists[i] })
        setStudentsBySeasonId(map)
      } catch (e: any) {
        if (!cancelled) setLoadError(e.message || 'Veriler yüklenirken bir hata oluştu')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const activeSeason = seasons.find(s => s.is_active)
  const studentsOf = (seasonId: string) => studentsBySeasonId[seasonId] || []

  const doArchive = async () => {
    if (!confirmModal) return
    setArchiving(true)
    try {
      const seasonStudents = studentsOf(confirmModal.id)
      exportStudentsXLSX(seasonStudents, confirmModal.name)
      toast(`📊 Excel indiriliyor...`, 'success')
      const nextYear = confirmModal.year + 1
      const newSeason = await seasonsApi.create({ name: `${nextYear} Yaz Kursu`, year: nextYear })
      setSeasons(p => [
        ...p.map(s => s.id === confirmModal.id ? { ...s, is_active: false, archived_at: new Date().toISOString() } : s),
        newSeason,
      ])
      setStudentsBySeasonId(p => ({ ...p, [newSeason.id]: [] }))
      setConfirmModal(null)
      toast(`✅ ${confirmModal.name} arşivlendi. ${newSeason.name} oluşturuldu.`, 'success')
    } catch (e: any) {
      toast(e.message || 'Sezon kapatma işlemi başarısız oldu', 'error')
    } finally {
      setArchiving(false)
    }
  }

  const doAdd = async () => {
    if (!newName.trim()) { toast('Sezon adı zorunlu', 'error'); return }
    setAdding(true)
    try {
      const created = await seasonsApi.create({ name: newName.trim(), year: newYear })
      setSeasons(p => [...p, created])
      setStudentsBySeasonId(p => ({ ...p, [created.id]: [] }))
      toast(`✅ ${created.name} oluşturuldu`, 'success')
      setAddModal(false)
      setNewName('')
      setNewYear(new Date().getFullYear())
    } catch (e: any) {
      toast(e.message || 'Sezon eklenemedi', 'error')
    } finally {
      setAdding(false)
    }
  }

  const doEdit = async () => {
    if (!editModal || !editName.trim()) { toast('Sezon adı zorunlu', 'error'); return }
    setEditing(true)
    try {
      const updated = await seasonsApi.update(editModal.id, editName.trim())
      setSeasons(p => p.map(s => s.id === editModal.id ? { ...s, name: updated.name } : s))
      toast('✅ Sezon adı güncellendi', 'success')
      setEditModal(null)
    } catch (e: any) {
      toast(e.message || 'Güncelleme başarısız oldu', 'error')
    } finally {
      setEditing(false)
    }
  }

  const doDelete = async () => {
    if (!deleteModal) return
    setDeleting(true)
    try {
      await seasonsApi.delete(deleteModal.id)
      setSeasons(p => p.filter(s => s.id !== deleteModal.id))
      toast('Sezon silindi', 'info')
      setDeleteModal(null)
    } catch (e: any) {
      toast(e.message || 'Silme işlemi başarısız oldu', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const openInvite = (season: any) => {
    const nextYear = season.year + 1
    setInviteMsg(`Sayın Veli,\n\n${season.year} yılında kursumuza katıldığınız için teşekkür ederiz.\n\n${nextYear} yılı eğitim programımız yakında başlayacaktır. Çocuğunuzu yeniden aramızda görmekten mutluluk duyarız.\n\nKayıt ve bilgi için lütfen kurumumuzla iletişime geçiniz.\n\nSaygılarımızla 📚`)
    setInviteModal(season)
    setSentCount(0)
  }

  const sendInvites = async () => {
    if (!inviteModal) return
    const seasonStudents = studentsOf(inviteModal.id)
    if (!seasonStudents.length) { toast('Bu sezonda öğrenci yok', 'error'); return }
    setInviteSending(true)
    seasonStudents.forEach((s, i) => {
      const msg = inviteMsg.replace('{veli}', `${s.parent_first_name} ${s.parent_last_name}`).replace('{ogrenci}', `${s.first_name} ${s.last_name}`)
      setTimeout(() => {
        window.open(waLink(s.parent_phone, msg), '_blank')
        setSentCount(i + 1)
      }, i * 800)
    })
    await new Promise(r => setTimeout(r, seasonStudents.length * 800 + 500))
    setInviteSending(false)
    toast(`📱 ${seasonStudents.length} veliye davet gönderildi!`, 'success')
  }

  if (loading) return (
    <AdminLayout>
      <div className="flex items-center justify-center py-24 text-gray-400">
        <div className="text-center"><div className="text-3xl mb-2 animate-pulse">⏳</div><p className="text-sm">Yükleniyor...</p></div>
      </div>
    </AdminLayout>
  )

  if (loadError) return (
    <AdminLayout>
      <Alert variant="warn">{loadError}</Alert>
      <button onClick={() => window.location.reload()} className="mt-3 px-4 py-2 bg-green-500 text-white text-sm font-bold rounded-lg">Tekrar Dene</button>
    </AdminLayout>
  )

  return (
    <AdminLayout>
      <div className="space-y-4">

        {/* Aktif Sezon */}
        {activeSeason && (
          <div className="bg-white rounded-2xl shadow-sm p-6 border-2 border-green-200">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="text-xs font-bold text-green-600 uppercase tracking-wider mb-1">Aktif Sezon</div>
                <div className="text-2xl font-extrabold text-gray-900">{activeSeason.name}</div>
                <div className="text-sm text-gray-500 mt-1">{studentsOf(activeSeason.id).length} öğrenci kayıtlı</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant="green">✅ Aktif</Badge>
                <div className="flex gap-2 flex-wrap justify-end">
                  <button onClick={() => { setEditModal(activeSeason); setEditName(activeSeason.name) }}
                    className="px-3 py-2 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50">
                    ✏️ Adı Düzenle
                  </button>
                  <button onClick={() => setConfirmModal(activeSeason)}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition-colors">
                    📦 Sezonu Kapat ve Arşivle
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-1.5">
              <div className="text-xs font-semibold text-gray-400 uppercase mb-2">Sezon Kapanınca</div>
              {['📊 Tüm öğrenci listesi Excel olarak indirilir', '📦 Bu sezon arşive taşınır, veriler korunur',
                '✨ Yeni sezon otomatik açılır, liste boşalır', '🔍 Arşivdeki velilere davet mesajı gönderilebilir']
                .map(t => <div key={t} className="text-sm text-gray-600">{t}</div>)}
            </div>
          </div>
        )}

        {/* Yeni Sezon Ekle butonu */}
        <div className="flex justify-end">
          <button onClick={() => { setAddModal(true); setNewName(''); setNewYear(new Date().getFullYear()) }}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-lg transition-colors">
            + Yeni Sezon Ekle
          </button>
        </div>

        {/* Arşivlenmiş Sezonlar */}
        <div>
          <div className="text-sm font-bold text-gray-700 mb-3">📦 Arşivlenmiş Sezonlar</div>
          {seasons.filter(s => !s.is_active).length === 0
            ? <div className="text-center py-10 text-gray-400 bg-white rounded-xl shadow-sm">
                <div className="text-4xl mb-2">📦</div>
                <p className="text-sm">Henüz arşivlenmiş sezon yok</p>
              </div>
            : seasons.filter(s => !s.is_active).reverse().map(s => {
                const cnt = studentsOf(s.id).length
                return (
                  <div key={s.id} className="bg-white rounded-xl shadow-sm p-4 mb-3 border-l-4 border-gray-300">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <div className="font-bold text-gray-700">{s.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {s.archived_at ? `${new Date(s.archived_at).toLocaleDateString('tr-TR')} tarihinde arşivlendi • ` : ''}
                          {cnt} öğrenci
                        </div>
                      </div>
                      <div className="flex gap-2 items-center flex-wrap">
                        <Badge variant="gray">📦 Arşiv</Badge>
                        <button onClick={() => { setEditModal(s); setEditName(s.name) }}
                          className="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50">
                          ✏️ Düzenle
                        </button>
                        <button onClick={() => openInvite(s)}
                          className="px-3 py-1.5 bg-[#25D366] text-white text-xs font-bold rounded-lg hover:bg-[#128C7E]">
                          📱 Velilere Davet
                        </button>
                        <button onClick={() => { exportStudentsXLSX(studentsOf(s.id), s.name); toast('Excel indiriliyor ⬇️', 'success') }}
                          className="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50">
                          ⬇ Excel
                        </button>
                        <button onClick={() => setDeleteModal(s)}
                          className="px-3 py-1.5 border border-red-200 text-red-400 text-xs font-semibold rounded-lg hover:bg-red-50">
                          🗑️ Sil
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
          }
        </div>
      </div>

      {/* Yeni Sezon Modal */}
      {addModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !adding && setAddModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-lg font-bold text-gray-900 mb-4">➕ Yeni Sezon Ekle</div>
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Sezon Adı *</label>
                <input value={newName} onChange={e => setNewName(e.target.value)}
                  placeholder="örn: 2026 Yaz Kursu"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Yıl</label>
                <input type="number" value={newYear} onChange={e => setNewYear(parseInt(e.target.value))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setAddModal(false)} disabled={adding}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl text-sm disabled:opacity-50">İptal</button>
              <button onClick={doAdd} disabled={adding}
                className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl text-sm disabled:opacity-50">
                {adding ? '⏳ Ekleniyor...' : '✅ Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Düzenle Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !editing && setEditModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-lg font-bold text-gray-900 mb-4">✏️ Sezon Adını Düzenle</div>
            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Sezon Adı *</label>
              <input value={editName} onChange={e => setEditName(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditModal(null)} disabled={editing}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl text-sm disabled:opacity-50">İptal</button>
              <button onClick={doEdit} disabled={editing}
                className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl text-sm disabled:opacity-50">
                {editing ? '⏳ Kaydediliyor...' : '✅ Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sil Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !deleting && setDeleteModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-lg font-bold text-gray-900 mb-2">🗑️ Sezonu Sil</div>
            <div className="text-sm text-gray-500 mb-4">{deleteModal.name}</div>
            <Alert variant="warn">⚠️ Bu işlem geri alınamaz. Sezon ve tüm verileri silinecek.</Alert>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setDeleteModal(null)} disabled={deleting}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl text-sm disabled:opacity-50">İptal</button>
              <button onClick={doDelete} disabled={deleting}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-sm disabled:opacity-50">
                {deleting ? '⏳ Siliniyor...' : '🗑️ Evet, Sil'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Arşivle Onay */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !archiving && setConfirmModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-xl font-bold text-gray-900 mb-1">📦 Sezonu Kapat</div>
            <div className="text-sm text-gray-500 mb-4">{confirmModal.name}</div>
            <Alert variant="warn">⚠️ Bu işlem geri alınamaz. Emin misiniz?</Alert>
            <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2">
              {[`📊 "${confirmModal.name}" Excel olarak indirilecek`, '📦 Öğrenciler arşive taşınacak',
                `✨ ${confirmModal.year + 1} Yaz Kursu oluşturulacak`, '📋 Liste boş başlayacak']
                .map(t => <div key={t} className="text-sm text-gray-700">{t}</div>)}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal(null)} disabled={archiving}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl text-sm disabled:opacity-50">İptal</button>
              <button onClick={doArchive} disabled={archiving}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm disabled:opacity-50">
                {archiving ? '⏳ İşleniyor...' : '✅ Evet, Kapat'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Davet Gönder Modal */}
      {inviteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !inviteSending && setInviteModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="text-lg font-bold text-gray-900 mb-1">📱 Velilere Davet Gönder</div>
            <div className="text-sm text-gray-500 mb-4">{inviteModal.name} — {studentsOf(inviteModal.id).length} veli</div>
            <Alert variant="info">Her veliye kişiselleştirilmiş WhatsApp mesajı gönderilecek.</Alert>
            <div className="mb-4 mt-3">
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Davet Mesajı</label>
              <textarea value={inviteMsg} onChange={e => setInviteMsg(e.target.value)} rows={8}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500 resize-none font-mono" />
              <div className="text-xs text-gray-400 mt-1">İpucu: &#123;veli&#125; veli adı, &#123;ogrenci&#125; öğrenci adıyla değiştirilir</div>
            </div>
            {inviteSending && (
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4 text-sm font-semibold text-green-700">
                📱 Gönderiliyor... {sentCount} / {studentsOf(inviteModal.id).length}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setInviteModal(null)} disabled={inviteSending}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl text-sm disabled:opacity-50">İptal</button>
              <button onClick={sendInvites} disabled={inviteSending}
                className="flex-1 py-2.5 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold rounded-xl text-sm disabled:opacity-50 transition-colors">
                {inviteSending ? 'Gönderiliyor...' : '📱 Davetleri Gönder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
