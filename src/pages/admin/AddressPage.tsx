import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Card, CardHeader, CardTitle, CardBody, Button, Alert, useToast } from '@/components/ui'

type MahalleMap = Record<string, string[]>

// tradres.com.tr API — ücretsiz Türkiye adres API
// GET https://tradres.com.tr/api/neighborhoods?city=42&district=ID
// GET https://tradres.com.tr/api/streets?city=42&district=ID&neighborhood=ID
const TRADRES_BASE = 'https://tradres.com.tr/api'

// Konya ilçeleri (sabit - API'den çekilebilir)
const KONYA_DISTRICTS = [
  { id: 736, name: 'Meram' },
  { id: 737, name: 'Selçuklu' },
  { id: 735, name: 'Karatay' },
  { id: 738, name: 'Akşehir' },
  { id: 739, name: 'Beyşehir' },
  { id: 740, name: 'Ereğli' },
]

// Fallback — API çalışmazsa
const FALLBACK: MahalleMap = {
  'Karacihan': ['Çiçek Sok.', 'Gül Sok.', 'Lale Sok.', 'Cumhuriyet Cad.', 'Atatürk Cad.'],
  'Havzan': ['Çiçek Sok.', 'Lale Sok.', 'Gül Sok.', 'Yıldız Sok.'],
  'Meram': ['Atatürk Cad.', 'İstiklal Sok.', 'Cumhuriyet Cad.'],
  'Selçuklu': ['Ankara Cad.', 'Konya Cad.', 'Fatih Sok.'],
}

