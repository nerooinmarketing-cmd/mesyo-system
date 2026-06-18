import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Button, Modal, useToast, Alert } from '@/components/ui'
import { cn } from '@/lib/utils'
import { assetsApi } from '@/lib/api'
import * as XLSX from 'xlsx'

type Category = 'bina'|'dini'|'kurs'|'buro'|'temizlik'|'guvenlik'|'mutfak'|'diger'
type Condition = 'iyi'|'bakim'|'arizali'|'kullanimiyor'
type Tab = 'liste'|'ekle'|'arizalar'|'rapor'

const CAT_CONFIG: Record<Category,{label:string;icon:string;color:string}> = {
  bina:      {label:'Bina & Altyapı',    icon:'🏗️', color:'bg-stone-100 text-stone-700'},
  dini:      {label:'Dini Eşyalar',      icon:'🕌', color:'bg-green-100 text-green-700'},
  kurs:      {label:'Kurs & Eğitim',     icon:'📚', color:'bg-blue-100 text-blue-700'},
  buro:      {label:'Büro & Ofis',       icon:'💻', color:'bg-purple-100 text-purple-700'},
  temizlik:  {label:'Temizlik',          icon:'🧹', color:'bg-teal-100 text-teal-700'},
  guvenlik:  {label:'Güvenlik',          icon:'🔒', color:'bg-red-100 text-red-600'},
  mutfak:    {label:'Mutfak & İkram',    icon:'☕', color:'bg-amber-100 text-amber-700'},
  diger:     {label:'Diğer',             icon:'📦', color:'bg-gray-100 text-gray-600'},
}

const COND_CONFIG: Record<Condition,{label:string;color:string;dot:string}> = {
  iyi:          {label:'İyi',             color:'bg-green-100 text-green-700', dot:'bg-green-500'},
  bakim:        {label:'Bakım Gerekiyor', color:'bg-amber-100 text-amber-700', dot:'bg-amber-400'},
  arizali:      {label:'Arızalı',         color:'bg-red-100 text-red-600',     dot:'bg-red-500'},
  kullanimiyor: {label:'Kullanım Dışı',   color:'bg-gray-100 text-gray-500',   dot:'bg-gray-400'},
}

const LOCATIONS = ['Ana Salon','Kadınlar Bölümü','Sınıf 1','Sınıf 2','Depo','Abdesthane','Bahçe','Ofis','Kütüphane','Mutfak']
const UNITS = ['Adet','Takım','Metre','Set','Paket','Çift']

function QRCode({ value, size=200 }: { value: string; size?: number }) {
  const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&bgcolor=ffffff&color=1B4332&margin=10`
  return <img src={url} alt="QR Kod" className="block" style={{width:size,height:size}}/>
}

function AssetQRModal({ asset, onClose }: { asset: any; onClose: () => void }) {
  const qrUrl = `${window.location.origin}/demirbase/${asset.code}`
  const printUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrUrl)}&bgcolor=ffffff&color=1B4332&margin=15`
  const { toast } = useToast()

  return (
    <Modal open={true} onClose={onClose} title={`📱 QR Kod — ${asset.name}`}>
      <div className="text-center space-y-4">
        <div className="inline-block p-4 bg-white border-4 border-[#1B4332] rounded-2xl shadow-lg">
          <QRCode value={qrUrl} size={200}/>
        </div>
        <div>
          <div className="text-xs font-bold text-gray-500 mb-1">{asset.code}</div>
          <div className="font-bold text-gray-900">{asset.name}</div>
          <div className="text-xs text-gray-400 font-mono mt-1 break-all">{qrUrl}</div>
        </div>
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gray-50">
          <div className="text-xs text-gray-400 mb-2 font-semibold">Etiket Önizlemesi:</div>
          <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-3">
            <QRCode value={qrUrl} size={80}/>
            <div className="text-left">
              <div className="text-xs font-extrabold text-[#1B4332]">{asset.code}</div>
              <div className="text-sm font-bold text-gray-900 leading-tight">{asset.name}</div>
              <div className="text-xs text-gray-500">{asset.location}</div>
              <div className="text-[10px] text-gray-400 mt-1">Mesyo Soft — Demirbaş</div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { navigator.clipboard.writeText(qrUrl); toast('Link kopyalandı','success') }}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl text-sm hover:bg-gray-50">
            📋 Link Kopyala
          </button>
          <a href={printUrl} target="_blank" rel="noreferrer"
            className="flex-1 py-2.5 bg-[#1B4332] hover:bg-green-800 text-white font-bold rounded-xl text-sm text-center transition-colors">
            ⬇ QR İndir (400px)
          </a>
        </div>
        <div className="text-xs text-gray-400 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
          💡 QR kodu indirip A4'e yazdırın, laminasyon yaptırıp eşyanın üstüne yapıştırın. Tarayınca detay sayfası açılır.
        </div>
      </div>
    </Modal>
  )
}

