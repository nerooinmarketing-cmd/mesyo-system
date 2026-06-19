import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { calcAge } from '@/lib/utils'
import { publicApi, studentsApi } from '@/lib/api'

type Step = 'form' | 'success' | 'error' | 'not-found'

export default function RegisterPage() {
  const { slug } = useParams<{ slug: string }>()
  const [inst, setInst] = useState<{ name: string; city: string; district: string; allowed_districts: string[] | null; allowed_mahalles: string[] | null } | null>(null)
  const [addressData, setAddressData] = useState<Record<string, Record<string, string[]>>>({})
  const [step, setStep] = useState<Step>('form')
  const [loading, setLoading] = useState(false)
  const [ageWarn, setAgeWarn] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [form, setForm] = useState({
    first_name:'', last_name:'', birth_date:'', gender:'', tc_no:'',
    city:'', district:'', mahalle:'', sokak:'',
    parent_first_name:'', parent_last_name:'', parent_phone:'', parent_phone2:'',
    address:'', notes:'', kvkk:false
  })
  const [errors, setErrors] = useState<Record<string,string>>({})

  useEffect(() => {
    if (!slug) return
    Promise.all([
      publicApi.institutionBySlug(slug),
      fetch('/turkey-address.json').then(r => r.json()),
    ]).then(([instData, addrData]) => {
      setInst({
        name: instData.name,
        city: instData.city,
        district: instData.district,
        allowed_districts: instData.allowed_districts,
        allowed_mahalles: instData.allowed_mahalles,
      })
      setAddressData(addrData)
      // Kurumun şehir/ilçesini form'a doldur
      setForm(p => ({
        ...p,
        city: instData.city || 'Konya',
        district: instData.district || '',
      }))
    }).catch(() => setStep('not-found'))
  }, [slug])

  // Kurumun şehir/ilçesine göre mahalle listesi
  // allowed_districts varsa onu kullan, yoksa kurumun district'ini kullan
  const cityKey = (inst?.city || '').toUpperCase()
  const districtKey = (
    inst?.allowed_districts && inst.allowed_districts.length > 0
      ? inst.allowed_districts[0]
      : (inst?.district || '')
  ).toUpperCase()
  const allMahalles: string[] = addressData[cityKey]?.[districtKey] || []

  // allowed_mahalles seçilmişse filtrele, yoksa tümünü göster
  const mahalleList = (inst?.allowed_mahalles && inst.allowed_mahalles.length > 0)
    ? allMahalles.filter(m => inst.allowed_mahalles!.includes(m))
    : allMahalles

  const f = (k: string, v: string) => {
    setForm(p => ({ ...p, [k]: v }))
    setErrors(p => { const n = {...p}; delete n[k]; return n })
  }

  const checkAge = (date: string) => {
    if (!date) { setAgeWarn(''); return }
    const a = calcAge(date)
    if (a < 7) setAgeWarn(`Çocuğunuz henüz 7 yaşını doldurmamış (${a} yaş). Başvuru alınır, yönetici değerlendirir.`)
    else if (a > 14) setAgeWarn(`Çocuğunuz 14 yaşından büyük (${a} yaş). Başvuru alınır, yönetici değerlendirir.`)
    else setAgeWarn('')
  }

  const validate = () => {
    const e: Record<string,string> = {}
    if (!form.first_name.trim()) e.first_name = 'Ad zorunlu'
    if (!form.last_name.trim()) e.last_name = 'Soyad zorunlu'
    if (form.tc_no && !/^\d{11}$/.test(form.tc_no)) e.tc_no = '11 haneli olmalı'
    if (!form.birth_date) e.birth_date = 'Doğum tarihi zorunlu'
    if (!form.gender) e.gender = 'Cinsiyet seçin'
    if (!form.mahalle) e.mahalle = 'Mahalle seçin'
    if (!form.parent_first_name.trim()) e.parent_first_name = 'Veli adı zorunlu'
    if (!form.parent_last_name.trim()) e.parent_last_name = 'Veli soyadı zorunlu'
    if (!form.parent_phone.trim()) e.parent_phone = 'Telefon zorunlu'
    else if (!/^0[5][0-9]{9}$/.test(form.parent_phone.replace(/\s/g,''))) e.parent_phone = 'Geçerli telefon girin (05XX...)'
    if (!form.kvkk) e.kvkk = 'Onay vermeniz gerekiyor'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async () => {
    if (!validate() || !slug) return
    setLoading(true)
    try {
      await studentsApi.publicRegister(slug, {
        ...form,
        city: inst?.city || form.city,
        district: districtKey ? districtKey.charAt(0) + districtKey.slice(1).toLowerCase() : form.district,
        registration_source: 'form',
        status: 'pending',
      } as any)
      setStep('success')
    } catch (e: any) {
      setErrorMsg(e.message || 'Başvuru gönderilirken bir hata oluştu')
      setStep('error')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => setForm({
    first_name:'', last_name:'', birth_date:'', gender:'', tc_no:'',
    city:'Konya', district:'Meram', mahalle:'', sokak:'',
    parent_first_name:'', parent_last_name:'', parent_phone:'', parent_phone2:'',
    address:'', notes:'', kvkk:false
  })

  if (step === 'success') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-sm w-full">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">✅</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Başvurunuz Alındı!</h1>
        <p className="text-gray-500 text-sm mb-2">
          <strong>{form.first_name} {form.last_name}</strong> için başvurunuz {inst?.name} yönetimine iletildi.
        </p>
        <p className="text-gray-400 text-xs mb-6">Yönetici onayladıktan sonra <strong>{form.parent_phone}</strong> numaralı telefonunuza bilgi verilecektir.</p>
        <button onClick={() => { setStep('form'); resetForm() }}
          className="text-green-600 text-sm font-semibold hover:underline">Yeni kayıt yap</button>
      </div>
    </div>
  )

  if (step === 'not-found') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-sm w-full">
        <div className="text-4xl mb-4">🔍</div>
        <h1 className="text-lg font-bold text-gray-900 mb-2">Kurum Bulunamadı</h1>
        <p className="text-gray-500 text-sm">Bu kayıt linki geçersiz veya kurumun paneli şu anda aktif değil. Lütfen kurumla iletişime geçin.</p>
      </div>
    </div>
  )

  if (step === 'error') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-sm w-full">
        <div className="text-4xl mb-4">⚠️</div>
        <h1 className="text-lg font-bold text-gray-900 mb-2">Bir hata oluştu</h1>
        <p className="text-gray-500 text-sm mb-4">{errorMsg || 'Lütfen tekrar deneyin.'}</p>
        <button onClick={() => setStep('form')} className="px-4 py-2 bg-green-500 text-white font-bold rounded-lg text-sm">Tekrar Dene</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="bg-[#1B4332] px-4 pt-8 pb-6 text-center relative">
        <div className="text-3xl mb-2">📚</div>
        <div className="text-white font-bold text-xl">{inst?.name || 'Yükleniyor...'}</div>
        <div className="text-white/60 text-sm mt-1">Öğrenci Kayıt Formu</div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-2">
        <div className="bg-white rounded-2xl shadow-lg p-5 mb-4 mt-4">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <span className="text-green-500 font-bold">①</span>
            <span className="text-sm font-bold text-gray-900">Öğrenci Bilgileri</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Ad *</label>
              <input value={form.first_name} onChange={e => f('first_name', e.target.value)} placeholder="Öğrenci adı"
                className={`w-full px-3 py-2.5 border-[1.5px] rounded-lg text-sm outline-none transition-all ${errors.first_name?'border-red-400 bg-red-50':'border-gray-200 focus:border-green-500'}`} />
              {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Soyad *</label>
              <input value={form.last_name} onChange={e => f('last_name', e.target.value)} placeholder="Öğrenci soyadı"
                className={`w-full px-3 py-2.5 border-[1.5px] rounded-lg text-sm outline-none transition-all ${errors.last_name?'border-red-400 bg-red-50':'border-gray-200 focus:border-green-500'}`} />
              {errors.last_name && <p className="text-xs text-red-500 mt-1">{errors.last_name}</p>}
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">T.C. No (opsiyonel)</label>
            <input value={form.tc_no} onChange={e => f('tc_no', e.target.value.replace(/\D/g,'').slice(0,11))}
              placeholder="11 haneli T.C. No" inputMode="numeric"
              className={`w-full px-3 py-2.5 border-[1.5px] rounded-lg text-sm outline-none transition-all ${errors.tc_no?'border-red-400 bg-red-50':'border-gray-200 focus:border-green-500'}`} />
            {errors.tc_no && <p className="text-xs text-red-500 mt-1">{errors.tc_no}</p>}
          </div>

          <div className="mb-3">
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Doğum Tarihi *</label>
            <input type="date" value={form.birth_date}
              onChange={e => { f('birth_date', e.target.value); checkAge(e.target.value) }}
              className={`w-full px-3 py-2.5 border-[1.5px] rounded-lg text-sm outline-none transition-all ${errors.birth_date?'border-red-400 bg-red-50':'border-gray-200 focus:border-green-500'}`} />
            {errors.birth_date && <p className="text-xs text-red-500 mt-1">{errors.birth_date}</p>}
            {form.birth_date && !errors.birth_date && (
              <p className={`text-xs mt-1 font-semibold ${ageWarn?'text-amber-600':'text-green-600'}`}>
                {ageWarn || `✅ ${calcAge(form.birth_date)} yaş — uygun`}
              </p>
            )}
          </div>

          <div className="mb-1">
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Cinsiyet *</label>
            <div className="grid grid-cols-2 gap-2">
              {[['erkek','👦 Erkek'],['kiz','👧 Kız']].map(([v,l]) => (
                <button key={v} onClick={() => f('gender',v)}
                  className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${form.gender===v?'border-green-500 bg-green-50 text-green-700':'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  {l}
                </button>
              ))}
            </div>
            {errors.gender && <p className="text-xs text-red-500 mt-1">{errors.gender}</p>}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-5 mb-4">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <span className="text-green-500 font-bold">②</span>
            <span className="text-sm font-bold text-gray-900">Adres Bilgileri</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">İl</label>
              <div className="w-full px-3 py-2.5 border-[1.5px] border-gray-100 rounded-lg text-sm bg-gray-50 text-gray-700 font-semibold">
                {inst?.city || '—'}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">İlçe</label>
              <div className="w-full px-3 py-2.5 border-[1.5px] border-gray-100 rounded-lg text-sm bg-gray-50 text-gray-700 font-semibold">
                {districtKey ? districtKey.charAt(0) + districtKey.slice(1).toLowerCase() : '—'}
              </div>
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Mahalle *</label>
            <select value={form.mahalle} onChange={e => { f('mahalle',e.target.value) }}
              className={`w-full px-3 py-2.5 border-[1.5px] rounded-lg text-sm outline-none transition-all ${errors.mahalle?'border-red-400':'border-gray-200 focus:border-green-500'}`}>
              <option value="">Mahalle seçin</option>
              {mahalleList.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            {errors.mahalle && <p className="text-xs text-red-500 mt-1">{errors.mahalle}</p>}
          </div>

          <div className="mb-3">
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Sokak / Cadde (opsiyonel)</label>
            <input value={form.sokak} onChange={e => f('sokak', e.target.value)}
              placeholder="Sokak veya cadde adı"
              className="w-full px-3 py-2.5 border-[1.5px] border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Kapı No / Açık Adres (opsiyonel)</label>
            <input value={form.address} onChange={e => f('address',e.target.value)} placeholder="Örn: No: 12 Daire: 3"
              className="w-full px-3 py-2.5 border-[1.5px] border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-5 mb-4">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <span className="text-green-500 font-bold">③</span>
            <span className="text-sm font-bold text-gray-900">Veli Bilgileri</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Veli Adı *</label>
              <input value={form.parent_first_name} onChange={e => f('parent_first_name',e.target.value)} placeholder="Anne veya baba adı"
                className={`w-full px-3 py-2.5 border-[1.5px] rounded-lg text-sm outline-none transition-all ${errors.parent_first_name?'border-red-400 bg-red-50':'border-gray-200 focus:border-green-500'}`} />
              {errors.parent_first_name && <p className="text-xs text-red-500 mt-1">{errors.parent_first_name}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Veli Soyadı *</label>
              <input value={form.parent_last_name} onChange={e => f('parent_last_name',e.target.value)} placeholder="Soyadı"
                className={`w-full px-3 py-2.5 border-[1.5px] rounded-lg text-sm outline-none transition-all ${errors.parent_last_name?'border-red-400 bg-red-50':'border-gray-200 focus:border-green-500'}`} />
              {errors.parent_last_name && <p className="text-xs text-red-500 mt-1">{errors.parent_last_name}</p>}
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">WhatsApp Numarası *</label>
            <input type="tel" value={form.parent_phone} onChange={e => f('parent_phone',e.target.value)} placeholder="05XX XXX XX XX"
              className={`w-full px-3 py-2.5 border-[1.5px] rounded-lg text-sm outline-none transition-all ${errors.parent_phone?'border-red-400 bg-red-50':'border-gray-200 focus:border-green-500'}`} />
            {errors.parent_phone && <p className="text-xs text-red-500 mt-1">{errors.parent_phone}</p>}
            <p className="text-xs text-gray-400 mt-1">Bildirimler ve onay bu numaraya gönderilecektir.</p>
          </div>

          <div className="mb-3">
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">2. Telefon (opsiyonel)</label>
            <input type="tel" value={form.parent_phone2} onChange={e => f('parent_phone2',e.target.value)} placeholder="05XX..."
              className="w-full px-3 py-2.5 border-[1.5px] border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Notlar (opsiyonel)</label>
            <textarea value={form.notes} onChange={e => f('notes',e.target.value)}
              placeholder="Sağlık durumu, özel durum vb."
              className="w-full px-3 py-2.5 border-[1.5px] border-gray-200 rounded-lg text-sm outline-none focus:border-green-500 resize-none min-h-16" />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-3">
          <p className="text-xs text-blue-700 font-semibold">
            ℹ️ Başvurunuz kurum yöneticisi tarafından incelendikten sonra size bilgi verilecektir.
          </p>
        </div>

        {/* KVKK Onayı */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-5">
          <label className={`flex items-start gap-3 cursor-pointer ${errors.kvkk?'text-red-500':''}`}>
            <input type="checkbox" checked={form.kvkk}
              onChange={e=>setForm(p=>({...p,kvkk:e.target.checked}))}
              className="w-5 h-5 mt-0.5 accent-green-500 flex-shrink-0"/>
            <span className="text-xs text-gray-600 leading-relaxed">
              Çocuğuma ve velisine ait yukarıdaki bilgilerin (T.C. No ve telefon numarası dahil)
              <strong> kurs kaydı değerlendirmesi ve WhatsApp üzerinden bilgilendirme (devamsızlık, ödev, duyuru) amacıyla</strong>
              işlenmesine, 6698 sayılı KVKK kapsamında onay veriyorum. *
            </span>
          </label>
          {errors.kvkk && <p className="text-xs text-red-500 mt-2 ml-8">{errors.kvkk}</p>}
        </div>

        <button onClick={submit} disabled={loading}
          className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl text-base transition-colors disabled:opacity-50 shadow-lg shadow-green-500/20">
          {loading ? '⏳ Gönderiliyor...' : '📤 Başvuruyu Gönder'}
        </button>
      </div>
    </div>
  )
}
