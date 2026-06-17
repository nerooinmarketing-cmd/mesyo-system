import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

// Simüle edilmiş demirbaş verisi — gerçekte API'den gelecek
const ASSETS: Record<string,{code:string;name:string;category:string;location:string;condition:string;note?:string}> = {
  'DMB-001':{code:'DMB-001',name:'Halı (Ana Salon)',     category:'Bina & Altyapı', location:'Ana Salon', condition:'iyi'},
  'DMB-002':{code:'DMB-002',name:'Ses Sistemi',          category:'Dini Eşyalar',   location:'Ana Salon', condition:'iyi'},
  'DMB-003':{code:'DMB-003',name:'Kuran-ı Kerim',        category:'Dini Eşyalar',   location:'Kütüphane', condition:'iyi'},
  'DMB-004':{code:'DMB-004',name:'Klima (Split)',        category:'Bina & Altyapı', location:'Ana Salon', condition:'bakim', note:'Filtre değişimi gerekiyor'},
  'DMB-005':{code:'DMB-005',name:'Öğrenci Sırası',      category:'Kurs & Eğitim',  location:'Sınıf 1',   condition:'iyi'},
  'DMB-006':{code:'DMB-006',name:'Projeksiyon',          category:'Kurs & Eğitim',  location:'Sınıf 1',   condition:'arizali', note:'Lamba arızalı'},
  'DMB-007':{code:'DMB-007',name:'Bilgisayar',           category:'Büro & Ofis',    location:'Ofis',      condition:'iyi'},
  'DMB-008':{code:'DMB-008',name:'Elektrikli Süpürge',   category:'Temizlik',       location:'Depo',      condition:'iyi'},
  'DMB-009':{code:'DMB-009',name:'Yangın Söndürücü',     category:'Güvenlik',       location:'Ana Salon', condition:'bakim', note:'Dolum tarihi yaklaşıyor'},
  'DMB-010':{code:'DMB-010',name:'Çay Kazanı',           category:'Mutfak & İkram', location:'Mutfak',    condition:'iyi'},
}

type ReportType = 'ariza'|'bakim'|'kayip'|'hasar'

const REPORT_TYPES: Record<ReportType,{label:string;icon:string;color:string;desc:string}> = {
  ariza: {label:'Arıza',         icon:'🔴', color:'bg-red-100 text-red-700 border-red-300',     desc:'Cihaz/eşya çalışmıyor'},
  bakim: {label:'Bakım Gerekli', icon:'🟡', color:'bg-amber-100 text-amber-700 border-amber-300',desc:'Temizlik, yağlama, kontrol gerekiyor'},
  kayip: {label:'Kayıp/Eksik',   icon:'❓', color:'bg-blue-100 text-blue-700 border-blue-300',  desc:'Eşya bulunamıyor'},
  hasar: {label:'Hasar',         icon:'🟠', color:'bg-orange-100 text-orange-700 border-orange-300',desc:'Kırık, çatlak, bozulma var'},
}

