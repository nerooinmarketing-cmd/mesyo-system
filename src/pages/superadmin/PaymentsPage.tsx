import { useState } from 'react'
import { SuperadminLayout } from '@/components/layout/SuperadminLayout'
import { Button, Modal, useToast } from '@/components/ui'
import { waLink } from '@/lib/utils'

interface Payment {
  id: string; institution_name: string; responsible_phone: string
  due_date: string; amount: number; status: 'paid' | 'pending' | 'overdue'
  paid_at?: string; note?: string
}

const today = new Date()
function addDays(d: number) { const r=new Date(today);r.setDate(r.getDate()+d);return r.toISOString().split('T')[0] }
function subDays(d: number) { const r=new Date(today);r.setDate(r.getDate()-d);return r.toISOString().split('T')[0] }

const DEMO_PAYMENTS: Payment[] = [
  { id:'p1', institution_name:'Karacihan Mescidi',   responsible_phone:'05321111111', due_date:addDays(5),  amount:1000, status:'pending' },
  { id:'p2', institution_name:'Fatih Camii',         responsible_phone:'05322222222', due_date:addDays(2),  amount:1000, status:'pending' },
  { id:'p3', institution_name:'Yenimahalle Mescidi', responsible_phone:'05324444444', due_date:addDays(12), amount:1000, status:'pending' },
  { id:'p4', institution_name:'Selimiye Camii',      responsible_phone:'05326666666', due_date:addDays(45), amount:1000, status:'pending' },
  { id:'p5', institution_name:'Alaaddin Camii',      responsible_phone:'05327777777', due_date:subDays(5),  amount:1000, status:'overdue' },
  { id:'p6', institution_name:'Havzan Camii',        responsible_phone:'05325555555', due_date:subDays(2),  amount:1000, status:'pending', note:'Havale yaptıklarını söylediler' },
  { id:'p7', institution_name:'Beşyüzevler Camii',   responsible_phone:'05333456789', due_date:addDays(90), amount:1000, status:'paid', paid_at: subDays(10) },
  { id:'p8', institution_name:'Merkez Camii',        responsible_phone:'05323333333', due_date:subDays(60), amount:1000, status:'paid', paid_at: subDays(65) },
]

function daysUntil(date: string) {
  return Math.ceil((new Date(date).getTime() - today.getTime()) / 86400000)
}