export default function AddressPage() {
  const { toast } = useToast()
  const [mahalleler, setMahalleler] = useState<MahalleMap>(FALLBACK)
  const [newMahalle, setNewMahalle] = useState('')
  const [selMahalle, setSelMahalle] = useState('')
  const [newSokak, setNewSokak] = useState('')
  const [apiLoading, setApiLoading] = useState(false)
  const [selDistrict, setSelDistrict] = useState('')
  const [apiMahalleler, setApiMahalleler] = useState<any[]>([])
  const [apiSokaklar, setApiSokaklar] = useState<any[]>([])
  const [selApiMahalle, setSelApiMahalle] = useState('')

  const loadApiMahalleler = async (districtId: string) => {
    setApiLoading(true)
    try {
      const res = await fetch(`${TRADRES_BASE}/neighborhoods?city=42&district=${districtId}`)
      if (res.ok) {
        const data = await res.json()
        setApiMahalleler(data.data || data || [])
      }
    } catch {
      toast('API bağlantısı kurulamadı, manuel ekleme yapabilirsiniz', 'info')
    }
    setApiLoading(false)
  }

  const loadApiSokaklar = async (neighborhoodId: string) => {
    setApiLoading(true)
    try {
      const res = await fetch(`${TRADRES_BASE}/streets?city=42&district=${selDistrict}&neighborhood=${neighborhoodId}`)
      if (res.ok) {
        const data = await res.json()
        setApiSokaklar(data.data || data || [])
      }
    } catch {}
    setApiLoading(false)
  }

  const importFromApi = (mahalleName: string, sokaklar: string[]) => {
    setMahalleler(p => ({
      ...p,
      [mahalleName]: [...new Set([...(p[mahalleName] || []), ...sokaklar])]
    }))
    toast(`${mahalleName} eklendi ✅`, 'success')
  }

  // Manuel ekle
  const addMahalle = () => {
    const v = newMahalle.trim()
    if (!v) { toast('Mahalle adı girin', 'error'); return }
    if (mahalleler[v]) { toast('Bu mahalle zaten var', 'error'); return }
    setMahalleler(p => ({ ...p, [v]: [] }))
    setNewMahalle(''); toast(`${v} eklendi ✅`, 'success')
  }

  const removeMahalle = (m: string) => {
    if (!confirm(`"${m}" ve tüm sokaklarını sil?`)) return
    setMahalleler(p => { const n = { ...p }; delete n[m]; return n })
    if (selMahalle === m) setSelMahalle('')
    toast(`${m} silindi`, 'info')
  }

  const addSokak = () => {
    const v = newSokak.trim()
    if (!selMahalle || !v) { toast('Mahalle seçin ve sokak adı girin', 'error'); return }
    if (mahalleler[selMahalle]?.includes(v)) { toast('Bu sokak zaten var', 'error'); return }
    setMahalleler(p => ({ ...p, [selMahalle]: [...(p[selMahalle] || []), v] }))
    setNewSokak(''); toast(`${v} eklendi ✅`, 'success')
  }

  const removeSokak = (m: string, s: string) => {
    setMahalleler(p => ({ ...p, [m]: p[m].filter(x => x !== s) }))
  }

  const keys = Object.keys(mahalleler)

  return (
    <AdminLayout>
      <div className="space-y-4">
        <Alert variant="info">
          🗺️ Kayıt formunda sadece buraya eklediğiniz mahalle ve sokaklar görünür.
          <strong> tradres.com.tr</strong> API'si ile Konya mahallelerini otomatik yükleyebilirsiniz.
        </Alert>

        {/* API ile İçe Aktar */}
        <Card>
          <CardHeader><CardTitle>🌐 API ile Mahalle/Sokak Yükle</CardTitle></CardHeader>
          <CardBody>
            <div className="flex gap-2 mb-3 flex-wrap">
              <select value={selDistrict} onChange={e => { setSelDistrict(e.target.value); loadApiMahalleler(e.target.value); setSelApiMahalle(''); setApiSokaklar([]) }}
                className="flex-1 min-w-40 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500">
                <option value="">Konya İlçesi Seçin</option>
                {KONYA_DISTRICTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              {apiLoading && <span className="text-sm text-gray-400 py-2">Yükleniyor...</span>}
            </div>

            {apiMahalleler.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-500 mb-2 uppercase">Mahalle Seç ({apiMahalleler.length})</div>
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto mb-3">
                  {apiMahalleler.map((m: any) => {
                    const name = m.name || m.mahalle_adi || m.neighborhood_name || String(m)
                    const exists = !!mahalleler[name]
                    return (
                      <button key={m.id || name}
                        onClick={() => { setSelApiMahalle(String(m.id || name)); loadApiSokaklar(String(m.id || '')) }}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${selApiMahalle === String(m.id || name) ? 'border-green-500 bg-green-50 text-green-700' : exists ? 'border-gray-200 bg-gray-50 text-gray-400' : 'border-gray-200 text-gray-600 hover:border-green-400'}`}>
                        {exists ? '✅ ' : ''}{name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {apiSokaklar.length > 0 && selApiMahalle && (
              <div>
                <div className="text-xs font-semibold text-gray-500 mb-2 uppercase">Sokaklar ({apiSokaklar.length})</div>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto mb-3">
                  {apiSokaklar.slice(0, 30).map((s: any) => {
                    const name = s.name || s.sokak_adi || s.street_name || String(s)
                    return <span key={s.id || name} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">{name}</span>
                  })}
                </div>
                <button
                  onClick={() => {
                    const mahalle = apiMahalleler.find((m: any) => String(m.id || m) === selApiMahalle)
                    const mahalleName = mahalle ? (mahalle.name || mahalle.mahalle_adi || String(mahalle)) : ''
                    const sokakNames = apiSokaklar.map((s: any) => s.name || s.sokak_adi || s.street_name || String(s))
                    if (mahalleName) importFromApi(mahalleName, sokakNames)
                  }}
                  className="px-4 py-2 bg-green-500 text-white text-sm font-bold rounded-lg hover:bg-green-600">
                  + Bu Mahalleyi ve Sokaklarını Ekle
                </button>
              </div>
            )}
          </CardBody>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Mahalleler */}
          <Card>
            <CardHeader><CardTitle>🏘️ Mahalleler ({keys.length})</CardTitle></CardHeader>
            <CardBody>
              <div className="flex gap-2 mb-3">
                <input value={newMahalle} onChange={e => setNewMahalle(e.target.value)} placeholder="Mahalle adı..."
                  onKeyDown={e => e.key === 'Enter' && addMahalle()}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
                <Button size="sm" onClick={addMahalle}>+ Ekle</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {keys.length === 0
                  ? <p className="text-sm text-gray-400">Henüz mahalle yok</p>
                  : keys.map(m => (
                      <span key={m} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 text-green-800 text-sm font-semibold rounded-full">
                        {m} ({mahalleler[m].length})
                        <button onClick={() => removeMahalle(m)} className="text-gray-400 hover:text-red-500 text-base leading-none transition-colors">×</button>
                      </span>
                    ))
                }
              </div>
            </CardBody>
          </Card>

          {/* Sokaklar */}
          <Card>
            <CardHeader><CardTitle>🛣️ Sokaklar</CardTitle></CardHeader>
            <CardBody>
              <div className="mb-3">
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Mahalle Seçin</label>
                <select value={selMahalle} onChange={e => setSelMahalle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500">
                  <option value="">— Seçin —</option>
                  {keys.map(m => <option key={m} value={m}>{m} ({mahalleler[m].length} sokak)</option>)}
                </select>
              </div>
              {selMahalle ? (
                <>
                  <div className="flex gap-2 mb-3">
                    <input value={newSokak} onChange={e => setNewSokak(e.target.value)} placeholder="Sokak adı..."
                      onKeyDown={e => e.key === 'Enter' && addSokak()}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
                    <Button size="sm" onClick={addSokak}>+ Ekle</Button>
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                    {(mahalleler[selMahalle] || []).length === 0
                      ? <p className="text-sm text-gray-400">Henüz sokak yok</p>
                      : (mahalleler[selMahalle] || []).map(s => (
                          <span key={s} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 text-green-800 text-sm font-semibold rounded-full">
                            {s}
                            <button onClick={() => removeSokak(selMahalle, s)} className="text-gray-400 hover:text-red-500 text-base leading-none">×</button>
                          </span>
                        ))
                    }
                  </div>
                </>
              ) : (
                <div className="text-center py-6 text-gray-400 text-sm">Önce mahalle seçin</div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Özet */}
        <Card>
          <CardHeader><CardTitle>📋 Özet</CardTitle></CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-400 uppercase">Mahalle</th>
                  <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-400 uppercase">Sokak</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {keys.map(m => (
                  <tr key={m} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-semibold">{m}</td>
                    <td className="px-4 py-2.5 text-gray-500">{mahalleler[m].length} sokak</td>
                    <td className="px-4 py-2.5">
                      <button onClick={() => setSelMahalle(m)} className="text-xs text-green-600 font-semibold hover:underline">Düzenle</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