export default function AssetReportPage() {
  const { code } = useParams<{ code: string }>()
  const asset = code ? ASSETS[code.toUpperCase()] : null

  const [step, setStep] = useState<'view'|'report'|'success'>('view')
  const [reportType, setReportType] = useState<ReportType>('ariza')
  const [desc, setDesc] = useState('')
  const [reporterName, setReporterName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [now] = useState(new Date())
  const dateStr = now.toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'})
  const timeStr = now.toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'})

  const condColors: Record<string,string> = {
    iyi:'bg-green-100 text-green-700 border-green-300',
    bakim:'bg-amber-100 text-amber-700 border-amber-300',
    arizali:'bg-red-100 text-red-600 border-red-300',
    kullanimiyor:'bg-gray-100 text-gray-500 border-gray-300',
  }
  const condLabels: Record<string,string> = {
    iyi:'✅ İyi Durumda', bakim:'⚠️ Bakım Gerekiyor', arizali:'🔴 Arızalı', kullanimiyor:'⛔ Kullanım Dışı'
  }

  if (!asset) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-sm w-full">
        <div className="text-5xl mb-4">❓</div>
        <h1 className="text-lg font-bold text-gray-900 mb-2">Demirbaş Bulunamadı</h1>
        <p className="text-sm text-gray-500">"{code}" kodu sistemde kayıtlı değil.</p>
      </div>
    </div>
  )

  const submit = async () => {
    if (!desc.trim() || !reporterName.trim()) return
    setSubmitting(true)
    await new Promise(r=>setTimeout(r,700))
    setSubmitting(false)
    setStep('success')
  }

  if (step === 'success') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 text-center max-w-sm w-full">
        <div className="text-5xl mb-3">✅</div>
        <h1 className="text-lg font-bold text-gray-900 mb-2">Rapor Gönderildi!</h1>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 text-left">
          <div className="text-xs font-bold text-green-700 uppercase mb-2">Kayıt Özeti</div>
          <div className="space-y-1 text-xs text-green-800">
            <div>📦 {asset.name} ({asset.code})</div>
            <div>{REPORT_TYPES[reportType].icon} {REPORT_TYPES[reportType].label}</div>
            <div>📍 {asset.location}</div>
            <div>👤 {reporterName}</div>
            <div>🕐 {dateStr} — {timeStr}</div>
          </div>
        </div>
        <p className="text-xs text-gray-500">Cami yöneticisi bilgilendirildi. En kısa sürede ilgilenilecektir.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1B4332] px-4 pt-6 pb-5">
        <div className="text-center">
          <div className="text-2xl mb-1">📦</div>
          <div className="text-white font-bold text-base">Mesyo Soft — Demirbaş</div>
          <div className="text-white/50 text-xs mt-0.5 font-mono">{asset.code}</div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 space-y-3">

        {/* Demirbaş bilgi kartı */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-lg font-extrabold text-gray-900">{asset.name}</div>
              <div className="text-xs text-gray-500 mt-0.5">{asset.category}</div>
            </div>
            <span className={`text-[11px] font-bold px-2.5 py-1.5 rounded-xl border-2 flex-shrink-0 ${condColors[asset.condition]}`}>
              {condLabels[asset.condition]}
            </span>
          </div>
          <div className="flex gap-3 text-xs">
            <span className="bg-gray-100 px-2.5 py-1.5 rounded-lg text-gray-700 font-semibold">📍 {asset.location}</span>
            <span className="bg-gray-100 px-2.5 py-1.5 rounded-lg text-gray-700 font-semibold font-mono">{asset.code}</span>
          </div>
          {asset.note && (
            <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
              ⚠️ {asset.note}
            </div>
          )}
        </div>

        {/* Tarih/saat */}
        <div className="bg-white rounded-xl shadow-sm px-4 py-3 flex items-center justify-between">
          <span className="text-xs text-gray-500">Şu an:</span>
          <span className="text-xs font-bold text-gray-900">{dateStr} — {timeStr}</span>
        </div>

        {step === 'view' && (
          <div className="space-y-2">
            <button onClick={()=>setStep('report')}
              className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl text-base transition-colors">
              🔴 Arıza / Sorun Bildir
            </button>
            <p className="text-center text-xs text-gray-400">
              Bu demirbaşta bir sorun mu gördünüz? Bildir, yönetici haberdar olsun.
            </p>
          </div>
        )}

        {step === 'report' && (
          <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
            <div className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">
              🔴 Sorun Bildir — {asset.name}
            </div>

            {/* Rapor tipi */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase">Sorun Türü</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(REPORT_TYPES) as [ReportType,typeof REPORT_TYPES[ReportType]][]).map(([v,c])=>(
                  <button key={v} onClick={()=>setReportType(v)}
                    className={`py-3 px-3 rounded-xl border-2 text-left transition-all ${reportType===v?c.color.replace('bg-','border-').split(' ')[0]+' '+c.color:'border-gray-200 text-gray-600 bg-white'}`}>
                    <div className="text-lg mb-0.5">{c.icon}</div>
                    <div className="text-xs font-bold">{c.label}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{c.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Açıklama */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">
                Sorunun Açıklaması *
              </label>
              <textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={4}
                placeholder={`${asset.name} ile ilgili gördüğünüz sorunu detaylı açıklayın...\n\nÖrnek: "Hoparlörden ses gelmiyor, açma kapama düğmesi çalışıyor ama ses yok."`}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-400 resize-none"/>
            </div>

            {/* Bildiren */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Adınız *</label>
              <input value={reporterName} onChange={e=>setReporterName(e.target.value)}
                placeholder="Ad Soyad"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-400"/>
            </div>

            {/* Tarih/saat otomatik */}
            <div className="bg-gray-50 rounded-xl px-4 py-3 text-xs text-gray-500">
              🕐 Kayıt tarihi: <strong className="text-gray-700">{dateStr} {timeStr}</strong> (otomatik)
            </div>

            <div className="flex gap-2">
              <button onClick={()=>setStep('view')}
                className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl text-sm hover:bg-gray-50">
                İptal
              </button>
              <button onClick={submit} disabled={!desc.trim()||!reporterName.trim()||submitting}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white font-bold rounded-xl text-sm transition-colors">
                {submitting ? '⏳...' : '📤 Bildir'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