export default function PaymentsPage() {
  const { toast } = useToast()
  const [payments, setPayments] = useState<Payment[]>(DEMO_PAYMENTS)
  const [filter, setFilter] = useState<'all'|'pending'|'overdue'|'paid'>('all')
  const [confirmModal, setConfirmModal] = useState<Payment|null>(null)

  const IBAN = 'TR12 3456 7890 1234 5678 9012 34'
  const AMOUNT = 1000

  const filtered = payments.filter(p => filter==='all'||p.status===filter)

  const confirmPayment = (p: Payment) => {
    const days = daysUntil(p.due_date)
    const newDue = new Date()
    newDue.setFullYear(newDue.getFullYear() + 1)
    const nextDate = newDue.toISOString().split('T')[0]
    setPayments(prev=>prev.map(x=>x.id===p.id?{...x,status:'paid',paid_at:new Date().toISOString().split('T')[0]}:x))
    const msg = `Sayın Hocamız 👋\n\n${p.institution_name} için ${AMOUNT.toLocaleString('tr-TR')} ₺ sistem bedelini aldık ✅\n\nPaneliniz ${nextDate} tarihine kadar uzatılmıştır.\n\nTeşekkürler 🌿\nMesyo Soft`
    window.open(waLink(p.responsible_phone, msg), '_blank')
    setConfirmModal(null)
    toast(`${p.institution_name} ödeme onaylandı ✅`, 'success')
  }

  const sendReminder = (p: Payment) => {
    const days = daysUntil(p.due_date)
    const msg = days >= 0
      ? `Sayın Hocamız 👋\n\n${p.institution_name} Mesyo Soft aboneliğinizin son ödeme tarihi yaklaşıyor.\n\n⏰ Son Tarih: ${p.due_date} (${days} gün kaldı)\n💰 Tutar: ${AMOUNT.toLocaleString('tr-TR')} ₺\n🏦 IBAN: ${IBAN}\n\nAçıklama: ${p.institution_name} ödeme\n\nÖdemenizi yaptıktan sonra lütfen dekont fotoğrafını bu numaraya gönderin. Teşekkürler 🌿\nMesyo Soft`
      : `Sayın Hocamız 👋\n\n${p.institution_name} Mesyo Soft aboneliğinizin ödeme tarihi geçmiştir.\n\n❗ Vade: ${p.due_date} (${Math.abs(days)} gün gecikme)\n💰 Tutar: ${AMOUNT.toLocaleString('tr-TR')} ₺\n🏦 IBAN: ${IBAN}\n\nÖdemenizi en kısa sürede yapmanızı rica ederiz.\nMesyo Soft`
    window.open(waLink(p.responsible_phone, msg), '_blank')
    toast('Hatırlatma gönderildi 📱', 'success')
  }

  const getStatusInfo = (p: Payment) => {
    if (p.status==='paid') return { label:'✅ Ödendi', cls:'bg-green-100 text-green-700' }
    const days = daysUntil(p.due_date)
    if (days < 0) return { label:`⚠️ ${Math.abs(days)} gün geçti`, cls:'bg-red-100 text-red-600' }
    if (days <= 10) return { label:`🔴 ${days} gün kaldı`, cls:'bg-red-50 text-red-500' }
    return { label:`${days} gün kaldı`, cls:'bg-gray-100 text-gray-500' }
  }

  const overdue = payments.filter(p=>p.status!=='paid'&&daysUntil(p.due_date)<0).length
  const critical = payments.filter(p=>p.status!=='paid'&&daysUntil(p.due_date)>=0&&daysUntil(p.due_date)<=10).length

  return (
    <SuperadminLayout>
      <div className="space-y-4">
        {/* Özet */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {l:'Toplam',   v:payments.length,          c:'text-gray-900',  cls:'border-gray-200'},
            {l:'Ödendi',   v:payments.filter(p=>p.status==='paid').length, c:'text-green-600', cls:'border-green-400'},
            {l:'Kritik (≤10 gün)', v:critical, c:'text-red-500', cls:'border-red-400'},
            {l:'Gecikmiş', v:overdue,          c:'text-red-600', cls:'border-red-600'},
          ].map(s=>(
            <div key={s.l} className={`bg-white rounded-xl shadow-sm p-4 text-center border-t-[3px] ${s.cls}`}>
              <div className={`text-2xl font-extrabold ${s.c}`}>{s.v}</div>
              <div className="text-xs text-gray-400 font-semibold mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
          🏦 IBAN: <strong>{IBAN}</strong> · Yıllık ücret: <strong>1.000 ₺</strong>
        </div>

        {/* Filtreler */}
        <div className="flex gap-2 flex-wrap">
          {(['all','pending','overdue','paid'] as const).map(v=>(
            <button key={v} onClick={()=>setFilter(v)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${filter===v?'bg-green-500 text-white border-green-500':'border-gray-200 text-gray-500 bg-white'}`}>
              {v==='all'?'Tümü':v==='pending'?'⏳ Bekleyen':v==='overdue'?'⚠️ Gecikmiş':'✅ Ödendi'}
            </button>
          ))}
        </div>

        {/* Liste */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex justify-between">
            <span className="text-sm font-bold text-gray-900">Abonelik Ödemeleri</span>
            <span className="text-xs text-gray-400">{filtered.length} kayıt</span>
          </div>
          {filtered.map(p=>{
            const si = getStatusInfo(p)
            const days = daysUntil(p.due_date)
            const isCritical = p.status!=='paid' && days <= 10
            return (
              <div key={p.id} className={`flex items-center gap-3 px-5 py-3.5 border-b border-gray-50 last:border-0 flex-wrap ${isCritical?'bg-red-50/30':''}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-gray-900">{p.institution_name}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${si.cls}`}>{si.label}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    Vade: <strong>{p.due_date}</strong> · {p.amount.toLocaleString('tr-TR')} ₺
                    {p.paid_at && <span className="ml-2 text-green-600">Ödendi: {p.paid_at}</span>}
                    {p.note && <span className="ml-2 italic">· "{p.note}"</span>}
                  </div>
                </div>
                <div className="flex gap-1.5 flex-shrink-0">
                  {p.status !== 'paid' && <>
                    <button onClick={()=>sendReminder(p)}
                      className="px-2.5 py-1.5 border border-amber-200 text-amber-600 text-xs font-semibold rounded-lg hover:bg-amber-50 transition-colors">
                      📱 Hatırlat
                    </button>
                    <button onClick={()=>setConfirmModal(p)}
                      className="px-2.5 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg transition-colors">
                      ✅ Ödeme Onayı
                    </button>
                  </>}
                  {p.status === 'paid' && (
                    <span className="px-2.5 py-1.5 bg-green-50 text-green-600 text-xs font-semibold rounded-lg">✅ Onaylandı</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <Modal open={!!confirmModal} onClose={()=>setConfirmModal(null)} title="✅ Ödeme Onayla"
        footer={<><Button variant="outline" onClick={()=>setConfirmModal(null)}>İptal</Button><Button onClick={()=>confirmModal&&confirmPayment(confirmModal)}>Onayla + WA Bildir</Button></>}>
        {confirmModal && (
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="text-sm font-bold text-green-800 mb-2">{confirmModal.institution_name}</div>
              <div className="text-xs text-green-700 space-y-1">
                <div>💰 Tutar: {confirmModal.amount.toLocaleString('tr-TR')} ₺</div>
                <div>📅 Vade: {confirmModal.due_date}</div>
                <div>📱 Telefon: {confirmModal.responsible_phone}</div>
              </div>
            </div>
            <p className="text-sm text-gray-600">Onayladığınızda:</p>
            <ul className="text-xs text-gray-500 space-y-1 list-disc list-inside">
              <li>Ödeme durumu "Ödendi" olarak işaretlenir</li>
              <li>Abonelik 1 yıl uzatılır</li>
              <li>Kuruma WhatsApp onay mesajı gönderilir</li>
            </ul>
          </div>
        )}
      </Modal>
    </SuperadminLayout>
  )
}
