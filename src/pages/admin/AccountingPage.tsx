import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Button, Modal, useToast } from '@/components/ui'
import * as XLSX from 'xlsx'
import { accountingApi } from '@/lib/api'

// ─── TİPLER ──────────────────────────────────────────────────────────────────
type EntryType = 'gelir' | 'gider' | 'transfer'
type Category = 'bagis_cuma'|'bagis_bayram'|'bagis_kisi'|'bagis_genel'|'kurs_ucreti'|'kira'|'kirtasiye'|'temizlik'|'ikram'|'onarim'|'diger'
type Tab = 'kasalar' | 'hareketler' | 'rapor'

interface Kasa { id:string; name:string; color:string; note?:string; created_at:string }
interface Entry {
  id:number; type:EntryType; category:Category; amount:number
  description:string; date:string; kasaId:string; toKasaId?:string; note?:string; donor?:string; receipt_url?:string
}

const CAT: Record<Category,{label:string;icon:string;type:'gelir'|'gider';color:string}> = {
  bagis_cuma:   {label:'Cuma Bağışı',   icon:'🕌',type:'gelir',color:'bg-green-100 text-green-700'},
  bagis_bayram: {label:'Bayram Bağışı', icon:'🌙',type:'gelir',color:'bg-green-100 text-green-700'},
  bagis_kisi:   {label:'Kişi Bağışı',  icon:'🤲',type:'gelir',color:'bg-emerald-100 text-emerald-700'},
  bagis_genel:  {label:'Genel Bağış',   icon:'💚',type:'gelir',color:'bg-teal-100 text-teal-700'},
  kurs_ucreti:  {label:'Kurs Ücreti',   icon:'📚',type:'gelir',color:'bg-blue-100 text-blue-700'},
  kira:         {label:'Kira',          icon:'🏠',type:'gider',color:'bg-red-100 text-red-600'},
  kirtasiye:    {label:'Kırtasiye',     icon:'📎',type:'gider',color:'bg-orange-100 text-orange-700'},
  temizlik:     {label:'Temizlik',      icon:'🧹',type:'gider',color:'bg-orange-100 text-orange-700'},
  ikram:        {label:'İkram',         icon:'☕',type:'gider',color:'bg-amber-100 text-amber-700'},
  onarim:       {label:'Onarım',        icon:'🔧',type:'gider',color:'bg-red-100 text-red-600'},
  diger:        {label:'Diğer',         icon:'📦',type:'gider',color:'bg-gray-100 text-gray-600'},
}

const KASA_COLORS = [
  {id:'green',  bg:'bg-green-500',  dot:'#22c55e', light:'bg-green-50 border-green-200 text-green-700'},
  {id:'blue',   bg:'bg-blue-500',   dot:'#3b82f6', light:'bg-blue-50 border-blue-200 text-blue-700'},
  {id:'purple', bg:'bg-purple-500', dot:'#a855f7', light:'bg-purple-50 border-purple-200 text-purple-700'},
  {id:'amber',  bg:'bg-amber-500',  dot:'#f59e0b', light:'bg-amber-50 border-amber-200 text-amber-700'},
  {id:'rose',   bg:'bg-rose-500',   dot:'#f43f5e', light:'bg-rose-50 border-rose-200 text-rose-700'},
  {id:'teal',   bg:'bg-teal-500',   dot:'#14b8a6', light:'bg-teal-50 border-teal-200 text-teal-700'},
]

const INIT_KASALAR: Kasa[] = [
  {id:'k1', name:'Ana Kasa',    color:'green', created_at:'2026-01-01'},
  {id:'k2', name:'Bağış Kasası',color:'blue',  created_at:'2026-01-01'},
]

const INIT_ENTRIES: Entry[] = [
  {id:1,  type:'gelir',    category:'bagis_cuma',   amount:1250, description:'14 Haz Cuma bağışı',       date:'2026-06-14', kasaId:'k2'},
  {id:2,  type:'gelir',    category:'bagis_cuma',   amount:980,  description:'7 Haz Cuma bağışı',        date:'2026-06-07', kasaId:'k2'},
  {id:3,  type:'gelir',    category:'bagis_cuma',   amount:1100, description:'31 May Cuma bağışı',       date:'2026-05-31', kasaId:'k2'},
  {id:4,  type:'gelir',    category:'bagis_kisi',   amount:500,  description:'Hayır bağışı',             date:'2026-06-10', kasaId:'k2', donor:'Ahmet Yılmaz'},
  {id:5,  type:'gelir',    category:'bagis_kisi',   amount:1000, description:'Kurban bağışı',            date:'2026-06-05', kasaId:'k2', donor:'Mehmet Kaya'},
  {id:6,  type:'gelir',    category:'bagis_bayram', amount:2500, description:'Kurban Bayramı bağışı',    date:'2026-06-15', kasaId:'k2'},
  {id:7,  type:'gelir',    category:'kurs_ucreti',  amount:300,  description:'Haziran kurs ücreti',      date:'2026-06-01', kasaId:'k1'},
  {id:8,  type:'transfer', category:'diger',        amount:1000, description:'Bağış → Ana kasa aktarım', date:'2026-06-10', kasaId:'k2', toKasaId:'k1'},
  {id:9,  type:'gider',    category:'kirtasiye',    amount:185,  description:'Kitap ve kalem',           date:'2026-06-08', kasaId:'k1'},
  {id:10, type:'gider',    category:'ikram',        amount:95,   description:'Çay/şeker',                date:'2026-06-12', kasaId:'k1'},
  {id:11, type:'gider',    category:'temizlik',     amount:150,  description:'Temizlik malzemeleri',     date:'2026-06-03', kasaId:'k1'},
  {id:12, type:'gider',    category:'onarim',       amount:450,  description:'Çatı tamiratı',            date:'2026-05-25', kasaId:'k1'},
  {id:13, type:'gider',    category:'kira',         amount:2000, description:'Mayıs kirası',             date:'2026-05-01', kasaId:'k1'},
]

