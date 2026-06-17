import { useState } from 'react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Button, useToast } from '@/components/ui'

type ReqType = 'ozellik' | 'hata' | 'destek' | 'diger'
interface Request {
  id: number; type: ReqType; title: string; description: string
  status: 'sent' | 'read' | 'in_progress' | 'resolved'
  created_at: string; reply?: string
}

const TYPE_CONFIG: Record<ReqType,{label:string;color:string;icon:string}> = {
  ozellik: {label:'Özellik İsteği', color:'bg-purple-100 text-purple-700', icon:'✨'},
  hata:    {label:'Hata Bildirimi', color:'bg-red-100 text-red-600',       icon:'🐛'},
  destek:  {label:'Destek Talebi',  color:'bg-blue-100 text-blue-700',     icon:'🆘'},
  diger:   {label:'Diğer',          color:'bg-gray-100 text-gray-600',     icon:'📝'},
}
const STATUS_CONFIG: Record<string,{label:string;color:string}> = {
  sent:        {label:'Gönderildi',    color:'bg-gray-100 text-gray-500'},
  read:        {label:'Okundu',        color:'bg-blue-100 text-blue-700'},
  in_progress: {label:'İşleniyor',     color:'bg-amber-100 text-amber-700'},
  resolved:    {label:'Çözüldü ✅',    color:'bg-green-100 text-green-700'},
}

const DEMO_REQUESTS: Request[] = [
  { id:1, type:'ozellik', title:'Öğrenci devam grafiği', description:'Her öğrenci için haftalık devam grafiği görmek istiyoruz.', status:'in_progress', created_at:'2026-06-10', reply:'Bu özellik üzerinde çalışıyoruz, önümüzdeki güncellemeyle gelecek.' },
  { id:2, type:'hata',    title:'Excel export Türkçe karakter', description:'Excel indirdiğimde Türkçe karakterler bozuk çıkıyor.', status:'resolved',    created_at:'2026-06-08', reply:'Düzeltildi. Lütfen yeni indirme deneyin.' },
  { id:3, type:'destek',  title:'Yeni öğretmen nasıl eklenir', description:'Öğretmen ekleme sayfasını bulamıyoruz.', status:'read', created_at:'2026-06-12' },
]

export default function RequestsPage() {
  const { toast } = useToast()
  const [requests, setRequests] = useState<Request[]>(DEMO_REQUESTS)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ type:'ozellik' as ReqType, title:'', description:'' })
  const [sending, setSending] = useState(false)

  const submit = async () => {
    if (!form.title.trim() || !form.description.trim()) { toast('Başlık ve açıklama zorunlu','error'); return }
    setSending(true)
    await new Promise(r=>setTimeout(r,600))
    setRequests(p=>[{id:Date.now(),type:form.type,title:form.title,description:form.description,status:'sent',created_at:new Date().toISOString().split('T')[0]},...p])
    toast('İsteğiniz iletildi ✅','success')
    setForm({type:'ozellik',title:'',description:''})
    setShowForm(false); setSending(false)
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">{requests.length} istek / talep</div>
          <Button onClick={()=>setShowForm(s=>!s)}>
            {showForm ? 'İptal' : '+ Yeni İstek / Talep'}
          </Button>
        </div>

        {/* Yeni istek formu */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-sm font-bold text-gray-900 mb-4">📝 Yeni İstek / Talep Gönder</div>
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Tür</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(TYPE_CONFIG) as [ReqType,typeof TYPE_CONFIG[ReqType]][]).map(([v,c])=>(
                  <button key={v} onClick={()=>setForm(p=>({...p,type:v}))}
                    className={`py-2 px-3 rounded-lg border-2 text-xs font-semibold text-left transition-all ${form.type===v?'border-green-500 bg-green-50 text-green-700':'border-gray-200 text-gray-600'}`}>
                    {c.icon} {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Başlık *</label>
              <input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="Kısa başlık..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"/>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Açıklama *</label>
              <textarea value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} rows={4}
                placeholder="Detaylı açıklayın..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500 resize-none"/>
            </div>
            <Button onClick={submit} loading={sending}>📤 Gönder</Button>
          </div>
        )}

        {/* İstek listesi */}
        {requests.length===0
          ? <div className="text-center py-12 bg-white rounded-xl shadow-sm text-gray-400"><div className="text-3xl mb-2">📭</div><p className="text-sm">Henüz istek yok</p></div>
          : requests.map(r=>{
              const tc = TYPE_CONFIG[r.type]
              const sc = STATUS_CONFIG[r.status]
              return (
                <div key={r.id} className="bg-white rounded-xl shadow-sm p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tc.color}`}>{tc.icon} {tc.label}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sc.color}`}>{sc.label}</span>
                        <span className="text-[10px] text-gray-400 ml-auto">{r.created_at}</span>
                      </div>
                      <div className="text-sm font-bold text-gray-900 mb-1">{r.title}</div>
                      <p className="text-xs text-gray-500 leading-relaxed">{r.description}</p>
                      {r.reply && (
                        <div className="mt-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                          <div className="text-[10px] font-bold text-green-600 uppercase mb-0.5">Mesyo Soft Yanıtı</div>
                          <p className="text-xs text-green-800">{r.reply}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
        }
      </div>
    </AdminLayout>
  )
}
