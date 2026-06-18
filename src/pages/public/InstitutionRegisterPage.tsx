import { useState } from 'react'
import { publicApi } from '@/lib/api'

type Step = 'form' | 'success'

export default function InstitutionRegisterPage() {
  const [step, setStep] = useState<Step>('form')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name:'', city:'Konya', district:'', address:'',
    responsible_name:'', responsible_phone:'', email:'',
    student_count_estimate:'', note:'', kvkk:false
  })
  const [errors, setErrors] = useState<Record<string,string>>({})
  const [submitError, setSubmitError] = useState('')

  const f = (k: string, v: string) => { setForm(p=>({...p,[k]:v})); setErrors(p=>{const n={...p};delete n[k];return n}) }

  const validate = () => {
    const e: Record<string,string> = {}
    if (!form.name.trim())             e.name             = 'Kurum adı zorunlu'
    if (!form.district.trim())         e.district         = 'İlçe zorunlu'
    if (!form.responsible_name.trim()) e.responsible_name = 'Sorumlu adı zorunlu'
    if (!form.responsible_phone.trim()) e.responsible_phone = 'Telefon zorunlu'
    else if (!/^0[5][0-9]{9}$/.test(form.responsible_phone.replace(/\s/g,'')))
      e.responsible_phone = 'Geçerli telefon girin (05XX...)'
    if (!form.kvkk) e.kvkk = 'Onay vermeniz gerekiyor'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async () => {
    if (!validate()) return
    setLoading(true)
    setSubmitError('')
    try {
      await publicApi.submitInstitutionApplication({
        name: form.name,
        city: form.city,
        district: form.district,
        address: form.address || undefined,
        responsible_name: form.responsible_name,
        responsible_phone: form.responsible_phone,
        email: form.email || undefined,
        student_count_estimate: form.student_count_estimate || undefined,
        note: form.note || undefined,
        kvkk: form.kvkk,
      })
      setStep('success')
    } catch (e: any) {
      setSubmitError(e.message || 'Başvuru gönderilemedi, lütfen tekrar deneyin')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'success') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Başvurunuz Alındı!</h1>
        <p className="text-sm text-gray-500 mb-3 leading-relaxed">
          <strong>{form.name}</strong> için başvurunuz sistem yöneticisine iletildi.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-5 text-sm text-green-800 text-left">
          <div className="font-bold mb-1">Sıradaki Adımlar:</div>
          <ol className="space-y-1 text-xs list-decimal list-inside">
            <li>Yönetici başvurunuzu inceler (1-2 iş günü)</li>
            <li>Onay sonrası <strong>{form.responsible_phone}</strong> numaranıza geçici şifre WhatsApp'tan gelir</li>
            <li>Sisteme giriş yapıp şifrenizi değiştirirsiniz</li>
          </ol>
        </div>
        <a href="/login" className="text-green-600 text-sm font-semibold hover:underline">Giriş Sayfasına Dön</a>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="bg-[#1B4332] px-4 pt-8 pb-6 text-center">
        <div className="text-3xl mb-2">📚</div>
        <div className="text-white font-bold text-xl">Mesyo Soft</div>
        <div className="text-white/60 text-sm mt-1">Kurum / Cami Kayıt Başvurusu</div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-5 space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
          ℹ️ Kayıt başvurusu ücretsizdir. Yönetici onayından sonra 30 gün ücretsiz deneme sürümü başlar.
        </div>

        {/* Kurum bilgileri */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">🏛️ Kurum Bilgileri</div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Kurum / Cami Adı *</label>
              <input value={form.name} onChange={e=>f('name',e.target.value)} placeholder="örn: Karacihan Mescidi"
                className={`w-full px-3 py-2.5 border-[1.5px] rounded-lg text-sm outline-none transition-all ${errors.name?'border-red-400 bg-red-50':'border-gray-200 focus:border-green-500'}`}/>
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Şehir</label>
                <input value={form.city} onChange={e=>f('city',e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">İlçe *</label>
                <input value={form.district} onChange={e=>f('district',e.target.value)} placeholder="Karatay"
                  className={`w-full px-3 py-2.5 border-[1.5px] rounded-lg text-sm outline-none transition-all ${errors.district?'border-red-400 bg-red-50':'border-gray-200 focus:border-green-500'}`}/>
                {errors.district && <p className="text-xs text-red-500 mt-1">{errors.district}</p>}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Adres</label>
              <textarea value={form.address} onChange={e=>f('address',e.target.value)} rows={2} placeholder="Mahalle, sokak, no..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500 resize-none"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Tahmini Öğrenci Sayısı</label>
              <select value={form.student_count_estimate} onChange={e=>f('student_count_estimate',e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500">
                <option value="">Seçin...</option>
                <option>1-30 öğrenci</option><option>31-60 öğrenci</option>
                <option>61-100 öğrenci</option><option>101-200 öğrenci</option><option>200+ öğrenci</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sorumlu */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">👤 Sorumlu Kişi</div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Ad Soyad *</label>
              <input value={form.responsible_name} onChange={e=>f('responsible_name',e.target.value)}
                className={`w-full px-3 py-2.5 border-[1.5px] rounded-lg text-sm outline-none transition-all ${errors.responsible_name?'border-red-400 bg-red-50':'border-gray-200 focus:border-green-500'}`}/>
              {errors.responsible_name && <p className="text-xs text-red-500 mt-1">{errors.responsible_name}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">WhatsApp Telefonu * (Şifre bu numaraya gelecek)</label>
              <input type="tel" value={form.responsible_phone} onChange={e=>f('responsible_phone',e.target.value)} placeholder="05XX XXX XX XX"
                className={`w-full px-3 py-2.5 border-[1.5px] rounded-lg text-sm outline-none transition-all ${errors.responsible_phone?'border-red-400 bg-red-50':'border-gray-200 focus:border-green-500'}`}/>
              {errors.responsible_phone && <p className="text-xs text-red-500 mt-1">{errors.responsible_phone}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">E-posta (opsiyonel)</label>
              <input type="email" value={form.email} onChange={e=>f('email',e.target.value)} placeholder="ornek@gmail.com"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Ek Not</label>
              <textarea value={form.note} onChange={e=>f('note',e.target.value)} rows={2}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500 resize-none"/>
            </div>
          </div>
        </div>

        {/* KVKK Onayı */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <label className={`flex items-start gap-3 cursor-pointer ${errors.kvkk?'text-red-500':''}`}>
            <input type="checkbox" checked={form.kvkk} onChange={e=>{f('kvkk',e.target.checked?'true':'');setForm(p=>({...p,kvkk:e.target.checked}))}}
              className="w-5 h-5 mt-0.5 accent-green-500 flex-shrink-0"/>
            <span className="text-xs text-gray-600 leading-relaxed">
              Yukarıda verdiğim iletişim bilgilerimin (telefon numarası dahil) Mesyo Soft tarafından
              <strong> başvuru değerlendirmesi ve WhatsApp üzerinden bilgilendirme amacıyla</strong> işlenmesine,
              6698 sayılı KVKK kapsamında onay veriyorum. *
            </span>
          </label>
          {errors.kvkk && <p className="text-xs text-red-500 mt-2 ml-8">{errors.kvkk}</p>}
        </div>

        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">{submitError}</div>
        )}

        <button onClick={submit} disabled={loading}
          className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl text-base disabled:opacity-50 transition-colors">
          {loading ? '⏳ Gönderiliyor...' : '📤 Başvuruyu Gönder'}
        </button>
        <p className="text-center text-xs text-gray-400">Başvuru formunu göndererek kullanım koşullarını kabul etmiş olursunuz.</p>
      </div>
    </div>
  )
}