function tl(n:number){ return n.toLocaleString('tr-TR') + ' ₺' }

function calcBalance(kasaId:string, entries:Entry[]): number {
  return entries.reduce((bal, e) => {
    if (e.kasaId === kasaId) {
      if (e.type === 'gelir')    return bal + e.amount
      if (e.type === 'gider')    return bal - e.amount
      if (e.type === 'transfer') return bal - e.amount // çıkış
    }
    if (e.toKasaId === kasaId && e.type === 'transfer') return bal + e.amount // giriş
    return bal
  }, 0)
}

function kasaColor(colorId:string) {
  return KASA_COLORS.find(c => c.id === colorId) || KASA_COLORS[0]
}

const thisMonth = new Date().toISOString().slice(0, 7)

async function exportPDF(kasalar: Kasa[], entries: Entry[], start: string, end: string, selectedKasaId: string) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const filteredEntries = entries.filter(e => {
    const inDate = e.date >= start && e.date <= end
    const inKasa = !selectedKasaId || e.kasaId === selectedKasaId || e.toKasaId === selectedKasaId
    return inDate && inKasa
  })

  const gelir = filteredEntries.filter(e => e.type === 'gelir').reduce((a, e) => a + e.amount, 0)
  const gider = filteredEntries.filter(e => e.type === 'gider').reduce((a, e) => a + e.amount, 0)

  // Başlık
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('MUHASEBE RAPORU', 105, 20, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Donem: ${start} - ${end}`, 105, 28, { align: 'center' })
  doc.text(`Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`, 105, 34, { align: 'center' })

  // Özet kutusu
  doc.setFillColor(240, 250, 244)
  doc.rect(15, 40, 180, 24, 'F')
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('OZET', 20, 48)
  doc.setFont('helvetica', 'normal')
  doc.text(`Toplam Gelir: ${gelir.toLocaleString('tr-TR')} TL`, 20, 55)
  doc.text(`Toplam Gider: ${gider.toLocaleString('tr-TR')} TL`, 90, 55)
  doc.text(`Net: ${(gelir - gider).toLocaleString('tr-TR')} TL`, 160, 55)

  let y = 72

  // Hareket tablosu başlıkları
  doc.setFillColor(27, 67, 50)
  doc.rect(15, y - 5, 180, 8, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('Tarih', 17, y)
  doc.text('Tur', 40, y)
  doc.text('Aciklama', 60, y)
  doc.text('Tutar', 130, y)
  doc.text('Fis', 155, y)
  doc.setTextColor(0, 0, 0)
  y += 8

  for (const e of filteredEntries) {
    if (y > 250) {
      doc.addPage()
      y = 20
    }

    const isGelir = e.type === 'gelir'
    const isGider = e.type === 'gider'

    // Zebra satır
    if (filteredEntries.indexOf(e) % 2 === 0) {
      doc.setFillColor(248, 250, 252)
      doc.rect(15, y - 4, 180, isGider && e.receipt_url ? 30 : 10, 'F')
    }

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(e.date, 17, y)
    doc.text(e.type === 'gelir' ? 'Gelir' : e.type === 'gider' ? 'Gider' : 'Transfer', 40, y)

    const desc = e.description.length > 35 ? e.description.slice(0, 35) + '...' : e.description
    doc.text(desc, 60, y)

    doc.setFont('helvetica', 'bold')
    if (isGelir) doc.setTextColor(22, 163, 74)
    else if (isGider) doc.setTextColor(220, 38, 38)
    else doc.setTextColor(124, 58, 237)
    doc.text(`${isGelir ? '+' : isGider ? '-' : '↔'}${e.amount.toLocaleString('tr-TR')} TL`, 130, y)
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')

    // Fiş görseli
    if (e.receipt_url) {
      try {
        const imgRes = await fetch(e.receipt_url)
        const blob = await imgRes.blob()
        const reader = new FileReader()
        const dataUrl: string = await new Promise(res => {
          reader.onload = () => res(reader.result as string)
          reader.readAsDataURL(blob)
        })
        const ext = e.receipt_url.split('.').pop()?.toLowerCase() || 'jpg'
        const fmt = ext === 'png' ? 'PNG' : 'JPEG'
        doc.addImage(dataUrl, fmt, 155, y - 3, 35, 25)
        y += 30
      } catch {
        doc.text('(Fis yuklenemedi)', 155, y)
        y += 10
      }
    } else {
      doc.setTextColor(180, 180, 180)
      doc.text('Fis yok', 155, y)
      doc.setTextColor(0, 0, 0)
      y += 10
    }

    // Bağışçı varsa alt satır
    if (e.donor) {
      doc.setFontSize(7)
      doc.setTextColor(100, 100, 100)
      doc.text(`Bagisci: ${e.donor}`, 60, y - 7)
      doc.setTextColor(0, 0, 0)
    }

    // Ayırıcı çizgi
    doc.setDrawColor(230, 230, 230)
    doc.line(15, y - 2, 195, y - 2)
  }

  // Alt bilgi
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text('Mesyo Soft - Muhasebe Raporu', 105, 287, { align: 'center' })

  const kasaAdi = selectedKasaId ? (kasalar.find(k => k.id === selectedKasaId)?.name || 'Kasa') : 'Tum-Kasalar'
  doc.save(`muhasebe-${kasaAdi}-${start}-${end}.pdf`)
}

function exportKasaXLSX(kasa:Kasa, entries:Entry[], allKasalar:Kasa[], start:string, end:string) {
  const ents = entries.filter(e => (e.kasaId===kasa.id || e.toKasaId===kasa.id) && e.date>=start && e.date<=end)
  const gelir = ents.filter(e=>e.type==='gelir'||(e.type==='transfer'&&e.toKasaId===kasa.id)).reduce((a,e)=>a+e.amount,0)
  const gider = ents.filter(e=>(e.type==='gider'||e.type==='transfer')&&e.kasaId===kasa.id).reduce((a,e)=>a+e.amount,0)
  const ozet = [
    [`${kasa.name} — Kasa Raporu`], [`Dönem: ${start} — ${end}`], [`Rapor: ${new Date().toLocaleDateString('tr-TR')}`], [],
    ['Toplam Giren', tl(gelir)], ['Toplam Çıkan', tl(gider)], ['Bakiye', tl(gelir-gider)]
  ]
  const detay = ents.map(e=>({
    Tarih:e.date, İşlem:e.type==='gelir'?'Gelir':e.type==='gider'?'Gider':'Transfer',
    Kategori:CAT[e.category]?.label||'—', Açıklama:e.description,
    'Bağışçı':e.donor||'—',
    'Hedef Kasa':e.toKasaId?(allKasalar.find(k=>k.id===e.toKasaId)?.name||'—'):'—',
    'Tutar (₺)':e.amount,
    Yön:e.toKasaId===kasa.id?'Gelen':e.kasaId===kasa.id?'Giden':'—'
  }))
  const wb = XLSX.utils.book_new()
  const ws1 = XLSX.utils.aoa_to_sheet(ozet)
  ws1['!cols'] = [{wch:25},{wch:18}]
  XLSX.utils.book_append_sheet(wb, ws1, 'Özet')
  const ws2 = XLSX.utils.json_to_sheet(detay)
  ws2['!cols'] = [{wch:12},{wch:10},{wch:18},{wch:35},{wch:18},{wch:18},{wch:12},{wch:8}]
  XLSX.utils.book_append_sheet(wb, ws2, 'Hareketler')
  XLSX.writeFile(wb, `${kasa.name}-${start}-${end}.xlsx`)
}

function exportAllXLSX(kasalar:Kasa[], entries:Entry[], start:string, end:string) {
  const wb = XLSX.utils.book_new()
  const genelData = [
    ['TÜM KASALAR — MUHASEBE RAPORU'], [`Dönem: ${start} — ${end}`], [],
    ['Kasa', 'Giren', 'Çıkan', 'Bakiye'],
    ...kasalar.map(k=>{
      const ents = entries.filter(e=>(e.kasaId===k.id||e.toKasaId===k.id)&&e.date>=start&&e.date<=end)
      const g = ents.filter(e=>e.type==='gelir'||(e.type==='transfer'&&e.toKasaId===k.id)).reduce((a,e)=>a+e.amount,0)
      const c = ents.filter(e=>(e.type==='gider'||e.type==='transfer')&&e.kasaId===k.id).reduce((a,e)=>a+e.amount,0)
      return [k.name, tl(g), tl(c), tl(g-c)]
    })
  ]
  const ws0 = XLSX.utils.aoa_to_sheet(genelData)
  ws0['!cols'] = [{wch:20},{wch:15},{wch:15},{wch:15}]
  XLSX.utils.book_append_sheet(wb, ws0, 'Genel Özet')
  kasalar.forEach(k=>{
    const ents = entries.filter(e=>(e.kasaId===k.id||e.toKasaId===k.id)&&e.date>=start&&e.date<=end)
    if (!ents.length) return
    const data = ents.map(e=>({
      Tarih:e.date, İşlem:e.type==='gelir'?'Gelir':e.type==='gider'?'Gider':'Transfer',
      Kategori:CAT[e.category]?.label||'—', Açıklama:e.description,
      Bağışçı:e.donor||'—', 'Tutar (₺)':e.amount,
      Yön:e.toKasaId===k.id?'Gelen':e.kasaId===k.id?'Giden':'—'
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    XLSX.utils.book_append_sheet(wb, ws, k.name.slice(0,31))
  })
  XLSX.writeFile(wb, `muhasebe-tum-kasalar-${start}-${end}.xlsx`)
}

// ─── KASA EKLE MODAL ─────────────────────────────────────────────────────────
function KasaModal({ open, onClose, onAdd }: {open:boolean; onClose:()=>void; onAdd:(k:Kasa)=>void}) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('green')
  const [note, setNote] = useState('')
  const { toast } = useToast()
  if (!open) return null
  const add = () => {
    if (!name.trim()) { toast('Kasa adı girin','error'); return }
    onAdd({ id:'k'+Date.now(), name:name.trim(), color, note:note||undefined, created_at:new Date().toISOString().split('T')[0] })
    setName(''); setColor('green'); setNote('')
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title="🏦 Yeni Kasa Ekle"
      footer={<><Button variant="outline" onClick={onClose}>İptal</Button><Button onClick={add}>Oluştur</Button></>}>
      <div className="mb-3">
        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Kasa Adı *</label>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="örn: Yardım Kasası"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"/>
      </div>
      <div className="mb-3">
        <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase">Renk</label>
        <div className="flex gap-2 flex-wrap">
          {KASA_COLORS.map(c=>(
            <button key={c.id} onClick={()=>setColor(c.id)}
              className={`w-8 h-8 rounded-full ${c.bg} transition-all ${color===c.id?'ring-2 ring-offset-2 ring-gray-400 scale-110':''}`}/>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Not (opsiyonel)</label>
        <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Kasa hakkında not..."
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"/>
      </div>
    </Modal>
  )
}

// ─── İŞLEM EKLE MODAL ────────────────────────────────────────────────────────
function IslemModal({ open, onClose, onAdd, kasalar }: {open:boolean; onClose:()=>void; onAdd:(e:Entry)=>void; kasalar:Kasa[]}) {
  const { toast } = useToast()
  const [type, setType] = useState<EntryType>('gelir')
  const [category, setCategory] = useState<Category>('bagis_cuma')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [kasaId, setKasaId] = useState(kasalar[0]?.id||'')
  const [toKasaId, setToKasaId] = useState('')
  const [note, setNote] = useState('')
  const [donor, setDonor] = useState('')

  const gelirCats = (Object.entries(CAT) as [Category,typeof CAT[Category]][]).filter(([,v])=>v.type==='gelir')
  const giderCats = (Object.entries(CAT) as [Category,typeof CAT[Category]][]).filter(([,v])=>v.type==='gider')

  const save = () => {
    if (!amount||!description||!date||!kasaId) { toast('Zorunlu alanları doldurun','error'); return }
    if (type==='transfer'&&!toKasaId) { toast('Hedef kasa seçin','error'); return }
    if (type==='transfer'&&kasaId===toKasaId) { toast('Aynı kasaya transfer yapılamaz','error'); return }
    onAdd({ id:Date.now(), type, category, amount:parseFloat(amount)||0, description, date,
      kasaId, toKasaId:type==='transfer'?toKasaId:undefined, note:note||undefined, donor:donor||undefined })
    setAmount(''); setDescription(''); setNote(''); setDonor('')
    onClose()
  }

  if (!open) return null
  return (
    <Modal open={open} onClose={onClose} title="💰 Yeni İşlem"
      footer={<><Button variant="outline" onClick={onClose}>İptal</Button><Button onClick={save}>Kaydet</Button></>}>
      {/* Tür */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {([['gelir','💚 Gelir'],['gider','🔴 Gider'],['transfer','↔ Transfer']] as const).map(([v,l])=>(
          <button key={v} onClick={()=>{setType(v);if(v!=='transfer')setCategory(v==='gelir'?'bagis_cuma':'kirtasiye')}}
            className={`py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${type===v?(v==='gelir'?'border-green-500 bg-green-50 text-green-700':v==='gider'?'border-red-400 bg-red-50 text-red-600':'border-purple-400 bg-purple-50 text-purple-700'):'border-gray-200 text-gray-500'}`}>
            {l}
          </button>
        ))}
      </div>
      {/* Kasa */}
      <div className="mb-3">
        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">{type==='transfer'?'Kaynak Kasa *':'Kasa *'}</label>
        <select value={kasaId} onChange={e=>setKasaId(e.target.value)}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500">
          <option value="">Kasa seçin</option>
          {kasalar.map(k=><option key={k.id} value={k.id}>{k.name}</option>)}
        </select>
      </div>
      {type==='transfer' && (
        <div className="mb-3">
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Hedef Kasa *</label>
          <select value={toKasaId} onChange={e=>setToKasaId(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500">
            <option value="">Hedef seçin</option>
            {kasalar.filter(k=>k.id!==kasaId).map(k=><option key={k.id} value={k.id}>{k.name}</option>)}
          </select>
        </div>
      )}
      {/* Kategori */}
      {type!=='transfer' && (
        <div className="mb-3">
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Kategori</label>
          <div className="grid grid-cols-2 gap-1.5">
            {(type==='gelir'?gelirCats:giderCats).map(([v,c])=>(
              <button key={v} onClick={()=>setCategory(v)}
                className={`py-2 px-3 rounded-lg border-[1.5px] text-xs font-semibold text-left transition-all ${category===v?'border-green-500 bg-green-50 text-green-700':'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                {c.icon} {c.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {category==='bagis_kisi' && (
        <div className="mb-3">
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Bağışçı Adı</label>
          <input value={donor} onChange={e=>setDonor(e.target.value)} placeholder="Ad Soyad"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"/>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Tutar (₺) *</label>
          <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"/>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Tarih *</label>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"/>
        </div>
      </div>
      <div className="mb-3">
        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Açıklama *</label>
        <input value={description} onChange={e=>setDescription(e.target.value)} placeholder="Açıklama"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"/>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Not (opsiyonel)</label>
        <textarea value={note} onChange={e=>setNote(e.target.value)} rows={2}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500 resize-none"/>
      </div>
    </Modal>
  )
}

