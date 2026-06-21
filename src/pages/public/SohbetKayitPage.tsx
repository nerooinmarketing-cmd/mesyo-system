import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

export default function SohbetKayitPage() {
  const { sohbetId } = useParams<{ sohbetId: string }>()
  const [sohbet, setSohbet] = useState<any>(null)
  const [screen, setScreen] = useState<'loading'|'form'|'success'|'error'>('loading')
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', meslek: '', katiliyor: true })
  const [saving, setSaving] = useState(false)
  const [errMsg, setErrMsg] = useState('')

  useEffect(() => {
    if (!sohbetId) return
    fetch(`/api/sohbet/public/${sohbetId}`)
      .then(r => r.json())
      .then(d => {
        if (d.detail) { setScreen('error'); return }
        setSohbet(d)
        setScreen('form')
      })
      .catch(() => setScreen('error'))
  }, [sohbetId])

  const submit = async () => {
    if (!form.first_name || !form.last_name || !form.phone) { setErrMsg('Ad, soyad ve telefon zorunlu'); return }
    setSaving(true); setErrMsg('')
    try {
      const res = await fetch(`/api/sohbet/public/${sohbetId}/kayit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      }).then(r => r.json())
      setScreen('success')
    } catch {
      setErrMsg('Bir hata oluştu, tekrar deneyin')
    } finally {
      setSaving(false)
    }
  }

  if (screen === 'loading') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center"><div className="text-5xl mb-3 animate-bounce">🕌</div><div className="text-gray-500">Yükleniyor...</div></div>
    </div>
  )

  if (screen === 'error') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center"><div className="text-5xl mb-3">😔</div><div className="text-xl font-bold text-gray-800">Sohbet Bulunamadı</div></div>
    </div>
  )

  if (screen === 'success') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="text-6xl mb-4">{form.katiliyor ? '✅' : '🙏'}</div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
            {form.katiliyor ? 'Kaydınız Alındı!' : 'Teşekkürler!'}
          </h2>
          <p className="text-gray-500 text-sm mb-4">
            {form.katiliyor
              ? `${sohbet?.event_date} tarihli sohbete katılımınız kaydedildi.`
              : 'Mazeretiniz not alındı. Bir sonraki sohbette görüşürüz.'}
          </p>
          <div className="bg-green-50 rounded-2xl p-4 text-left">
            <div className="text-sm font-bold text-green-800">{sohbet?.title}</div>
            <div className="text-xs text-green-600 mt-1">📅 {sohbet?.event_date} — ⏰ {sohbet?.event_time?.slice(0,5)}</div>
            {sohbet?.location && <div className="text-xs text-green-600">📍 {sohbet.location}</div>}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Sohbet bilgisi */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-[#1B4332] rounded-full flex items-center justify-center text-4xl mx-auto mb-3 shadow-lg">🕌</div>
          <h1 className="text-2xl font-extrabold text-gray-900">{sohbet?.title}</h1>
          <div className="text-gray-400 text-sm mt-1">📅 {sohbet?.event_date} — ⏰ {sohbet?.event_time?.slice(0,5)}</div>
          {sohbet?.location && <div className="text-gray-400 text-sm">📍 {sohbet.location}</div>}
          {sohbet?.topic && <div className="text-green-700 text-sm font-semibold mt-1">📖 {sohbet.topic}</div>}
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4 text-center">Katılım Kaydı</h2>

          {errMsg && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2 rounded-xl mb-3">{errMsg}</div>}

          <div className="space-y-3 mb-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Ad *</label>
                <input value={form.first_name} onChange={e => setForm(f => ({...f, first_name: e.target.value}))}
                  placeholder="Adınız"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Soyad *</label>
                <input value={form.last_name} onChange={e => setForm(f => ({...f, last_name: e.target.value}))}
                  placeholder="Soyadınız"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Telefon *</label>
              <input type="tel" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))}
                placeholder="05XX XXX XX XX"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Meslek</label>
              <input value={form.meslek} onChange={e => setForm(f => ({...f, meslek: e.target.value}))}
                placeholder="Mesleğiniz (opsiyonel)"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500" />
            </div>
          </div>

          {/* Katılım seçimi */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <button onClick={() => setForm(f => ({...f, katiliyor: true}))}
              className={`py-3 rounded-2xl border-2 font-bold text-sm transition-all ${form.katiliyor?'border-green-500 bg-green-50 text-green-700':'border-gray-200 text-gray-500'}`}>
              ✅ Katılıyorum
            </button>
            <button onClick={() => setForm(f => ({...f, katiliyor: false}))}
              className={`py-3 rounded-2xl border-2 font-bold text-sm transition-all ${!form.katiliyor?'border-red-400 bg-red-50 text-red-600':'border-gray-200 text-gray-500'}`}>
              ❌ Katılamıyorum
            </button>
          </div>

          <button onClick={submit} disabled={saving}
            className="w-full py-4 bg-[#1B4332] hover:bg-green-800 text-white font-extrabold text-lg rounded-2xl disabled:opacity-40 transition-colors shadow-md">
            {saving ? '⏳ Kaydediliyor...' : 'Kaydet →'}
          </button>
        </div>
      </div>
    </div>
  )
}
