import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

const API = '/api'

const SEHIR_EMOJI: Record<string, string> = {
  'Konya': '🕌', 'Aksaray': '🏰', 'Kayseri': '⛪',
  'Mardin': '🏛️', 'Urfa': '🐟', 'Antakya': '🌿',
  'Halep': '📚', 'Şam': '🌹', 'Amman': '🏜️',
  'Medine': '🌙', 'Mekke': '⭐',
}

type Ekran = 'yukleniyor' | 'ana' | 'soru' | 'veli_soru' | 'sonuc' | 'sehir' | 'bugun_oynandı'

export default function KervanOyunPage() {
  const { familyId } = useParams()
  const [ekran, setEkran] = useState<Ekran>('yukleniyor')
  const [durum, setDurum] = useState<any>(null)
  const [sorular, setSorular] = useState<any>(null)
  const [yasGrubu, setYasGrubu] = useState('7-8')
  const [cocukSec, setCocukSec] = useState<string | null>(null)
  const [veliSec, setVeliSec] = useState<string | null>(null)
  const [cocukDogru, setCocukDogru] = useState(false)
  const [veliDogru, setVeliDogru] = useState(false)
  const [cocukHiz, setCocukHiz] = useState(false)
  const [sonuc, setSonuc] = useState<any>(null)
  const [sure, setSure] = useState(15)
  const [timerActive, setTimerActive] = useState(false)
  const [hata, setHata] = useState('')

  useEffect(() => {
    if (!familyId) return
    fetch(`${API}/kervan/oyna/${familyId}`)
      .then(r => r.json())
      .then(d => {
        setDurum(d)
        if (d.bugun_oynadi) setEkran('bugun_oynandı')
        else setEkran('ana')
      })
      .catch(() => setHata('Kervan bulunamadı'))
  }, [familyId])

  // Timer
  useEffect(() => {
    if (!timerActive) return
    if (sure <= 0) {
      setTimerActive(false)
      setCocukHiz(false)
      return
    }
    const t = setTimeout(() => setSure(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [timerActive, sure])

  const sorularYukle = async (yas: string) => {
    setYasGrubu(yas)
    const res = await fetch(`${API}/kervan/oyna/${familyId}/sorular/${yas}`)
    const d = await res.json()
    setSorular(d)
    setSure(15)
    setTimerActive(true)
    setEkran('soru')
  }

  const cocukCevapla = (sik: string) => {
    if (cocukSec) return
    const dogru = sik === sorular.cocuk.dogru
    setCocukSec(sik)
    setCocukDogru(dogru)
    if (dogru && sure > 8) setCocukHiz(true)
    setTimerActive(false)
    setTimeout(() => {
      setSure(15)
      setTimerActive(false)
      setEkran('veli_soru')
    }, 1200)
  }

  const veliCevapla = async (sik: string) => {
    if (veliSec) return
    const dogru = sik === sorular.veli.dogru
    setVeliSec(sik)
    setVeliDogru(dogru)

    setTimeout(async () => {
      const res = await fetch(`${API}/kervan/oyna/${familyId}/cevap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          family_id: familyId,
          cocuk_dogru: cocukDogru,
          veli_dogru: dogru,
          cocuk_hiz: cocukHiz,
          devam: true,
        })
      })
      const s = await res.json()
      setSonuc(s)
      if (s.sehre_ulasti) setEkran('sehir')
      else setEkran('sonuc')
    }, 1200)
  }

  const ilerlemeYuzdesi = durum ? Math.round((durum.sehir_adim / durum.sehir_hedef) * 100) : 0

  if (hata) return (
    <div className="min-h-screen bg-gradient-to-b from-amber-900 to-amber-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 text-center">
        <div className="text-4xl mb-3">🐪</div>
        <p className="text-gray-700 font-semibold">{hata}</p>
      </div>
    </div>
  )

  if (ekran === 'yukleniyor') return (
    <div className="min-h-screen bg-gradient-to-b from-amber-900 to-amber-700 flex items-center justify-center">
      <div className="text-center text-white">
        <div className="text-6xl mb-4 animate-bounce">🐪</div>
        <p className="font-semibold">Kervan yükleniyor...</p>
      </div>
    </div>
  )

  if (ekran === 'bugun_oynandı') return (
    <div className="min-h-screen bg-gradient-to-b from-amber-900 to-amber-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 text-center max-w-sm w-full">
        <div className="text-5xl mb-3">✅</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Bugün Oynadınız!</h2>
        <p className="text-gray-500 text-sm mb-4">Yarın tekrar buluşacağız.</p>
        <div className="bg-amber-50 rounded-xl p-4">
          <div className="text-2xl font-bold text-amber-700">{durum?.aile?.total_steps || 0}</div>
          <div className="text-xs text-amber-600">Toplam Adım</div>
        </div>
        <div className="mt-3 text-sm text-gray-400">
          📍 {durum?.aile?.current_city} • {durum?.sira}. Sıra
        </div>
      </div>
    </div>
  )

  // ANA EKRAN
  if (ekran === 'ana') return (
    <div className="min-h-screen bg-gradient-to-b from-amber-900 via-amber-800 to-amber-700 p-4">
      <div className="max-w-sm mx-auto">
        {/* Başlık */}
        <div className="text-center pt-6 pb-4">
          <div className="text-5xl mb-1">🐪</div>
          <h1 className="text-xl font-bold text-white">Bilge Kervan</h1>
          <p className="text-amber-200 text-sm">{durum?.aile?.family_name}</p>
        </div>

        {/* Kervan kartı */}
        <div className="bg-white/10 backdrop-blur rounded-2xl p-4 mb-4 border border-white/20">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-white font-bold text-lg">
                {SEHIR_EMOJI[durum?.mevcut_sehir?.sehir] || '🕌'} {durum?.mevcut_sehir?.sehir}
              </div>
              <div className="text-amber-200 text-xs">{durum?.mevcut_sehir?.hikaye}</div>
            </div>
            <div className="text-right">
              <div className="text-white font-bold">#{durum?.sira}</div>
              <div className="text-amber-200 text-xs">Sıra</div>
            </div>
          </div>

          {/* İlerleme çubuğu */}
          <div className="mb-2">
            <div className="flex justify-between text-xs text-amber-200 mb-1">
              <span>{durum?.sehir_adim} adım</span>
              <span>Hedef: {durum?.sehir_hedef}</span>
            </div>
            <div className="bg-white/20 rounded-full h-3">
              <div className="bg-amber-400 h-3 rounded-full transition-all"
                style={{ width: `${Math.min(ilerlemeYuzdesi, 100)}%` }} />
            </div>
            <div className="text-amber-200 text-xs mt-1 text-right">%{ilerlemeYuzdesi}</div>
          </div>

          {durum?.sonraki_sehir && (
            <div className="text-amber-200 text-xs text-center mt-2">
              ➡️ Sonraki: {SEHIR_EMOJI[durum.sonraki_sehir.sehir] || '🕌'} {durum.sonraki_sehir.sehir}
            </div>
          )}
        </div>

        {/* Toplam bilgi */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Toplam Adım', value: durum?.aile?.total_steps || 0, icon: '👣' },
            { label: 'Seri', value: `${durum?.aile?.streak_days || 0} gün`, icon: '🔥' },
            { label: 'Şehir', value: `${durum?.sehir_idx + 1}/${durum?.rota?.length}`, icon: '📍' },
          ].map(i => (
            <div key={i.label} className="bg-white/10 rounded-xl p-3 text-center border border-white/20">
              <div className="text-xl">{i.icon}</div>
              <div className="text-white font-bold text-sm">{i.value}</div>
              <div className="text-amber-200 text-[10px]">{i.label}</div>
            </div>
          ))}
        </div>

        {/* Yaş grubu seçimi */}
        <div className="bg-white rounded-2xl p-4">
          <p className="text-gray-700 font-semibold text-sm mb-3 text-center">
            Çocuğunuzun yaş grubunu seçin
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { yas: '7-8', label: '7-8 Yaş', desc: 'Temel sorular', emoji: '🌱' },
              { yas: '9-10', label: '9-10 Yaş', desc: 'Orta seviye', emoji: '📖' },
              { yas: '11-12', label: '11-12 Yaş', desc: 'İleri seviye', emoji: '🎓' },
              { yas: '13-14', label: '13-14 Yaş', desc: 'Uzman', emoji: '⭐' },
            ].map(g => (
              <button key={g.yas} onClick={() => sorularYukle(g.yas)}
                className="bg-amber-50 border-2 border-amber-200 rounded-xl p-3 text-center hover:bg-amber-100 active:scale-95 transition-all">
                <div className="text-2xl">{g.emoji}</div>
                <div className="text-amber-900 font-bold text-sm">{g.label}</div>
                <div className="text-amber-600 text-xs">{g.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Yol haritası */}
        <div className="mt-4 bg-white/10 rounded-2xl p-4 border border-white/20">
          <p className="text-amber-200 text-xs font-bold uppercase mb-3">Yol Haritası</p>
          <div className="space-y-1.5">
            {durum?.rota?.map((s: any, i: number) => {
              const gecildi = i < durum.sehir_idx
              const mevcut = i === durum.sehir_idx
              return (
                <div key={s.sehir} className={`flex items-center gap-2 text-sm ${
                  gecildi ? 'text-green-300' : mevcut ? 'text-white' : 'text-white/40'
                }`}>
                  <span>{gecildi ? '✅' : mevcut ? '📍' : '○'}</span>
                  <span className={mevcut ? 'font-bold' : ''}>{SEHIR_EMOJI[s.sehir]} {s.sehir}</span>
                  {mevcut && <span className="text-amber-300 text-xs">(Buradasınız)</span>}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )

  // ÇOCUK SORUSU
  if (ekran === 'soru') return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-700 p-4 flex flex-col">
      <div className="max-w-sm mx-auto w-full flex-1 flex flex-col">
        <div className="text-center pt-6 pb-4">
          <div className="text-4xl mb-1">👦</div>
          <h2 className="text-white font-bold">Çocuk Sorusu</h2>
          <p className="text-blue-200 text-xs">Konu: {sorular?.konu}</p>
        </div>

        {/* Timer */}
        <div className="flex justify-center mb-4">
          <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center font-bold text-xl ${
            sure <= 5 ? 'border-red-400 text-red-300' : 'border-blue-300 text-white'
          }`}>
            {sure}
          </div>
        </div>

        <div className="bg-white/10 rounded-2xl p-4 mb-4 border border-white/20 flex-1 flex flex-col justify-center">
          <p className="text-white font-semibold text-center text-lg leading-snug mb-6">
            {sorular?.cocuk?.soru}
          </p>
          <div className="grid grid-cols-1 gap-2">
            {['a', 'b', 'c', 'd'].map(sik => {
              const isSelected = cocukSec === sik
              const isDogru = sik === sorular?.cocuk?.dogru
              let cls = 'bg-white/10 border border-white/30 text-white'
              if (isSelected && isDogru) cls = 'bg-green-500 border-green-400 text-white'
              if (isSelected && !isDogru) cls = 'bg-red-500 border-red-400 text-white'
              if (cocukSec && !isSelected && isDogru) cls = 'bg-green-500/50 border-green-400 text-white'
              return (
                <button key={sik} onClick={() => cocukCevapla(sik)}
                  className={`${cls} rounded-xl py-3 px-4 text-left font-medium transition-all active:scale-98 text-sm`}>
                  <span className="font-bold mr-2 uppercase">{sik})</span>
                  {sorular?.cocuk?.[sik]}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )

  // VELİ SORUSU
  if (ekran === 'veli_soru') return (
    <div className="min-h-screen bg-gradient-to-b from-green-900 to-green-700 p-4 flex flex-col">
      <div className="max-w-sm mx-auto w-full flex-1 flex flex-col">
        <div className="text-center pt-6 pb-4">
          <div className="text-4xl mb-1">👨</div>
          <h2 className="text-white font-bold">Veli Sorusu</h2>
          <p className="text-green-200 text-xs">Çocuğunuz size anlattı mı?</p>
        </div>

        {/* Çocuk sonucu */}
        <div className={`rounded-xl p-3 mb-4 text-center text-sm font-semibold ${
          cocukDogru ? 'bg-green-500/30 text-green-200' : 'bg-red-500/30 text-red-200'
        }`}>
          {cocukDogru ? '✅ Çocuğunuz doğru cevapladı! +20 adım' : '❌ Çocuğunuz bu sefer bilemedi'}
        </div>

        <div className="bg-white/10 rounded-2xl p-4 border border-white/20 flex-1 flex flex-col justify-center">
          <p className="text-white font-semibold text-center text-lg leading-snug mb-6">
            {sorular?.veli?.soru}
          </p>
          <div className="grid grid-cols-1 gap-2">
            {['a', 'b', 'c', 'd'].map(sik => {
              const isSelected = veliSec === sik
              const isDogru = sik === sorular?.veli?.dogru
              let cls = 'bg-white/10 border border-white/30 text-white'
              if (isSelected && isDogru) cls = 'bg-green-500 border-green-400 text-white'
              if (isSelected && !isDogru) cls = 'bg-red-500 border-red-400 text-white'
              if (veliSec && !isSelected && isDogru) cls = 'bg-green-500/50 border-green-400 text-white'
              return (
                <button key={sik} onClick={() => veliCevapla(sik)}
                  className={`${cls} rounded-xl py-3 px-4 text-left font-medium transition-all active:scale-98 text-sm`}>
                  <span className="font-bold mr-2 uppercase">{sik})</span>
                  {sorular?.veli?.[sik]}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )

  // SONUÇ EKRANI
  if (ekran === 'sonuc') return (
    <div className="min-h-screen bg-gradient-to-b from-amber-900 to-amber-700 flex items-center justify-center p-4">
      <div className="max-w-sm w-full">
        <div className="bg-white rounded-2xl p-6 text-center">
          <div className="text-5xl mb-3">🐪</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Bugünkü Yolculuk</h2>
          <p className="text-gray-500 text-sm mb-5">Kervanınız ilerledi!</p>

          <div className="space-y-2 mb-5">
            {[
              { label: 'Devam Puanı', val: sonuc?.devam_puan, icon: '🕌', color: 'blue' },
              { label: 'Çocuk Sorusu', val: sonuc?.cocuk_puan, icon: '👦', color: 'purple' },
              { label: 'Veli Sorusu', val: sonuc?.veli_puan, icon: '👨', color: 'green' },
              { label: 'Bonus', val: sonuc?.bonus, icon: '⚡', color: 'amber' },
            ].map(i => (
              <div key={i.label} className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600 text-sm">{i.icon} {i.label}</span>
                <span className={`font-bold text-${i.color}-600`}>+{i.val}</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-2">
              <span className="font-bold text-gray-900">Toplam Adım</span>
              <span className="font-bold text-amber-600 text-xl">+{sonuc?.toplam_adim} 👣</span>
            </div>
          </div>

          {/* İlerleme */}
          <div className="bg-amber-50 rounded-xl p-3 mb-4">
            <div className="flex justify-between text-xs text-amber-700 mb-1">
              <span>{sonuc?.sehir_adim} adım</span>
              <span>Hedef: {sonuc?.sehir_hedef}</span>
            </div>
            <div className="bg-amber-200 rounded-full h-3">
              <div className="bg-amber-500 h-3 rounded-full transition-all"
                style={{ width: `${Math.min(Math.round((sonuc?.sehir_adim / sonuc?.sehir_hedef) * 100), 100)}%` }} />
            </div>
          </div>

          <p className="text-gray-400 text-xs">Yarın tekrar görüşürüz! 🌙</p>
        </div>
      </div>
    </div>
  )

  // ŞEHİR GEÇİŞ EKRANI
  if (ekran === 'sehir') return (
    <div className="min-h-screen bg-gradient-to-b from-green-900 to-green-700 flex items-center justify-center p-4">
      <div className="max-w-sm w-full text-center">
        <div className="text-7xl mb-4 animate-bounce">
          {SEHIR_EMOJI[sonuc?.yeni_sehir] || '🕌'}
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">
          {sonuc?.yeni_sehir}'ye Ulaştınız!
        </h1>
        <p className="text-green-200 text-sm mb-6 leading-relaxed px-4">
          {sonuc?.yeni_sehir_hikaye}
        </p>

        <div className="bg-white/10 rounded-2xl p-4 mb-6 border border-white/20">
          <div className="text-white font-bold text-2xl">+{sonuc?.toplam_adim} 👣</div>
          <div className="text-green-200 text-sm">Bugünkü adım</div>
        </div>

        <div className="bg-yellow-400 text-yellow-900 font-bold py-2 px-4 rounded-xl inline-block mb-4">
          🏆 Yeni Rozet: "{sonuc?.yeni_sehir} Kervanı"
        </div>

        <p className="text-green-200 text-sm">Yolculuk devam ediyor! 🐪</p>
      </div>
    </div>
  )

  return null
}