// Backend → frontend format dönüşümü
function normalizeKasa(k: any): Kasa {
  return { id: k.id, name: k.name, color: k.color, note: k.note, created_at: k.created_at }
}
function normalizeEntry(e: any): Entry {
  return {
    id: e.id,
    type: e.entry_type as EntryType,
    category: e.category as Category,
    amount: parseFloat(e.amount),
    description: e.description,
    date: e.entry_date,
    kasaId: e.cash_register_id,
    toKasaId: e.to_cash_register_id || undefined,
    note: e.note || undefined,
    donor: e.donor_name || undefined,
    receipt_url: e.receipt_url || undefined,
  }
}

// ─── ANA SAYFA ────────────────────────────────────────────────────────────────
export default function AccountingPage() {
  const { toast } = useToast()
  const [tab, setTab] = useState<Tab>('kasalar')
  const [kasalar, setKasalar] = useState<Kasa[]>([])
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [addKasaOpen, setAddKasaOpen] = useState(false)
  const [addIslemOpen, setAddIslemOpen] = useState(false)
  const [detailKasaId, setDetailKasaId] = useState<string|null>(null)

  // Veri yükleme
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const [regs, ents] = await Promise.all([
          accountingApi.listRegisters(),
          accountingApi.listEntries(),
        ])
        if (cancelled) return
        setKasalar(regs.map(normalizeKasa))
        setEntries(ents.map(normalizeEntry))
      } catch (e: any) {
        if (!cancelled) toast(e.message || 'Veriler yüklenemedi', 'error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])
  const [selKasa, setSelKasa] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [rptStart, setRptStart] = useState(()=>{const d=new Date();d.setMonth(d.getMonth()-1);return d.toISOString().split('T')[0]})
  const [rptEnd, setRptEnd] = useState(new Date().toISOString().split('T')[0])
  const [rptKasa, setRptKasa] = useState('')
  const [rptType, setRptType] = useState<'all'|'gelir'|'gider'>('all')
  const [rptCat, setRptCat] = useState<Category|''>('')

  // Bakiyeler
  const kasaWithBal = kasalar.map(k => ({ ...k, balance: calcBalance(k.id, entries) }))
  const totalBal = kasaWithBal.reduce((a,k) => a + k.balance, 0)

  // Hareketler filtresi
  const filteredEntries = entries
    .filter(e => !selKasa || e.kasaId===selKasa || e.toKasaId===selKasa)
    .filter(e => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase().trim()
      const kasa = kasalar.find(k => k.id === e.kasaId)
      const toKasa = kasalar.find(k => k.id === e.toKasaId)
      return (
        (e.description || '').toLowerCase().includes(q) ||
        (e.note || '').toLowerCase().includes(q) ||
        (e.donor || '').toLowerCase().includes(q) ||
        String(e.amount).includes(q) ||
        (e.date || '').includes(q) ||
        (CAT[e.category]?.label || '').toLowerCase().includes(q) ||
        (kasa?.name || '').toLowerCase().includes(q) ||
        (toKasa?.name || '').toLowerCase().includes(q)
      )
    })
    .sort((a,b) => b.date.localeCompare(a.date))

  // Rapor filtresi
  const rptEntries = entries.filter(e => {
    const mk = !rptKasa || (e.kasaId===rptKasa || e.toKasaId===rptKasa)
    const md = e.date>=rptStart && e.date<=rptEnd
    const mt = rptType==='all' || (rptType==='gelir'&&e.type==='gelir') || (rptType==='gider'&&e.type==='gider')
    const mc = !rptCat || e.category===rptCat
    return mk&&md&&mt&&mc
  })
  const rptGelir = rptEntries.filter(e=>e.type==='gelir').reduce((a,e)=>a+e.amount,0)
  const rptGider = rptEntries.filter(e=>e.type==='gider').reduce((a,e)=>a+e.amount,0)

  const gelirCats = (Object.entries(CAT) as [Category,typeof CAT[Category]][]).filter(([,v])=>v.type==='gelir')
  const giderCats = (Object.entries(CAT) as [Category,typeof CAT[Category]][]).filter(([,v])=>v.type==='gider')

  const delKasa = async (id:string) => {
    if (!confirm('Kasayı silmek istiyor musunuz?')) return
    try {
      await accountingApi.deleteRegister(id)
      setKasalar(p=>p.filter(k=>k.id!==id))
      toast('Kasa silindi','info')
    } catch (e: any) {
      toast(e.message || 'Kasa silinemedi', 'error')
    }
  }

  if (loading) return (
    <AdminLayout>
      <div className="flex items-center justify-center py-24 text-gray-400">
        <div className="text-center">
          <div className="text-3xl mb-2 animate-pulse">⏳</div>
          <p className="text-sm">Muhasebe verileri yükleniyor...</p>
        </div>
      </div>
    </AdminLayout>
  )

  return (
    <AdminLayout>
      {/* Üst bar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex bg-gray-100 rounded-xl p-1">
          {(['kasalar','hareketler','rapor'] as const).map(t => (
            <button key={t} onClick={()=>setTab(t)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg capitalize transition-all ${tab===t?'bg-white text-gray-900 shadow-sm':'text-gray-400 hover:text-gray-600'}`}>
              {t==='kasalar'?'🏦 Kasalar':t==='hareketler'?'📋 Hareketler':'📊 Rapor'}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={()=>setAddKasaOpen(true)}
            className="px-3 py-2 border border-gray-200 bg-white text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors">
            🏦 Kasa Ekle
          </button>
          <Button onClick={()=>setAddIslemOpen(true)}>+ İşlem Ekle</Button>
        </div>
      </div>

      {/* ── KASALAR ─────────────────────────────────────────────────────────── */}
      {tab==='kasalar' && (
        <div className="space-y-4">
          {/* Toplam */}
          <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Toplam Bakiye (Tüm Kasalar)</div>
              <div className={`text-3xl font-extrabold ${totalBal>=0?'text-gray-900':'text-red-500'}`}>{tl(totalBal)}</div>
            </div>
            <div className="text-4xl">💰</div>
          </div>

          {/* Kasa kartları */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {kasaWithBal.map(k => {
              const col = kasaColor(k.color)
              const ents = entries.filter(e=>e.kasaId===k.id||e.toKasaId===k.id)
              const ayGelir = ents.filter(e=>e.type==='gelir'&&e.date.startsWith(thisMonth)).reduce((a,e)=>a+e.amount,0)
              const ayGider = ents.filter(e=>e.type==='gider'&&e.date.startsWith(thisMonth)).reduce((a,e)=>a+e.amount,0)
              const isDetail = detailKasaId===k.id
              return (
                <div key={k.id} className={`bg-white rounded-2xl shadow-sm border-2 ${k.balance<0?'border-red-200':'border-gray-100'}`}>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${col.bg} flex-shrink-0`}/>
                        <span className="font-bold text-gray-900">{k.name}</span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={()=>setDetailKasaId(isDetail?null:k.id)}
                          className={`px-2 py-1 text-[10px] font-semibold border rounded-lg transition-colors ${isDetail?'border-green-400 bg-green-50 text-green-700':'border-gray-200 hover:bg-gray-50'}`}>
                          {isDetail?'Kapat':'Detay'}
                        </button>
                        {kasalar.length>1 && (
                          <button onClick={()=>delKasa(k.id)}
                            className="px-2 py-1 text-[10px] font-semibold border border-red-200 text-red-400 rounded-lg hover:bg-red-50">Sil</button>
                        )}
                      </div>
                    </div>
                    <div className={`text-2xl font-extrabold mb-3 ${k.balance<0?'text-red-500':'text-gray-900'}`}>{tl(k.balance)}</div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Bu ay gelir: <span className="text-green-600 font-semibold">{tl(ayGelir)}</span></span>
                      <span className="text-gray-400">Bu ay gider: <span className="text-red-500 font-semibold">{tl(ayGider)}</span></span>
                    </div>
                    {k.note && <div className="text-xs text-gray-400 mt-2 italic">{k.note}</div>}
                  </div>

                  {/* Detay satırları */}
                  {isDetail && (
                    <div className="border-t border-gray-100">
                      <div className="px-4 py-2 text-xs font-bold text-gray-500 bg-gray-50">Son Hareketler</div>
                      {entries
                        .filter(e=>e.kasaId===k.id||e.toKasaId===k.id)
                        .sort((a,b)=>b.date.localeCompare(a.date))
                        .slice(0,8)
                        .map(e=>{
                          const isGiren = e.toKasaId===k.id
                          const conf = CAT[e.category]
                          const plus = e.type==='gelir'||isGiren
                          return (
                            <div key={e.id} className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50">
                              <span className="text-xs text-gray-400 w-20 flex-shrink-0">{e.date}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${e.type==='transfer'?'bg-purple-100 text-purple-700':conf.color}`}>
                                {e.type==='transfer'?'↔ Transfer':conf.icon+' '+conf.label}
                              </span>
                              <span className="text-xs text-gray-700 flex-1 truncate">{e.description}{e.donor?' — '+e.donor:''}</span>
                              <span className={`text-sm font-bold flex-shrink-0 ${plus?'text-green-600':'text-red-500'}`}>
                                {plus?'+':'-'}{tl(e.amount)}
                              </span>
                            </div>
                          )
                        })
                      }
                      {entries.filter(e=>e.kasaId===k.id||e.toKasaId===k.id).length===0 && (
                        <div className="px-4 py-3 text-xs text-gray-400 text-center">Henüz işlem yok</div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Cuma + Kişi bağış özeti */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { label:'🕌 Cuma Bağışları', cats:['bagis_cuma'] as Category[] },
              { label:'🤲 Kişi Bağışları', cats:['bagis_kisi'] as Category[] },
            ].map(({label,cats})=>{
              const ents = entries.filter(e=>cats.includes(e.category)).sort((a,b)=>b.date.localeCompare(a.date))
              const total = ents.reduce((a,e)=>a+e.amount,0)
              return (
                <div key={label} className="bg-white rounded-xl shadow-sm p-4">
                  <div className="text-sm font-bold text-gray-900 mb-3">{label}</div>
                  {ents.length===0
                    ? <p className="text-xs text-gray-400">Henüz kayıt yok</p>
                    : <>
                        {ents.slice(0,5).map(e=>(
                          <div key={e.id} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0">
                            <span className="text-xs text-gray-400 w-24 flex-shrink-0">{e.date}</span>
                            <span className="text-xs text-gray-600 flex-1 truncate">{e.donor||e.description}</span>
                            <span className="text-sm font-bold text-green-600 flex-shrink-0">{tl(e.amount)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                          <span className="text-xs font-semibold text-gray-500">Toplam ({ents.length} kayıt)</span>
                          <span className="text-sm font-extrabold text-green-600">{tl(total)}</span>
                        </div>
                      </>
                  }
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── HAREKETLER ──────────────────────────────────────────────────────── */}
      {tab==='hareketler' && (
        <div className="space-y-3">

          {/* Genel Arama Motoru */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="text-gray-400 text-lg">🔍</span>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tutar, açıklama, not, kişi adı, tarih, kategori... (örn: 1580, Ali Bey, boya)"
              className="w-full pl-11 pr-10 py-3.5 border-2 border-green-400 focus:border-green-600 rounded-2xl text-sm outline-none bg-white shadow-sm font-medium placeholder-gray-400 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
          {searchQuery && (
            <div className="text-xs text-green-700 font-semibold bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              🔎 "{searchQuery}" için {filteredEntries.length} sonuç bulundu
              {filteredEntries.length === 0 && ' — farklı bir arama deneyin'}
            </div>
          )}

          {/* Kasa + filtre */}
          <div className="flex gap-2 flex-wrap">
            <button onClick={()=>setSelKasa('')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${!selKasa?'bg-green-500 text-white border-green-500':'border-gray-200 text-gray-500 bg-white'}`}>
              Tüm Kasalar
            </button>
            {kasalar.map(k=>{
              const col = kasaColor(k.color)
              return (
                <button key={k.id} onClick={()=>setSelKasa(selKasa===k.id?'':k.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${selKasa===k.id?col.light:'border-gray-200 text-gray-500 bg-white'}`}>
                  <div className={`w-2 h-2 rounded-full ${col.bg}`}/>{k.name}
                </button>
              )
            })}
            <span className="ml-auto text-xs text-gray-400 self-center">{filteredEntries.length} kayıt</span>
          </div>

          {/* Tablo */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Tarih','Kasa','Kategori','Açıklama','Tutar',''].map(h=>(
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-bold text-gray-400 uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.length===0
                    ? <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">Kayıt bulunamadı</td></tr>
                    : filteredEntries.map(e=>{
                        const conf = CAT[e.category]
                        const kasa = kasalar.find(k=>k.id===e.kasaId)
                        const toKasa = kasalar.find(k=>k.id===e.toKasaId)
                        const col = kasaColor(kasa?.color||'green')
                        return (
                          <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{e.date}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${col.light}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${col.bg}`}/>{kasa?.name||'—'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {e.type==='transfer'
                                ? <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">↔ Transfer → {toKasa?.name}</span>
                                : <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${conf.color}`}>{conf.icon} {conf.label}</span>
                              }
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-gray-900">{e.description}</div>
                              {e.donor&&<div className="text-xs text-gray-400">👤 {e.donor}</div>}
                              {e.note&&<div className="text-xs text-gray-400 italic">{e.note}</div>}
                            </td>
                            <td className="px-4 py-3 font-bold whitespace-nowrap">
                              <span className={e.type==='gelir'?'text-green-600':e.type==='gider'?'text-red-500':'text-purple-600'}>
                                {e.type==='gelir'?'+':e.type==='gider'?'-':'↔'}{tl(e.amount)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {e.receipt_url ? (
                                  <a href={e.receipt_url} target="_blank" rel="noreferrer"
                                    className="text-lg hover:scale-110 transition-transform" title="Fişi Gör">📄</a>
                                ) : (
                                  <label className="cursor-pointer text-gray-300 hover:text-blue-400 text-lg transition-colors" title="Fiş Ekle">
                                    📷
                                    <input type="file" accept="image/*,application/pdf" capture="environment" className="hidden"
                                      onChange={async (ev) => {
                                        const file = ev.target.files?.[0]
                                        if (!file) return
                                        try {
                                          const res = await accountingApi.uploadReceipt(String(e.id), file)
                                          setEntries(p => p.map(x => x.id === e.id ? { ...x, receipt_url: res.receipt_url } : x))
                                          toast('Fiş yüklendi ✅', 'success')
                                        } catch (err: any) {
                                          toast(err.message || 'Yükleme başarısız', 'error')
                                        }
                                      }} />
                                  </label>
                                )}
                                <button onClick={async ()=>{try{await accountingApi.deleteEntry(String(e.id));setEntries(p=>p.filter(x=>x.id!==e.id));toast('Silindi','info')}catch(err:any){toast(err.message||'Silinemedi','error')}}}
                                  className="text-gray-300 hover:text-red-400 text-xl leading-none">×</button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                  }
                </tbody>
                {filteredEntries.length>0 && (
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={4} className="px-4 py-2 text-xs font-bold text-gray-500 text-right">Toplam (seçili):</td>
                      <td className="px-4 py-2">
                        <div className="text-xs font-bold text-green-600">+{tl(filteredEntries.filter(e=>e.type==='gelir').reduce((a,e)=>a+e.amount,0))}</div>
                        <div className="text-xs font-bold text-red-500">-{tl(filteredEntries.filter(e=>e.type==='gider').reduce((a,e)=>a+e.amount,0))}</div>
                      </td>
                      <td/>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── RAPOR ───────────────────────────────────────────────────────────── */}
      {tab==='rapor' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-sm font-bold text-gray-900 mb-4">📊 Rapor Parametreleri</div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Başlangıç</label>
                <input type="date" value={rptStart} onChange={e=>setRptStart(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Bitiş</label>
                <input type="date" value={rptEnd} onChange={e=>setRptEnd(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"/>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Kasa</label>
                <select value={rptKasa} onChange={e=>setRptKasa(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500">
                  <option value="">Tüm Kasalar</option>
                  {kasalar.map(k=><option key={k.id} value={k.id}>{k.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Tür</label>
                <select value={rptType} onChange={e=>setRptType(e.target.value as any)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500">
                  <option value="all">Tümü</option>
                  <option value="gelir">Gelir</option>
                  <option value="gider">Gider</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Kategori</label>
                <select value={rptCat} onChange={e=>setRptCat(e.target.value as any)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500">
                  <option value="">Tümü</option>
                  <optgroup label="Gelir">{gelirCats.map(([v,c])=><option key={v} value={v}>{c.icon} {c.label}</option>)}</optgroup>
                  <optgroup label="Gider">{giderCats.map(([v,c])=><option key={v} value={v}>{c.icon} {c.label}</option>)}</optgroup>
                </select>
              </div>
            </div>

            {/* Özet */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                <div className="text-xl font-extrabold text-green-600">{tl(rptGelir)}</div>
                <div className="text-[10px] font-bold text-green-500 mt-0.5">Gelir</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                <div className="text-xl font-extrabold text-red-500">{tl(rptGider)}</div>
                <div className="text-[10px] font-bold text-red-400 mt-0.5">Gider</div>
              </div>
              <div className={`border rounded-xl p-3 text-center ${(rptGelir-rptGider)>=0?'bg-blue-50 border-blue-200':'bg-red-50 border-red-200'}`}>
                <div className={`text-xl font-extrabold ${(rptGelir-rptGider)>=0?'text-blue-600':'text-red-500'}`}>{tl(rptGelir-rptGider)}</div>
                <div className={`text-[10px] font-bold mt-0.5 ${(rptGelir-rptGider)>=0?'text-blue-400':'text-red-400'}`}>Bakiye</div>
              </div>
            </div>

            {/* Kasa bazlı */}
            {!rptKasa && rptEntries.length>0 && (
              <div className="bg-gray-50 rounded-xl p-3 mb-4">
                <div className="text-xs font-bold text-gray-500 uppercase mb-2">Kasa Bazlı Dağılım</div>
                {kasalar.map(k=>{
                  const ke = rptEntries.filter(e=>e.kasaId===k.id||e.toKasaId===k.id)
                  const kg = ke.filter(e=>e.type==='gelir'||(e.type==='transfer'&&e.toKasaId===k.id)).reduce((a,e)=>a+e.amount,0)
                  const kc = ke.filter(e=>(e.type==='gider'||e.type==='transfer')&&e.kasaId===k.id).reduce((a,e)=>a+e.amount,0)
                  if (!ke.length) return null
                  const col = kasaColor(k.color)
                  return (
                    <div key={k.id} className="flex items-center gap-3 py-1.5">
                      <div className={`w-2 h-2 rounded-full ${col.bg} flex-shrink-0`}/>
                      <span className="text-xs font-semibold text-gray-700 w-28 flex-shrink-0">{k.name}</span>
                      <span className="text-xs text-green-600 font-semibold">+{tl(kg)}</span>
                      <span className="text-xs text-red-500 font-semibold">-{tl(kc)}</span>
                      <span className={`text-xs font-bold ml-auto ${(kg-kc)>=0?'text-blue-600':'text-red-500'}`}>{tl(kg-kc)}</span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Kategori dağılımı */}
            {rptEntries.length>0 && (
              <div className="bg-gray-50 rounded-xl p-3 mb-4">
                <div className="text-xs font-bold text-gray-500 uppercase mb-2">Kategori Dağılımı</div>
                {(Object.entries(CAT) as [Category,typeof CAT[Category]][]).map(([cat,conf])=>{
                  const total = rptEntries.filter(e=>e.category===cat).reduce((a,e)=>a+e.amount,0)
                  if (!total) return null
                  const base = conf.type==='gelir'?rptGelir||1:rptGider||1
                  return (
                    <div key={cat} className="flex items-center gap-2 mb-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 w-32 truncate ${conf.color}`}>{conf.icon} {conf.label}</span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${conf.type==='gelir'?'bg-green-400':'bg-red-400'}`}
                          style={{width:`${Math.min(Math.round(total/base*100),100)}%`}}/>
                      </div>
                      <span className="text-xs font-bold text-gray-700 w-20 text-right flex-shrink-0">{tl(total)}</span>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="text-xs text-gray-400 text-center mb-4">{rptEntries.length} kayıt · {rptStart} — {rptEnd}</div>

            {/* Excel ve PDF butonları */}
            <div className="space-y-2">
              <button onClick={()=>{
                if(!rptEntries.length){toast('Rapor için kayıt bulunamadı','error');return}
                const k = rptKasa?kasalar.find(k=>k.id===rptKasa):kasalar[0]
                if(k) exportKasaXLSX(k,rptEntries,kasalar,rptStart,rptEnd)
                toast('Excel indiriliyor ⬇️','success')
              }} className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl text-sm transition-colors">
                ⬇ {rptKasa?kasalar.find(k=>k.id===rptKasa)?.name+' Raporu':'Seçili Raporu'} Excel
              </button>
              <button onClick={async ()=>{
                if(!rptEntries.length){toast('Rapor için kayıt bulunamadı','error');return}
                toast('PDF hazırlanıyor, lütfen bekleyin... ⏳','info')
                try {
                  await exportPDF(kasalar, rptEntries, rptStart, rptEnd, rptKasa)
                  toast('PDF indirildi ✅','success')
                } catch(err:any) {
                  toast(err.message||'PDF oluşturulamadı','error')
                }
              }} className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-sm transition-colors">
                📄 PDF İndir (Fişlerle Birlikte)
              </button>
              {!rptKasa && (
                <button onClick={()=>{
                  if(!rptEntries.length){toast('Kayıt bulunamadı','error');return}
                  exportAllXLSX(kasalar,entries,rptStart,rptEnd)
                  toast('Tüm kasalar Excel\'e aktarılıyor ⬇️','success')
                }} className="w-full py-3 border-2 border-green-500 text-green-600 font-bold rounded-xl text-sm hover:bg-green-50 transition-colors">
                  ⬇ Tüm Kasalar Ayrı Ayrı (Her kasa ayrı sayfa)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modaller */}
      <KasaModal open={addKasaOpen} onClose={()=>setAddKasaOpen(false)}
        onAdd={async k=>{
          try {
            const created = await accountingApi.createRegister({name:k.name,color:k.color,note:k.note})
            setKasalar(p=>[...p,normalizeKasa(created)])
            toast('Kasa oluşturuldu ✅','success')
          } catch(e:any){ toast(e.message||'Kasa eklenemedi','error') }
        }}/>
      <IslemModal open={addIslemOpen} onClose={()=>setAddIslemOpen(false)} kasalar={kasalar}
        onAdd={async e=>{
          try {
            const created = await accountingApi.createEntry({
              cash_register_id: e.kasaId,
              to_cash_register_id: e.toKasaId,
              entry_type: e.type,
              category: e.category,
              amount: e.amount,
              description: e.description,
              donor_name: e.donor,
              entry_date: e.date,
              note: e.note,
            })
            setEntries(p=>[normalizeEntry(created),...p])
            toast('Kayıt eklendi ✅','success')
          } catch(err:any){ toast(err.message||'Kayıt eklenemedi','error') }
        }}/>
    </AdminLayout>
  )
}