export default function AssetsPage() {
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [assets, setAssets] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])

  const [tab, setTab] = useState<Tab>('liste')
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState<Category|''>('')
  const [condFilter, setCondFilter] = useState<Condition|''>('')
  const [qrAsset, setQrAsset] = useState<any|null>(null)
  const [detailAsset, setDetailAsset] = useState<any|null>(null)
  const [detailLogs, setDetailLogs] = useState<any[]>([])
  const [logModal, setLogModal] = useState<any|null>(null)
  const [logForm, setLogForm] = useState({type:'bakim' as 'bakim'|'tamir'|'degisim', note:'', cost:'', date:new Date().toISOString().split('T')[0]})
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState<any>({
    name:'', category:'dini', condition:'iyi', quantity:1, unit:'Adet',
    location:'Ana Salon', purchase_price_str:'', supplier:'', serial_no:'', note:''
  })
  const ff = (k:string,v:any)=>setForm((p:any)=>({...p,[k]:v}))

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setLoadError('')
      try {
        const [a, l] = await Promise.all([assetsApi.list(), assetsApi.allMaintenanceLogs()])
        if (!cancelled) { setAssets(a); setLogs(l) }
      } catch (e: any) {
        if (!cancelled) setLoadError(e.message || 'Demirbaşlar yüklenirken bir hata oluştu')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const addAsset = async () => {
    if (!form.name?.trim()) { toast('Demirbaş adı zorunlu','error'); return }
    setSaving(true)
    try {
      const created = await assetsApi.create({
        name: form.name, category: form.category, condition: form.condition,
        quantity: form.quantity || 1, unit: form.unit || 'Adet', location: form.location || undefined,
        purchase_date: form.purchase_date || undefined, supplier: form.supplier || undefined,
        purchase_price: form.purchase_price_str ? parseFloat(form.purchase_price_str) : undefined,
        serial_no: form.serial_no || undefined, note: form.note || undefined,
        next_maintenance: form.next_maintenance || undefined,
      })
      setAssets(p=>[created,...p])
      toast(`${created.code} — ${form.name} eklendi ✅`, 'success')
      setForm({name:'',category:'dini',condition:'iyi',quantity:1,unit:'Adet',location:'Ana Salon',purchase_price_str:'',supplier:'',serial_no:'',note:''})
      setTab('liste')
      setTimeout(()=>setQrAsset(created), 400)
    } catch (e: any) {
      toast(e.message || 'Demirbaş eklenemedi', 'error')
    } finally {
      setSaving(false)
    }
  }

  const addLog = async () => {
    if (!logModal || !logForm.note.trim()) { toast('Not zorunlu','error'); return }
    setSaving(true)
    try {
      const newLog = await assetsApi.addMaintenanceLog(logModal.id, {
        maintenance_type: logForm.type, log_date: logForm.date, note: logForm.note,
        cost: logForm.cost ? parseFloat(logForm.cost) : undefined,
      })
      setLogs(p=>[newLog,...p])
      if (logForm.type === 'bakim' || logForm.type === 'tamir') {
        setAssets(p=>p.map(a=>a.id===logModal.id?{...a,condition:'iyi',last_maintenance: logForm.type === 'bakim' ? logForm.date : a.last_maintenance}:a))
      }
      toast('Bakım/onarım kaydedildi ✅','success')
      setLogModal(null); setLogForm({type:'bakim',note:'',cost:'',date:new Date().toISOString().split('T')[0]})
    } catch (e: any) {
      toast(e.message || 'Kayıt eklenemedi', 'error')
    } finally {
      setSaving(false)
    }
  }

  const deleteAsset = async (id:string,name:string) => {
    if(!confirm(`${name} demirbaşını silmek istiyor musunuz?`)) return
    try {
      await assetsApi.delete(id)
      setAssets(p=>p.filter(a=>a.id!==id))
      toast('Silindi','info')
    } catch (e: any) {
      toast(e.message || 'Silme başarısız oldu', 'error')
    }
  }

  const openDetail = async (asset: any) => {
    setDetailAsset(asset)
    try {
      const l = await assetsApi.maintenanceLogs(asset.id)
      setDetailLogs(l)
    } catch {
      setDetailLogs([])
    }
  }

  const exportXLSX = () => {
    const data = assets.map(a=>({
      'Kod':a.code, 'Ad':a.name,
      'Kategori':CAT_CONFIG[a.category as Category]?.label || a.category,
      'Durum':COND_CONFIG[a.condition as Condition]?.label || a.condition,
      'Adet':`${a.quantity} ${a.unit}`,
      'Konum':a.location||'—',
      'Satın Alma':a.purchase_date||'—',
      'Fiyat (₺)':a.purchase_price||'—',
      'Tedarikçi':a.supplier||'—',
      'Seri No':a.serial_no||'—',
      'Son Bakım':a.last_maintenance||'—',
      'Sonraki Bakım':a.next_maintenance||'—',
      'Not':a.note||'—',
    }))
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(data)
    ws['!cols'] = [{wch:10},{wch:25},{wch:15},{wch:18},{wch:10},{wch:15},{wch:12},{wch:12},{wch:18},{wch:15},{wch:12},{wch:14},{wch:30}]
    XLSX.utils.book_append_sheet(wb,ws,'Demirbaş Listesi')
    const logData = logs.map(l=>({
      'Kod':assets.find(a=>a.id===l.asset_id)?.code||'—',
      'Demirbaş':assets.find(a=>a.id===l.asset_id)?.name||'—',
      'Tarih':l.log_date,
      'İşlem':l.maintenance_type==='bakim'?'Bakım':l.maintenance_type==='tamir'?'Tamir':'Değişim',
      'Not':l.note,
      'Maliyet (₺)':l.cost||0,
    }))
    const ws2 = XLSX.utils.json_to_sheet(logData)
    XLSX.utils.book_append_sheet(wb,ws2,'Bakım Geçmişi')
    XLSX.writeFile(wb,`demirbase-${new Date().toISOString().split('T')[0]}.xlsx`)
    toast('Excel indirildi ⬇️','success')
  }

  const filtered = assets.filter(a=>{
    const q = search.toLowerCase()
    const mq = !q || a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q) || (a.location||'').toLowerCase().includes(q) || (a.supplier||'').toLowerCase().includes(q)
    const mc = !catFilter || a.category===catFilter
    const md = !condFilter || a.condition===condFilter
    return mq&&mc&&md
  })

  const printAllQR = () => {
    if (filtered.length === 0) { toast('Yazdırılacak demirbaş yok','error'); return }
    const labelsHtml = filtered.map(a => {
      const qrLink = `${window.location.origin}/demirbase/${a.code}`
      const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrLink)}&bgcolor=ffffff&color=1B4332&margin=8`
      return `
        <div class="label">
          <img src="${qrImg}" />
          <div class="label-text">
            <div class="code">${a.code}</div>
            <div class="name">${a.name}</div>
            <div class="location">${a.location || '—'}</div>
          </div>
        </div>`
    }).join('')

    const html = `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <title>Demirbaş QR Etiketleri</title>
        <style>
          @page { size: A4; margin: 10mm; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; }
          .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6mm; }
          .label { border: 1px solid #ccc; border-radius: 4mm; padding: 4mm; display: flex; align-items: center; gap: 3mm; page-break-inside: avoid; }
          .label img { width: 22mm; height: 22mm; flex-shrink: 0; }
          .label-text { min-width: 0; overflow: hidden; }
          .code { font-size: 9pt; font-weight: bold; color: #1B4332; font-family: monospace; }
          .name { font-size: 10pt; font-weight: bold; color: #111; line-height: 1.2; margin-top: 1mm; }
          .location { font-size: 8pt; color: #666; margin-top: 0.5mm; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom:10px;text-align:center;">
          <button onclick="window.print()" style="padding:8px 20px;background:#1B4332;color:white;border:none;border-radius:6px;font-size:14px;cursor:pointer;">
            🖨️ Yazdır (${filtered.length} etiket)
          </button>
        </div>
        <div class="grid">${labelsHtml}</div>
      </body>
      </html>`

    const printWindow = window.open('', '_blank')
    if (printWindow) { printWindow.document.write(html); printWindow.document.close() }
    toast(`${filtered.length} etiket hazırlandı, yeni sekmede açıldı 🖨️`, 'success')
  }

  const today = new Date().toISOString().split('T')[0]
  const maintenanceDue = assets.filter(a=>a.next_maintenance && a.next_maintenance <= new Date(Date.now()+30*86400000).toISOString().split('T')[0])
  const broken = assets.filter(a=>a.condition==='arizali')
  const needsAttention = assets.filter(a=>a.condition==='arizali'||a.condition==='bakim')
  const totalValue = assets.reduce((s,a)=>(a.purchase_price||0)*a.quantity+s,0)

  if (loading) return (
    <AdminLayout>
      <div className="flex items-center justify-center py-24 text-gray-400">
        <div className="text-center">
          <div className="text-3xl mb-2 animate-pulse">⏳</div>
          <p className="text-sm">Yükleniyor...</p>
        </div>
      </div>
    </AdminLayout>
  )

  if (loadError) return (
    <AdminLayout>
      <Alert variant="warn">{loadError}</Alert>
      <button onClick={() => window.location.reload()}
        className="mt-3 px-4 py-2 bg-green-500 text-white text-sm font-bold rounded-lg">
        Tekrar Dene
      </button>
    </AdminLayout>
  )

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Özet kartlar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl shadow-sm p-4 text-center border-t-[3px] border-[#1B4332]">
            <div className="text-2xl font-extrabold text-gray-900">{assets.length}</div>
            <div className="text-xs text-gray-400 font-semibold mt-0.5">Toplam Demirbaş</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center border-t-[3px] border-amber-400">
            <div className="text-2xl font-extrabold text-amber-500">{maintenanceDue.length}</div>
            <div className="text-xs text-gray-400 font-semibold mt-0.5">Bakım Gerekiyor</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center border-t-[3px] border-red-400">
            <div className="text-2xl font-extrabold text-red-500">{broken.length}</div>
            <div className="text-xs text-gray-400 font-semibold mt-0.5">Arızalı</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center border-t-[3px] border-orange-400">
            <div className="text-2xl font-extrabold text-orange-500">{needsAttention.length}</div>
            <div className="text-xs text-gray-400 font-semibold mt-0.5">İlgilenilmesi Gereken</div>
          </div>
        </div>

        {broken.length>0 && (
          <div className="bg-red-50 border border-red-300 rounded-xl px-4 py-3 text-sm text-red-700 font-semibold">
            🔴 {broken.map(a=>a.name).join(', ')} arızalı! İşlem yapılması gerekiyor.
          </div>
        )}
        {maintenanceDue.filter(a=>a.condition!=='arizali').length>0 && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 text-sm text-amber-700 font-semibold">
            ⚠️ 30 gün içinde bakım gerekecek: {maintenanceDue.filter(a=>a.condition!=='arizali').map(a=>`${a.name} (${a.next_maintenance})`).join(', ')}
          </div>
        )}

        {/* Tab + butonlar */}
        <div className="flex gap-2 items-center flex-wrap">
          <div className="flex bg-gray-100 rounded-xl p-1">
            {([['liste','📋 Liste'],['ekle','➕ Ekle'],['arizalar','🔴 Arızalar'],['rapor','📊 Rapor']] as const).map(([t,l])=>(
              <button key={t} onClick={()=>setTab(t)}
                className={cn('px-4 py-2 text-xs font-semibold rounded-lg transition-all',tab===t?'bg-white text-gray-900 shadow-sm':'text-gray-400')}>
                {l}
              </button>
            ))}
          </div>
          <button onClick={exportXLSX}
            className="px-3 py-2 border border-gray-200 bg-white text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors ml-auto">
            ⬇ Excel
          </button>
        </div>

        {/* LİSTE */}
        {tab==='liste' && (
          <div className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              <input type="text" placeholder="🔍 Ad, kod, konum, tedarikçi..."
                value={search} onChange={e=>setSearch(e.target.value)}
                className="flex-1 min-w-48 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500 bg-white"/>
              <select value={catFilter} onChange={e=>setCatFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white">
                <option value="">Tüm Kategoriler</option>
                {Object.entries(CAT_CONFIG).map(([v,c])=><option key={v} value={v}>{c.icon} {c.label}</option>)}
              </select>
              <select value={condFilter} onChange={e=>setCondFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white">
                <option value="">Tüm Durumlar</option>
                {Object.entries(COND_CONFIG).map(([v,c])=><option key={v} value={v}>{c.label}</option>)}
              </select>
            </div>

            <div className="flex items-center justify-between px-1">
              <div className="text-xs text-gray-400">{filtered.length} demirbaş</div>
              <button onClick={printAllQR}
                className="px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-lg hover:bg-green-100 transition-colors">
                🖨️ Toplu QR Yazdır ({filtered.length})
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map(a=>{
                const cat = CAT_CONFIG[a.category as Category] || CAT_CONFIG.diger
                const cond = COND_CONFIG[a.condition as Condition] || COND_CONFIG.iyi
                return (
                  <div key={a.id} className={cn('bg-white rounded-2xl shadow-sm p-4 border-2 transition-all hover:shadow-md',
                    a.condition==='arizali'?'border-red-300':a.condition==='bakim'?'border-amber-300':'border-gray-100')}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-[10px] font-bold text-gray-400 font-mono mb-0.5">{a.code}</div>
                        <div className="text-sm font-bold text-gray-900 leading-tight">{a.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{a.location||'—'} · {a.quantity} {a.unit}</div>
                      </div>
                      <div className="text-xl flex-shrink-0 ml-2">{cat.icon}</div>
                    </div>

                    <div className="flex gap-1.5 flex-wrap mb-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cat.color}`}>{cat.label}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${cond.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cond.dot}`}/>
                        {cond.label}
                      </span>
                    </div>

                    {a.next_maintenance && (
                      <div className={cn('text-xs px-2 py-1 rounded-lg mb-2',
                        a.next_maintenance<=today?'bg-red-50 text-red-600 font-semibold':
                        a.next_maintenance<=new Date(Date.now()+30*86400000).toISOString().split('T')[0]?'bg-amber-50 text-amber-700':'bg-gray-50 text-gray-500')}>
                        🔧 Sonraki bakım: {a.next_maintenance}
                      </div>
                    )}
                    {a.note && <div className="text-xs text-gray-400 italic mb-2 line-clamp-2">"{a.note}"</div>}

                    <div className="flex gap-1.5 flex-wrap">
                      <button onClick={()=>openDetail(a)}
                        className="flex-1 py-1.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors">
                        👁 Detay
                      </button>
                      <button onClick={()=>setQrAsset(a)}
                        className="flex-1 py-1.5 border border-green-200 text-green-700 bg-green-50 text-xs font-semibold rounded-lg hover:bg-green-100 transition-colors">
                        📱 QR
                      </button>
                      <button onClick={()=>setLogModal(a)}
                        className="flex-1 py-1.5 border border-amber-200 text-amber-700 bg-amber-50 text-xs font-semibold rounded-lg hover:bg-amber-100 transition-colors">
                        🔧 Bakım
                      </button>
                      <button onClick={()=>deleteAsset(a.id,a.name)}
                        className="py-1.5 px-2.5 border border-red-200 text-red-400 text-xs font-semibold rounded-lg hover:bg-red-50 transition-colors">
                        🗑️
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {filtered.length===0 && (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm text-gray-400">
                <div className="text-3xl mb-2">📦</div>
                <p className="text-sm">Demirbaş bulunamadı</p>
              </div>
            )}
          </div>
        )}

        {/* EKLE */}
        {tab==='ekle' && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
              ➕ Yeni Demirbaş Ekle
              <span className="ml-2 text-xs font-normal text-gray-400">Kod otomatik atanır</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Demirbaş Adı *</label>
                <input value={form.name||''} onChange={e=>ff('name',e.target.value)} placeholder="örn: Halı (Ana Salon), Ses Sistemi..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Kategori</label>
                <select value={form.category} onChange={e=>ff('category',e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500">
                  {Object.entries(CAT_CONFIG).map(([v,c])=><option key={v} value={v}>{c.icon} {c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Konum</label>
                <select value={form.location} onChange={e=>ff('location',e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500">
                  {LOCATIONS.map(l=><option key={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Durum</label>
                <select value={form.condition} onChange={e=>ff('condition',e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500">
                  {Object.entries(COND_CONFIG).map(([v,c])=><option key={v} value={v}>{c.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Adet</label>
                  <input type="number" value={form.quantity||1} onChange={e=>ff('quantity',parseInt(e.target.value)||1)} min={1}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Birim</label>
                  <select value={form.unit} onChange={e=>ff('unit',e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500">
                    {UNITS.map(u=><option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Satın Alma Tarihi</label>
                <input type="date" value={form.purchase_date||''} onChange={e=>ff('purchase_date',e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Fiyat (₺)</label>
                <input type="number" value={form.purchase_price_str} onChange={e=>ff('purchase_price_str',e.target.value)} placeholder="0"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Tedarikçi</label>
                <input value={form.supplier||''} onChange={e=>ff('supplier',e.target.value)} placeholder="Firma adı"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Seri No</label>
                <input value={form.serial_no||''} onChange={e=>ff('serial_no',e.target.value)} placeholder="Opsiyonel"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Sonraki Bakım Tarihi</label>
                <input type="date" value={form.next_maintenance||''} onChange={e=>ff('next_maintenance',e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"/>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Not</label>
                <textarea value={form.note||''} onChange={e=>ff('note',e.target.value)} rows={2}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500 resize-none"/>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={()=>setTab('liste')} className="flex-1 justify-center">İptal</Button>
              <Button onClick={addAsset} loading={saving} className="flex-1 justify-center">✅ Ekle ve QR Oluştur</Button>
            </div>
          </div>
        )}

        {/* ARIZALAR — gerçek veriden türetilmiş: condition='arizali' veya 'bakim' olan demirbaşlar */}
        {tab==='arizalar' && (
          <div className="space-y-3">
            <Alert variant="info">ℹ️ Bu liste, durumu "Arızalı" veya "Bakım Gerekiyor" olarak işaretlenen demirbaşları gösterir. Bir demirbaşın durumunu değiştirmek için Liste sekmesinden Detay'a girin.</Alert>
            {needsAttention.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm text-gray-400">
                <div className="text-3xl mb-2">✅</div>
                <p className="text-sm">Şu anda arızalı veya bakım gerektiren demirbaş yok</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {needsAttention.map(a => {
                  const cond = COND_CONFIG[a.condition as Condition]
                  return (
                    <div key={a.id} className={cn('bg-white rounded-xl shadow-sm p-4 border-2', a.condition==='arizali'?'border-red-300':'border-amber-300')}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="text-[10px] font-bold text-gray-400 font-mono">{a.code}</div>
                          <div className="text-sm font-bold text-gray-900">{a.name}</div>
                          <div className="text-xs text-gray-500">{a.location||'—'}</div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${cond.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cond.dot}`}/>{cond.label}
                        </span>
                      </div>
                      {a.note && <div className="text-xs text-gray-500 italic mb-2">"{a.note}"</div>}
                      <Button size="sm" onClick={()=>setLogModal(a)} className="w-full justify-center">🔧 Bakım/Onarım Kaydet</Button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* RAPOR */}
        {tab==='rapor' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 text-sm font-bold text-gray-900">Kategori Bazlı Özet</div>
              {Object.entries(CAT_CONFIG).map(([cat,conf])=>{
                const catAssets = assets.filter(a=>a.category===cat)
                if(!catAssets.length) return null
                const val = catAssets.reduce((s,a)=>(a.purchase_price||0)*a.quantity+s,0)
                return (
                  <div key={cat} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
                    <span className="text-xl">{conf.icon}</span>
                    <span className="text-sm font-semibold text-gray-900 flex-1">{conf.label}</span>
                    <span className="text-xs text-gray-500">{catAssets.length} kalem</span>
                    {val>0 && <span className="text-sm font-bold text-gray-700">{val.toLocaleString('tr-TR')} ₺</span>}
                  </div>
                )
              })}
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 font-bold">
                <span className="text-sm text-gray-700 flex-1">Toplam</span>
                <span className="text-xs text-gray-500">{assets.length} kalem</span>
                <span className="text-sm text-gray-900">{totalValue.toLocaleString('tr-TR')} ₺</span>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 text-sm font-bold text-gray-900">Durum Özeti</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
                {Object.entries(COND_CONFIG).map(([cond,conf])=>{
                  const n = assets.filter(a=>a.condition===cond).length
                  return (
                    <div key={cond} className="p-4 text-center border-r border-b border-gray-50 last:border-r-0">
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold mb-2 ${conf.color}`}>
                        <span className={`w-2 h-2 rounded-full ${conf.dot}`}/>{conf.label}
                      </div>
                      <div className="text-2xl font-extrabold text-gray-900">{n}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 text-sm font-bold text-gray-900">Son Bakım/Onarım Kayıtları</div>
              {logs.length===0
                ? <div className="text-center py-8 text-gray-400 text-sm">Bakım kaydı yok</div>
                : [...logs].sort((a,b)=>b.log_date.localeCompare(a.log_date)).slice(0, 30).map((l,i)=>{
                    const asset = assets.find(a=>a.id===l.asset_id)
                    return (
                      <div key={i} className="flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
                        <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${l.maintenance_type==='bakim'?'bg-blue-100 text-blue-700':l.maintenance_type==='tamir'?'bg-amber-100 text-amber-700':'bg-red-100 text-red-600'}`}>
                          {l.maintenance_type==='bakim'?'🔧 Bakım':l.maintenance_type==='tamir'?'🔨 Tamir':'🔄 Değişim'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-gray-700">{asset?.name} <span className="text-gray-400 font-mono">({asset?.code})</span></div>
                          <div className="text-xs text-gray-500">{l.note}</div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-xs text-gray-400">{l.log_date}</div>
                          {l.cost ? <div className="text-xs font-bold text-gray-700">{Number(l.cost).toLocaleString('tr-TR')} ₺</div> : null}
                        </div>
                      </div>
                    )
                  })
              }
            </div>

            <button onClick={exportXLSX}
              className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl text-sm transition-colors">
              ⬇ Tüm Demirbaş Listesini Excel'e Aktar
            </button>
          </div>
        )}
      </div>

      {qrAsset && <AssetQRModal asset={qrAsset} onClose={()=>setQrAsset(null)}/>}

      {detailAsset && (
        <Modal open={!!detailAsset} onClose={()=>setDetailAsset(null)} title={`📋 ${detailAsset.name}`} wide
          footer={<>
            <Button variant="outline" onClick={()=>setDetailAsset(null)}>Kapat</Button>
            <Button onClick={()=>{setQrAsset(detailAsset);setDetailAsset(null)}}>📱 QR Göster</Button>
          </>}>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {[
              ['Kod', detailAsset.code],['Kategori', CAT_CONFIG[detailAsset.category as Category]?.label],
              ['Durum', COND_CONFIG[detailAsset.condition as Condition]?.label],['Adet', `${detailAsset.quantity} ${detailAsset.unit}`],
              ['Konum', detailAsset.location||'—'],['Satın Alma', detailAsset.purchase_date||'—'],
              ['Fiyat', detailAsset.purchase_price?Number(detailAsset.purchase_price).toLocaleString('tr-TR')+' ₺':'—'],
              ['Tedarikçi', detailAsset.supplier||'—'],
              ['Seri No', detailAsset.serial_no||'—'],
              ['Son Bakım', detailAsset.last_maintenance||'—'],
              ['Sonraki Bakım', detailAsset.next_maintenance||'—'],
              ['Kayıt Tarihi', detailAsset.created_at?.split('T')[0]],
            ].map(([l,v])=>(
              <div key={l} className="flex gap-2 text-xs py-1.5 border-b border-gray-50">
                <span className="text-gray-400 w-24 flex-shrink-0 font-semibold">{l}</span>
                <span className="text-gray-700">{v}</span>
              </div>
            ))}
          </div>
          {detailAsset.note && (
            <div className="mt-3 bg-gray-50 rounded-lg p-3 text-xs text-gray-600 italic">"{detailAsset.note}"</div>
          )}
          {detailLogs.length>0 && (
            <div className="mt-3">
              <div className="text-xs font-bold text-gray-500 uppercase mb-2">Bakım Geçmişi</div>
              {detailLogs.map((l,i)=>(
                <div key={i} className="flex gap-3 text-xs py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-gray-400">{l.log_date}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${l.maintenance_type==='bakim'?'bg-blue-100 text-blue-700':'bg-amber-100 text-amber-700'}`}>
                    {l.maintenance_type==='bakim'?'Bakım':l.maintenance_type==='tamir'?'Tamir':'Değişim'}
                  </span>
                  <span className="text-gray-600 flex-1">{l.note}</span>
                  {l.cost?<span className="text-gray-500 flex-shrink-0">{l.cost} ₺</span>:null}
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {logModal && (
        <Modal open={!!logModal} onClose={()=>setLogModal(null)} title={`🔧 ${logModal.name} — Bakım/Onarım Kaydı`}
          footer={<><Button variant="outline" onClick={()=>setLogModal(null)}>İptal</Button><Button onClick={addLog} loading={saving}>Kaydet</Button></>}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">İşlem Türü</label>
              <div className="grid grid-cols-3 gap-2">
                {([['bakim','🔧 Bakım'],['tamir','🔨 Tamir/Onarım'],['degisim','🔄 Parça Değişimi']] as const).map(([v,l])=>(
                  <button key={v} onClick={()=>setLogForm(p=>({...p,type:v}))}
                    className={cn('py-2 rounded-xl border-2 text-xs font-bold transition-all',logForm.type===v?'border-green-500 bg-green-50 text-green-700':'border-gray-200 text-gray-600')}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Tarih</label>
              <input type="date" value={logForm.date} onChange={e=>setLogForm(p=>({...p,date:e.target.value}))}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Açıklama *</label>
              <textarea value={logForm.note} onChange={e=>setLogForm(p=>({...p,note:e.target.value}))} rows={3}
                placeholder="Yapılan işlemi açıklayın..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500 resize-none"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Maliyet (₺)</label>
              <input type="number" value={logForm.cost} onChange={e=>setLogForm(p=>({...p,cost:e.target.value}))} placeholder="0"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"/>
            </div>
          </div>
        </Modal>
      )}
    </AdminLayout>
  )
}
