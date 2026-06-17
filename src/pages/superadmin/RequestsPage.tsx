import { useState } from 'react'
import { SuperadminLayout } from '@/components/layout/SuperadminLayout'
import { Button, Modal, useToast } from '@/components/ui'
import { waLink } from '@/lib/utils'

type Status = 'sent'|'read'|'in_progress'|'resolved'

interface Request {
  id:number; institution:string; phone:string; type:string
  title:string; description:string; status:Status; created_at:string; reply?:string
}

const TYPE_COLORS: Record<string,string> = {
  ozellik:'bg-purple-100 text-purple-700', hata:'bg-red-100 text-red-600',
  destek:'bg-blue-100 text-blue-700', diger:'bg-gray-100 text-gray-600'
}
const TYPE_LABELS: Record<string,string> = {
  ozellik:'✨ Özellik İsteği', hata:'🐛 Hata', destek:'🆘 Destek', diger:'📝 Diğer'
}

const DEMO: Request[] = [
  {id:1, institution:'Karacihan Mescidi', phone:'05321111111', type:'ozellik', title:'Öğrenci devam grafiği',      description:'Her öğrenci için haftalık devam grafiği görmek istiyoruz.', status:'in_progress', created_at:'2026-06-10', reply:'Bu özellik üzerinde çalışıyoruz.'},
  {id:2, institution:'Fatih Camii',       phone:'05322222222', type:'hata',    title:'Excel Türkçe karakter bozuk', description:'Excel indirdiğimde Türkçe karakterler bozuk çıkıyor.',         status:'resolved',    created_at:'2026-06-08', reply:'Düzeltildi.'},
  {id:3, institution:'Selimiye Camii',    phone:'05326666666', type:'destek',  title:'Öğretmen nasıl eklenir',     description:'Öğretmen ekleme sayfasını bulamıyoruz.',                       status:'sent',        created_at:'2026-06-12'},
  {id:4, institution:'Havzan Camii',      phone:'05325555555', type:'ozellik', title:'SMS bildirimi',               description:'WhatsApp olmayan veliler için SMS istiyoruz.',                  status:'read',        created_at:'2026-06-15'},
]

export default function SuperadminRequestsPage() {
  const { toast } = useToast()
  const [requests, setRequests] = useState<Request[]>(DEMO)
  const [filter, setFilter] = useState<Status|'all'>('all')
  const [selected, setSelected] = useState<Request|null>(null)
  const [reply, setReply] = useState('')

  const pending = requests.filter(r=>r.status==='sent').length
  const filtered = requests.filter(r=>filter==='all'||r.status===filter)

  const updateStatus = (id:number, status:Status, replyText?:string) => {
    setRequests(p=>p.map(r=>r.id===id?{...r,status,reply:replyText||r.reply}:r))
  }

  const sendReply = () => {
    if (!selected || !reply.trim()) { toast('Yanıt yazın','error'); return }
    const msg = `Sayın Hocamız 👋\n\nMesyo Soft destek ekibinden "${selected.title}" talebinize yanıtımız:\n\n${reply}\n\nSaygılarımızla 🌿\nMesyo Soft`
    window.open(waLink(selected.phone, msg), '_blank')
    updateStatus(selected.id, 'resolved', reply)
    toast('Yanıt gönderildi ✅','success')
    setSelected(null); setReply('')
  }

  const STATUS_LABELS: Record<Status,{l:string;c:string}> = {
    sent:        {l:'⏳ Okunmadı',   c:'bg-amber-100 text-amber-700'},
    read:        {l:'👁 Okundu',     c:'bg-blue-100 text-blue-700'},
    in_progress: {l:'🔄 İşleniyor', c:'bg-purple-100 text-purple-700'},
    resolved:    {l:'✅ Çözüldü',   c:'bg-green-100 text-green-700'},
  }

  return (
    <SuperadminLayout>
      <div className="space-y-4">
        {/* Özet */}
        <div className="grid grid-cols-4 gap-3">
          {([['sent','⏳ Bekleyen','text-amber-500'],['read','👁 Okundu','text-blue-600'],['in_progress','🔄 İşleniyor','text-purple-600'],['resolved','✅ Çözüldü','text-green-600']] as const).map(([s,l,c])=>(
            <button key={s} onClick={()=>setFilter(f=>f===s?'all':s)}
              className={`bg-white rounded-xl shadow-sm p-3 text-center transition-all ${filter===s?'ring-2 ring-green-400':''}`}>
              <div className={`text-xl font-extrabold ${c}`}>{requests.filter(r=>r.status===s).length}</div>
              <div className="text-xs text-gray-400 mt-0.5">{l}</div>
            </button>
          ))}
        </div>

        {pending>0 && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 text-sm text-amber-800 font-semibold">
            ⏳ {pending} yeni okunmamış istek var!
          </div>
        )}

        {/* Filtre */}
        <div className="flex gap-2">
          {(['all','sent','read','in_progress','resolved'] as const).map(v=>(
            <button key={v} onClick={()=>setFilter(v)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${filter===v?'bg-green-500 text-white border-green-500':'border-gray-200 text-gray-500 bg-white'}`}>
              {v==='all'?'Tümü':STATUS_LABELS[v].l}
            </button>
          ))}
        </div>

        {/* Liste */}
        <div className="space-y-2">
          {filtered.map(r=>{
            const sc = STATUS_LABELS[r.status]
            return (
              <div key={r.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-2 mb-1">
                      <span className="text-xs font-bold text-gray-700">{r.institution}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[r.type]||'bg-gray-100 text-gray-600'}`}>{TYPE_LABELS[r.type]||r.type}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sc.c}`}>{sc.l}</span>
                      <span className="text-[10px] text-gray-400 ml-auto">{r.created_at}</span>
                    </div>
                    <div className="text-sm font-bold text-gray-900 mb-1">{r.title}</div>
                    <p className="text-xs text-gray-500">{r.description}</p>
                    {r.reply && <div className="mt-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-800"><strong>Yanıtım:</strong> {r.reply}</div>}
                  </div>
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    <button onClick={()=>{setSelected(r);setReply(r.reply||'');if(r.status==='sent')updateStatus(r.id,'read')}}
                      className="px-2.5 py-1.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50">
                      📝 Yanıtla
                    </button>
                    {r.status!=='resolved' && (
                      <button onClick={()=>updateStatus(r.id,'in_progress')}
                        className="px-2.5 py-1.5 border border-purple-200 text-purple-600 text-xs font-semibold rounded-lg hover:bg-purple-50">
                        🔄 İşleniyor
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          {filtered.length===0 && <div className="text-center py-10 bg-white rounded-xl shadow-sm text-gray-400 text-sm">İstek bulunamadı</div>}
        </div>
      </div>

      <Modal open={!!selected} onClose={()=>setSelected(null)} title={selected?`📝 ${selected.title}`:''} wide
        footer={<><Button variant="outline" onClick={()=>setSelected(null)}>Kapat</Button><Button onClick={sendReply}>📱 WA Gönder + Çözüldü İşaretle</Button></>}>
        {selected && (
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-xs font-bold text-gray-500 uppercase mb-1">{selected.institution}</div>
              <p className="text-sm text-gray-700">{selected.description}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Yanıtın (WhatsApp ile gönderilecek)</label>
              <textarea value={reply} onChange={e=>setReply(e.target.value)} rows={4}
                placeholder="Yanıtınızı yazın..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500 resize-none"/>
            </div>
          </div>
        )}
      </Modal>
    </SuperadminLayout>
  )
}
