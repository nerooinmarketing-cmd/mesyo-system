import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { useToast } from '@/components/ui'
import { waLink } from '@/lib/utils'

const API = '/api'
const token = () => localStorage.getItem('mesyo_token') || ''
const apiFetch = (url: string, opts?: RequestInit) =>
  fetch(`${API}${url}`, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}`, ...(opts?.headers || {}) } })

const YAS_GRUPLARI = ['7-8', '9-10', '11-12', '13-14']

export default function KervanAdminPage() {
  const { toast } = useToast()
  const [tab, setTab] = useState<'programlar' | 'aileler' | 'siralama'>('programlar')
  const [programs, setPrograms] = useState<any[]>([])
  const [selProgram, setSelProgram] = useState<any>(null)
  const [aileler, setAileler] = useState<any[]>([])
  const [siralama, setSiralama] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [modal, setModal] = useState<'program' | 'aile' | null>(null)
  const [ogrenciler, setOgrenciler] = useState<any[]>([])

  const [programForm, setProgramForm] = useState({ program_type: 'yaz', name: '', start_date: '', end_date: '' })
  const [aileForm, setAileForm] = useState({ student_id: '', family_name: '', parent_phone: '', yas_grubu: '7-8' })

  useEffect(() => {
    apiFetch('/kervan/programs').then(r => r.json()).then(setPrograms).catch(() => {})
    apiFetch('/students').then(r => r.json()).then(setOgrenciler).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selProgram) return
    setLoading(true)
    Promise.all([
      apiFetch(`/kervan/programs/${selProgram.id}/aileler`).then(r => r.json()),
      apiFetch(`/kervan/programs/${selProgram.id}/siralama`).then(r => r.json()),
    ]).then(([a, s]) => { setAileler(a); setSiralama(s) }).finally(() => setLoading(false))
  }, [selProgram])

  const createProgram = async () => {
    if (!programForm.name || !programForm.start_date || !programForm.end_date) {
      toast('Tüm alanları doldurun', 'error'); return
    }
    const res = await apiFetch('/kervan/programs', { method: 'POST', body: JSON.stringify(programForm) })
    const d = await res.json()
    setPrograms(p => [d, ...p])
    setModal(null)
    setProgramForm({ program_type: 'yaz', name: '', start_date: '', end_date: '' })
    toast('Program oluşturuldu ✅', 'success')
  }

  const createAile = async () => {
    if (!selProgram || !aileForm.family_name || !aileForm.parent_phone) {
      toast('Tüm alanları doldurun', 'error'); return
    }
    const res = await apiFetch(`/kervan/programs/${selProgram.id}/aileler`, {
      method: 'POST',
      body: JSON.stringify({ ...aileForm, program_id: selProgram.id })
    })
    const d = await res.json()
    setAileler(a => [d, ...a])
    setModal(null)
    setAileForm({ student_id: '', family_name: '', parent_phone: '', yas_grubu: '7-8' })
    toast('Aile eklendi ✅', 'success')
  }

  const waGonder = (aile: any) => {
    const link = `${window.location.origin}/kervan/${aile.id}`
    const msg = `🐪 *Bilge Kervan* — ${aile.family_name}\n\nBugünkü yolculuk zamanı!\n📍 ${aile.current_city} üzerinden yola devam edin.\n\n👇 Oynamak için tıklayın:\n${link}`
    window.open(waLink(aile.parent_phone, msg), '_blank')
  }

  const waTopluGonder = () => {
    aileler.forEach((aile, i) => {
      setTimeout(() => waGonder(aile), i * 800)
    })
    toast(`${aileler.length} aileye gönderildi 📱`, 'success')
  }

  const SEHIR_EMOJI: Record<string, string> = {
    'Konya': '🕌', 'Aksaray': '🏰', 'Kayseri': '⛪', 'Mardin': '🏛️',
    'Urfa': '🐟', 'Antakya': '🌿', 'Halep': '📚', 'Şam': '🌹',
    'Amman': '🏜️', 'Medine': '🌙', 'Mekke': '⭐',
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        {/* Başlık */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">🐪 Bilge Kervan</h1>
            <p className="text-sm text-gray-500">Aile yolculuk oyunu</p>
          </div>
          <button onClick={() => setModal('program')}
            className="px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-amber-700">
            + Yeni Program
          </button>
        </div>

        {/* Program seç */}
        {programs.length === 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
            <div className="text-5xl mb-3">🐪</div>
            <p className="text-amber-700 font-semibold">Henüz program yok</p>
            <p className="text-amber-500 text-sm mt-1">Yaz kursu veya yıllık kurs programı oluşturun</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {programs.map(p => (
              <button key={p.id} onClick={() => { setSelProgram(p); setTab('aileler') }}
                className={`text-left p-4 rounded-xl border-2 transition-all ${
                  selProgram?.id === p.id ? 'border-amber-500 bg-amber-50' : 'border-gray-200 bg-white hover:border-amber-300'
                }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-gray-900">{p.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {p.program_type === 'yaz' ? '☀️ Yaz Kursu (6 Durak)' : '📅 Yıllık Kurs (11 Durak)'}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {new Date(p.start_date).toLocaleDateString('tr-TR')} — {new Date(p.end_date).toLocaleDateString('tr-TR')}
                    </div>
                  </div>
                  <div className="text-3xl">🐪</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Program detayı */}
        {selProgram && (
          <>
            {/* Tab */}
            <div className="flex gap-2 mb-4">
              {(['aileler', 'siralama'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    tab === t ? 'bg-amber-600 text-white' : 'bg-white text-gray-600 border border-gray-200'
                  }`}>
                  {t === 'aileler' ? '👨‍👩‍👧 Aileler' : '🏆 Sıralama'}
                </button>
              ))}
              <button onClick={waTopluGonder}
                className="ml-auto px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-bold">
                📱 Toplu Gönder
              </button>
              <button onClick={() => setModal('aile')}
                className="px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-bold">
                + Aile Ekle
              </button>
            </div>

            {/* Aileler listesi */}
            {tab === 'aileler' && (
              <div className="space-y-2">
                {loading ? (
                  <div className="text-center py-8 text-gray-400">Yükleniyor...</div>
                ) : aileler.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">Henüz aile eklenmedi</div>
                ) : aileler.map(a => (
                  <div key={a.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
                    <div className="text-3xl">{SEHIR_EMOJI[a.current_city] || '🕌'}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{a.family_name}</div>
                      <div className="text-xs text-gray-500">📍 {a.current_city} • {a.total_steps} adım • 🔥 {a.streak_days} gün seri</div>
                      <div className="text-xs text-gray-400">{a.parent_phone}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => waGonder(a)}
                        className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-bold">
                        📱 Gönder
                      </button>
                      <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/kervan/${a.id}`).then(() => toast('Link kopyalandı', 'success'))}
                        className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold">
                        🔗 Link
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sıralama */}
            {tab === 'siralama' && (
              <div className="space-y-2">
                {siralama.map((a, i) => (
                  <div key={a.id} className={`bg-white rounded-xl border p-4 flex items-center gap-3 ${
                    i === 0 ? 'border-yellow-300 bg-yellow-50' : i === 1 ? 'border-gray-300 bg-gray-50' : i === 2 ? 'border-orange-200 bg-orange-50' : 'border-gray-100'
                  }`}>
                    <div className="text-2xl font-bold w-8 text-center">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </div>
                    <div className="text-2xl">{SEHIR_EMOJI[a.current_city] || '🕌'}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{a.family_name}</div>
                      <div className="text-xs text-gray-500">📍 {a.current_city} • 🔥 {a.streak_days} gün</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-amber-600">{a.total_steps}</div>
                      <div className="text-xs text-gray-400">adım</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Program Modal */}
      {modal === 'program' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-lg mb-4">Yeni Program</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Program Türü</label>
                <select value={programForm.program_type} onChange={e => setProgramForm(p => ({ ...p, program_type: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="yaz">☀️ Yaz Kursu (6 Durak, 6 Hafta)</option>
                  <option value="yillik">📅 Yıllık Kurs (11 Durak, 12 Ay)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Program Adı</label>
                <input value={programForm.name} onChange={e => setProgramForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Yaz Kursu 2026" className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Başlangıç</label>
                  <input type="date" value={programForm.start_date} onChange={e => setProgramForm(p => ({ ...p, start_date: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Bitiş</label>
                  <input type="date" value={programForm.end_date} onChange={e => setProgramForm(p => ({ ...p, end_date: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm">İptal</button>
              <button onClick={createProgram} className="flex-1 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-bold">Oluştur</button>
            </div>
          </div>
        </div>
      )}

      {/* Aile Modal */}
      {modal === 'aile' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-lg mb-4">Aile Ekle</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Öğrenci (Opsiyonel)</label>
                <select value={aileForm.student_id} onChange={e => {
                  const s = ogrenciler.find(o => o.id === e.target.value)
                  setAileForm(p => ({
                    ...p,
                    student_id: e.target.value,
                    family_name: s ? `${s.last_name} Hanesi` : p.family_name,
                    parent_phone: s?.parent_phone || p.parent_phone,
                  }))
                }} className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  <option value="">-- Seçiniz --</option>
                  {ogrenciler.map(o => (
                    <option key={o.id} value={o.id}>{o.full_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Aile Adı</label>
                <input value={aileForm.family_name} onChange={e => setAileForm(p => ({ ...p, family_name: e.target.value }))}
                  placeholder="Yılmaz Hanesi" className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Veli Telefonu</label>
                <input value={aileForm.parent_phone} onChange={e => setAileForm(p => ({ ...p, parent_phone: e.target.value }))}
                  placeholder="05xx xxx xx xx" className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Yaş Grubu</label>
                <select value={aileForm.yas_grubu} onChange={e => setAileForm(p => ({ ...p, yas_grubu: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm">
                  {YAS_GRUPLARI.map(y => <option key={y} value={y}>{y} Yaş</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm">İptal</button>
              <button onClick={createAile} className="flex-1 py-2.5 bg-amber-600 text-white rounded-xl text-sm font-bold">Ekle</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
