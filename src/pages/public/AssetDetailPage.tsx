import { useParams } from 'react-router-dom'

const DEMO_ASSETS: Record<string,{name:string;category:string;condition:string;location:string;note?:string;purchase_date?:string;serial_no?:string}> = {
  'DMB-001':{name:'Halı (Ana Salon)',     category:'Bina & Altyapı',  condition:'İyi',             location:'Ana Salon',  purchase_date:'2023-09-01'},
  'DMB-002':{name:'Ses Sistemi',          category:'Dini Eşyalar',    condition:'İyi',             location:'Ana Salon',  purchase_date:'2022-06-15'},
  'DMB-003':{name:'Kuran-ı Kerim',        category:'Dini Eşyalar',    condition:'İyi',             location:'Kütüphane',  purchase_date:'2024-01-10'},
  'DMB-004':{name:'Klima (Split)',        category:'Bina & Altyapı',  condition:'Bakım Gerekiyor', location:'Ana Salon',  note:'Filtre değişimi gerekiyor'},
  'DMB-005':{name:'Öğrenci Sırası',      category:'Kurs & Eğitim',   condition:'İyi',             location:'Sınıf 1'},
  'DMB-006':{name:'Projeksiyon',          category:'Kurs & Eğitim',   condition:'Arızalı',         location:'Sınıf 1',    note:'Lamba arızalı'},
  'DMB-007':{name:'Bilgisayar',           category:'Büro & Ofis',     condition:'İyi',             location:'Ofis',       serial_no:'SN-A1234567'},
}

export default function AssetDetailPage() {
  const { code } = useParams<{ code: string }>()
  const asset = code ? DEMO_ASSETS[code.toUpperCase()] : null

  const condColor = asset?.condition==='İyi'?'bg-green-100 text-green-700 border-green-300':asset?.condition==='Arızalı'?'bg-red-100 text-red-600 border-red-300':'bg-amber-100 text-amber-700 border-amber-300'

  if (!asset) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-sm">
        <div className="text-5xl mb-4">❓</div>
        <h1 className="text-lg font-bold text-gray-900 mb-2">Demirbaş Bulunamadı</h1>
        <p className="text-sm text-gray-500">"{code}" kodlu demirbaş sistemde kayıtlı değil.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#1B4332] px-4 pt-6 pb-5 text-center">
        <div className="text-2xl mb-1">📦</div>
        <div className="text-white font-bold text-lg">Demirbaş Bilgisi</div>
        <div className="text-white/50 text-xs mt-0.5 font-mono">{code}</div>
      </div>

      <div className="max-w-md mx-auto px-4 py-5 space-y-3">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h1 className="text-xl font-extrabold text-gray-900 mb-3">{asset.name}</h1>

          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 text-sm font-bold mb-4 ${condColor}`}>
            <span className="w-2.5 h-2.5 rounded-full bg-current opacity-70"/>
            {asset.condition}
          </div>

          <div className="space-y-0">
            {[
              ['Kod', code],['Kategori', asset.category],['Konum', asset.location],
              ['Satın Alma', asset.purchase_date||'—'],['Seri No', asset.serial_no||'—'],
            ].map(([l,v])=>(
              <div key={l as string} className="flex items-center py-2.5 border-b border-gray-50 last:border-0 gap-3">
                <span className="text-xs font-semibold text-gray-400 w-24 flex-shrink-0">{l}</span>
                <span className="text-sm text-gray-700">{v}</span>
              </div>
            ))}
          </div>

          {asset.note && (
            <div className={`mt-3 px-3 py-2.5 rounded-xl border text-sm font-semibold ${condColor}`}>
              ⚠️ {asset.note}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 text-center text-xs text-gray-400">
          Bu sayfa Mesyo Soft demirbaş yönetim sistemi tarafından oluşturulmuştur.<br/>
          Arıza veya sorun için kurum yöneticinize bildirin.
        </div>
      </div>
    </div>
  )
}
