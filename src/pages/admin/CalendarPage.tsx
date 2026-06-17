import { useState } from 'react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Button, Modal, Input, useToast } from '@/components/ui'

interface EventType {
  id: string
  label: string
  color: string
  border: string
  icon: string
  custom?: boolean
}

interface Event {
  id: number
  title: string
  date: string
  typeId: string
  note?: string
}

const DEFAULT_TYPES: EventType[] = [
  { id:'tatil',    label:'Tatil',      color:'bg-red-100 text-red-600',     border:'border-red-300',    icon:'🏖️' },
  { id:'etkinlik', label:'Etkinlik',   color:'bg-green-100 text-green-700', border:'border-green-300',  icon:'🎉' },
  { id:'sinav',    label:'Sınav',      color:'bg-amber-100 text-amber-700', border:'border-amber-300',  icon:'📝' },
  { id:'toplanti', label:'Toplantı',   color:'bg-blue-100 text-blue-700',   border:'border-blue-300',   icon:'👥' },
  { id:'dini',     label:'Dini Gün',   color:'bg-purple-100 text-purple-700',border:'border-purple-300', icon:'🌙' },
  { id:'kurs',     label:'Kurs',       color:'bg-teal-100 text-teal-700',   border:'border-teal-300',   icon:'📚' },
]

const DEMO_EVENTS: Event[] = [
  { id:1, title:'Kurban Bayramı Tatili', date:'2026-06-15', typeId:'tatil' },
  { id:2, title:'Veli Toplantısı', date:'2026-06-20', typeId:'toplanti', note:'Saat 14:00' },
  { id:3, title:'Dönem Sonu Sınavı', date:'2026-06-30', typeId:'sinav' },
  { id:4, title:'Yaz Kursu Başlangıcı', date:'2026-07-01', typeId:'kurs' },
  { id:5, title:'Mevlid Kandili', date:'2026-07-15', typeId:'dini' },
]

const COLOR_OPTIONS = [
  { color:'bg-red-100 text-red-600',     border:'border-red-300',    preview:'bg-red-400',    label:'Kırmızı' },
  { color:'bg-green-100 text-green-700', border:'border-green-300',  preview:'bg-green-500',  label:'Yeşil' },
  { color:'bg-blue-100 text-blue-700',   border:'border-blue-300',   preview:'bg-blue-500',   label:'Mavi' },
  { color:'bg-amber-100 text-amber-700', border:'border-amber-300',  preview:'bg-amber-500',  label:'Turuncu' },
  { color:'bg-purple-100 text-purple-700',border:'border-purple-300',preview:'bg-purple-500', label:'Mor' },
  { color:'bg-teal-100 text-teal-700',   border:'border-teal-300',   preview:'bg-teal-500',   label:'Turkuaz' },
  { color:'bg-pink-100 text-pink-700',   border:'border-pink-300',   preview:'bg-pink-500',   label:'Pembe' },
  { color:'bg-gray-100 text-gray-600',   border:'border-gray-300',   preview:'bg-gray-400',   label:'Gri' },
]

const ICON_OPTIONS = ['📅','🎉','📝','👥','🌙','📚','🏖️','⭐','🔔','🎯','🏆','💡','🌟','🎊','📢','🌿','✨','🕌']

