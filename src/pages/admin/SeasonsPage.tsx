import { useState } from 'react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Alert, Badge, useToast } from '@/components/ui'
import { DEMO_STUDENTS, DEMO_CLASSROOMS } from '@/lib/demo-data'
import { calcAge, waLink } from '@/lib/utils'
import { exportStudentsXLSX } from '@/lib/export'

interface Season {
  id: string; name: string; year: number; archived: boolean
  archivedAt?: string; studentCount?: number
}

const DEFAULT_SEASONS: Season[] = [
  { id: 's2026', name: '2026 Yaz Kursu', year: 2026, archived: false },
]



export default function SeasonsPage() {
  const { toast } = useToast()
  const [seasons, setSeasons] = useState<Season[]>(() => {
    try { const r=localStorage.getItem('mesyo_seasons'); return r?JSON.parse(r):DEFAULT_SEASONS } catch { return DEFAULT_SEASONS }
  })
  const [students] = useState(DEMO_STUDENTS.map(s=>({...s,season_id:'s2026'})))
  const [confirmModal, setConfirmModal] = useState<Season|null>(null)
  const [archiving, setArchiving] = useState(false)
  // Davet mesajı
  const [inviteModal, setInviteModal] = useState<Season|null>(null)
  const [inviteMsg, setInviteMsg] = useState('')
  const [inviteSending, setInviteSending] = useState(false)
  const [sentCount, setSentCount] = useState(0)

  const save = (s: Season[]) => { setSeasons(s); localStorage.setItem('mesyo_seasons',JSON.stringify(s)) }
  const activeSeason = seasons.find(s=>!s.archived)

  const doArchive = async () => {
    if (!confirmModal) return
    setArchiving(true)
    const seasonStudents = students.filter(s=>s.season_id===confirmModal.id)
    exportStudentsXLSX(seasonStudents, confirmModal.name)
    toast(`📊 Excel indiriliyor...`, 'success')
    await new Promise(r=>setTimeout(r,1000))
    const nextYear = confirmModal.year + 1
    const newSeason: Season = { id:`s${nextYear}`, name:`${nextYear} Yaz Kursu`, year:nextYear, archived:false }
    const updated = seasons.map(s=>s.id===confirmModal.id
      ? {...s, archived:true, archivedAt:new Date().toLocaleDateString('tr-TR'), studentCount:seasonStudents.length}
      : s)
    updated.push(newSeason)
    save(updated)
    setConfirmModal(null); setArchiving(false)
    toast(`✅ ${confirmModal.name} arşivlendi. ${newSeason.name} oluşturuldu.`, 'success')
  }

  const openInvite = (season: Season) => {
    const nextYear = season.year + 1
    setInviteMsg(`Sayın Veli,\n\n${season.year} yılında kursumuza katıldığınız için teşekkür ederiz.\n\n${nextYear} yılı eğitim programımız yakında başlayacaktır. Çocuğunuzu yeniden aramızda görmekten mutluluk duyarız.\n\nKayıt ve bilgi için lütfen kurumumuzla iletişime geçiniz.\n\nSaygılarımızla 📚`)
    setInviteModal(season)
    setSentCount(0)
  }

  const sendInvites = async () => {
    if (!inviteModal) return
    const seasonStudents = students.filter(s=>s.season_id===inviteModal.id)
    if (!seasonStudents.length) { toast('Bu sezonda öğrenci yok','error'); return }
    setInviteSending(true)
    seasonStudents.forEach((s,i) => {
      const msg = inviteMsg.replace('{veli}', (s.parent_first_name + ' ' + s.parent_last_name)).replace('{ogrenci}', (s.first_name + ' ' + s.last_name))
      setTimeout(() => {
        window.open(waLink(s.parent_phone, msg), '_blank')
        setSentCount(i+1)
      }, i * 800)
    })
    await new Promise(r=>setTimeout(r, seasonStudents.length * 800 + 500))
    setInviteSending(false)
    toast(`📱 ${seasonStudents.length} veliye davet gönderildi!`, 'success')
  }

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
                <div className="text-sm text-gray-500 mt-1">{students.filter(s=>s.season_id===activeSeason.id).length} öğrenci kayıtlı</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant="green">✅ Aktif</Badge>
                <button onClick={() => setConfirmModal(activeSeason)}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition-colors">
                  📦 Sezonu Kapat ve Arşivle
                </button>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-1.5">
              <div className="text-xs font-semibold text-gray-400 uppercase mb-2">Sezon Kapanınca</div>
              {['📊 Tüm öğrenci listesi Excel olarak indirilir','📦 Bu sezon arşive taşınır, veriler korunur',
                '✨ Yeni sezon otomatik açılır, liste boşalır','🔍 Arşivdeki velilere davet mesajı gönderilebilir']
                .map(t=><div key={t} className="text-sm text-gray-600">{t}</div>)}
            </div>
          </div>
        )}

        {/* Arşivlenmiş Sezonlar */}
        <div>
          <div className="text-sm font-bold text-gray-700 mb-3">📦 Arşivlenmiş Sezonlar</div>
          {seasons.filter(s=>s.archived).length === 0
            ? <div className="text-center py-10 text-gray-400 bg-white rounded-xl shadow-sm">
                <div className="text-4xl mb-2">📦</div>
                <p className="text-sm">Henüz arşivlenmiş sezon yok</p>
              </div>
            : seasons.filter(s=>s.archived).reverse().map(s => {
                const cnt = students.filter(st=>st.season_id===s.id).length
                return (
                  <div key={s.id} className="bg-white rounded-xl shadow-sm p-4 mb-3 border-l-4 border-gray-300">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <div className="font-bold text-gray-700">{s.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {s.archivedAt?`${s.archivedAt} tarihinde arşivlendi • `:''}
                          {s.studentCount||cnt} öğrenci
                        </div>
                      </div>
                      <div className="flex gap-2 items-center flex-wrap">
                        <Badge variant="gray">📦 Arşiv</Badge>
                        <button onClick={() => openInvite(s)}
                          className="px-3 py-1.5 bg-[#25D366] text-white text-xs font-bold rounded-lg hover:bg-[#128C7E]">
                          📱 Velilere Davet Gönder
                        </button>
                        <button onClick={() => { exportStudentsXLSX(students.filter(st=>st.season_id===s.id),s.name); toast('Excel indiriliyor ⬇️','success') }}
                          className="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50">
                          ⬇ Excel
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
          }
        </div>
      </div>

      {/* Arşivle Onay */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={()=>!archiving&&setConfirmModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e=>e.stopPropagation()}>
            <div className="text-xl font-bold text-gray-900 mb-1">📦 Sezonu Kapat</div>
            <div className="text-sm text-gray-500 mb-4">{confirmModal.name}</div>
            <Alert variant="warn">⚠️ Bu işlem geri alınamaz. Emin misiniz?</Alert>
            <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2">
              {[`📊 "${confirmModal.name}" Excel olarak indirilecek`,'📦 Öğrenciler arşive taşınacak',
                `✨ ${confirmModal.year+1} Yaz Kursu oluşturulacak`,'📋 Liste boş başlayacak']
                .map(t=><div key={t} className="text-sm text-gray-700">{t}</div>)}
            </div>
            <div className="flex gap-3">
              <button onClick={()=>setConfirmModal(null)} disabled={archiving}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl text-sm disabled:opacity-50">İptal</button>
              <button onClick={doArchive} disabled={archiving}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm disabled:opacity-50">
                {archiving?'⏳ İşleniyor...':'✅ Evet, Kapat'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Davet Gönder Modal */}
      {inviteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={()=>!inviteSending&&setInviteModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
            <div className="text-lg font-bold text-gray-900 mb-1">📱 Velilere Davet Gönder</div>
            <div className="text-sm text-gray-500 mb-4">{inviteModal.name} — {students.filter(s=>s.season_id===inviteModal.id).length} veli</div>

            <Alert variant="info">Her veliye kişiselleştirilmiş WhatsApp mesajı gönderilecek. Sırayla açılır, gönderin.</Alert>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Davet Mesajı</label>
              <textarea value={inviteMsg} onChange={e=>setInviteMsg(e.target.value)} rows={8}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500 resize-none font-mono" />
              <div className="text-xs text-gray-400 mt-1">İpucu: &#123;veli&#125; veli adı, &#123;ogrenci&#125; öğrenci adıyla değiştirilir</div>
            </div>

            {inviteSending && (
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4 text-sm font-semibold text-green-700">
                📱 Gönderiliyor... {sentCount} / {students.filter(s=>s.season_id===inviteModal.id).length}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={()=>setInviteModal(null)} disabled={inviteSending}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl text-sm disabled:opacity-50">İptal</button>
              <button onClick={sendInvites} disabled={inviteSending}
                className="flex-1 py-2.5 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold rounded-xl text-sm disabled:opacity-50 transition-colors">
                {inviteSending?'Gönderiliyor...':'📱 Davetleri Gönder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