export default function CalendarPage() {
  const { toast } = useToast()
  const [events, setEvents] = useState<Event[]>(DEMO_EVENTS)
  const [types, setTypes] = useState<EventType[]>(DEFAULT_TYPES)
  const [addModal, setAddModal] = useState(false)
  const [typeModal, setTypeModal] = useState(false)
  const [form, setForm] = useState({ title:'', date:'', typeId:'etkinlik', note:'' })
  const [newType, setNewType] = useState({ label:'', icon:'⭐', colorIdx:0 })
  const today = new Date().toISOString().split('T')[0]

  const upcoming = [...events].filter(e=>e.date>=today).sort((a,b)=>a.date.localeCompare(b.date))
  const past = [...events].filter(e=>e.date<today).sort((a,b)=>b.date.localeCompare(a.date))

  const getType = (typeId: string) => types.find(t=>t.id===typeId) || types[0]

  const addEvent = () => {
    if (!form.title||!form.date) { toast('Başlık ve tarih zorunlu','error'); return }
    setEvents(p=>[...p,{id:Date.now(),title:form.title,date:form.date,typeId:form.typeId,note:form.note||undefined}])
    toast('Etkinlik eklendi ✅','success'); setAddModal(false)
    setForm({title:'',date:'',typeId:'etkinlik',note:''})
  }

  const addType = () => {
    if (!newType.label.trim()) { toast('Tür adı girin','error'); return }
    const col = COLOR_OPTIONS[newType.colorIdx]
    const id = newType.label.toLowerCase().replace(/\s/g,'_').replace(/[^a-z0-9_]/g,'') + '_' + Date.now()
    setTypes(p=>[...p,{ id, label:newType.label, icon:newType.icon, color:col.color, border:col.border, custom:true }])
    toast(`"${newType.label}" türü eklendi ✅`,'success')
    setNewType({label:'',icon:'⭐',colorIdx:0})
  }

  const delType = (id: string) => {
    if (!confirm('Bu türü silmek istiyor musunuz?')) return
    setTypes(p=>p.filter(t=>t.id!==id))
    setEvents(p=>p.map(e=>e.typeId===id?{...e,typeId:'etkinlik'}:e))
    toast('Tür silindi','info')
  }

  const delEvent = (id: number) => { setEvents(p=>p.filter(e=>e.id!==id)) }

  const daysUntil = (date:string) => Math.ceil((new Date(date).getTime()-new Date(today).getTime())/86400000)

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div className="text-sm text-gray-400">{upcoming.length} yaklaşan etkinlik</div>
        <div className="flex gap-2">
          <button onClick={()=>setTypeModal(true)}
            className="px-3 py-2 border border-gray-200 bg-white text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors">
            🏷️ Türleri Yönet
          </button>
          <Button onClick={()=>setAddModal(true)}>+ Etkinlik Ekle</Button>
        </div>
      </div>

      {/* Tür etiketleri */}
      <div className="flex flex-wrap gap-2 mb-4">
        {types.map(t=>(
          <span key={t.id} className={`px-2.5 py-1 rounded-full text-xs font-semibold ${t.color}`}>
            {t.icon} {t.label}
          </span>
        ))}
      </div>

      <div className="space-y-4">
        {/* Yaklaşan */}
        <div>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">📅 Yaklaşan</div>
          {upcoming.length===0
            ? <div className="text-center py-8 bg-white rounded-xl shadow-sm text-gray-400 text-sm">Yaklaşan etkinlik yok</div>
            : upcoming.map(e=>{
                const t = getType(e.typeId)
                const days = daysUntil(e.date)
                return (
                  <div key={e.id} className={`bg-white rounded-xl shadow-sm p-4 mb-2 flex items-center gap-4 border-l-4 ${t.border}`}>
                    <div className="text-center flex-shrink-0 w-12">
                      <div className="text-lg font-extrabold text-gray-900">{new Date(e.date).getDate()}</div>
                      <div className="text-[10px] font-bold text-gray-400">
                        {['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'][new Date(e.date).getMonth()]}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-gray-900">{e.title}</div>
                      {e.note && <div className="text-xs text-gray-400 mt-0.5">{e.note}</div>}
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${t.color}`}>{t.icon} {t.label}</span>
                        <span className="text-xs text-gray-400">
                          {days===0?'🔴 Bugün!':days===1?'Yarın':`${days} gün sonra`}
                        </span>
                      </div>
                    </div>
                    <button onClick={()=>delEvent(e.id)} className="text-gray-300 hover:text-red-400 text-xl flex-shrink-0">×</button>
                  </div>
                )
              })
          }
        </div>

        {/* Geçmiş */}
        {past.length>0 && (
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">📆 Geçmiş</div>
            {past.slice(0,5).map(e=>{
              const t = getType(e.typeId)
              return (
                <div key={e.id} className="bg-white rounded-xl shadow-sm p-3 mb-2 flex items-center gap-3 opacity-60">
                  <div className="text-xs text-gray-400 w-20 flex-shrink-0">{e.date}</div>
                  <div className="text-sm text-gray-600 flex-1 truncate">{e.title}</div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${t.color} flex-shrink-0`}>{t.icon} {t.label}</span>
                  <button onClick={()=>delEvent(e.id)} className="text-gray-300 hover:text-red-400">×</button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Etkinlik Ekle Modal */}
      <Modal open={addModal} onClose={()=>setAddModal(false)} title="📅 Etkinlik Ekle"
        footer={<><Button variant="outline" onClick={()=>setAddModal(false)}>İptal</Button><Button onClick={addEvent}>Ekle</Button></>}>
        <Input label="Başlık *" value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="Etkinlik adı" />
        <Input label="Tarih *" type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} />
        <div className="mb-3">
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Tür</label>
          <div className="grid grid-cols-2 gap-1.5">
            {types.map(t=>(
              <button key={t.id} onClick={()=>setForm(p=>({...p,typeId:t.id}))}
                className={`py-2 px-3 rounded-lg border-[1.5px] text-xs font-semibold text-left transition-all ${form.typeId===t.id?'border-green-500 bg-green-50 text-green-700':'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Not (opsiyonel)</label>
          <textarea value={form.note} onChange={e=>setForm(p=>({...p,note:e.target.value}))} rows={2}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500 resize-none" />
        </div>
      </Modal>

      {/* Tür Yönetimi Modal */}
      <Modal open={typeModal} onClose={()=>setTypeModal(false)} title="🏷️ Etkinlik Türleri" wide>
        <div className="space-y-4">
          {/* Mevcut türler */}
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Mevcut Türler</div>
            <div className="space-y-2">
              {types.map(t=>(
                <div key={t.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                  <span className="text-xl">{t.icon}</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${t.color}`}>{t.label}</span>
                  {t.custom && (
                    <button onClick={()=>delType(t.id)} className="ml-auto text-gray-300 hover:text-red-400 text-lg">×</button>
                  )}
                  {!t.custom && <span className="ml-auto text-[10px] text-gray-400">Varsayılan</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Yeni tür ekle */}
          <div className="border-t border-gray-100 pt-4">
            <div className="text-xs font-semibold text-gray-500 uppercase mb-3">Yeni Tür Ekle</div>
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Tür Adı</label>
              <input value={newType.label} onChange={e=>setNewType(p=>({...p,label:e.target.value}))}
                placeholder="örn: Kamp, Spor, Namaz..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
            </div>
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase">İkon Seç</label>
              <div className="flex flex-wrap gap-1.5">
                {ICON_OPTIONS.map(icon=>(
                  <button key={icon} onClick={()=>setNewType(p=>({...p,icon}))}
                    className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all border-2 ${newType.icon===icon?'border-green-500 bg-green-50':'border-gray-200 hover:border-gray-300'}`}>
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase">Renk Seç</label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((c,i)=>(
                  <button key={i} onClick={()=>setNewType(p=>({...p,colorIdx:i}))}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${newType.colorIdx===i?'border-gray-700':'border-transparent'} ${c.color}`}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Önizleme */}
            {newType.label && (
              <div className="mb-3 flex items-center gap-2">
                <span className="text-xs text-gray-400">Önizleme:</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${COLOR_OPTIONS[newType.colorIdx]?.color}`}>
                  {newType.icon} {newType.label}
                </span>
              </div>
            )}
            <Button onClick={addType} className="w-full justify-center">+ Tür Ekle</Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  )
}
