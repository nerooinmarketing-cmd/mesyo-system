import { useState, useRef } from 'react'
import { SuperadminLayout } from '@/components/layout/SuperadminLayout'
import { Button, useToast } from '@/components/ui'
import { waLink } from '@/lib/utils'

type Target = 'all_admins' | 'all_teachers' | 'specific_institution' | 'specific_phone'

const INSTITUTIONS = [
  {id:'i1', name:'Karacihan Mescidi',   admin_phone:'05321111111', teachers:['05329999991']},
  {id:'i2', name:'Fatih Camii',         admin_phone:'05322222222', teachers:['05329999992']},
  {id:'i3', name:'Yenimahalle Mescidi', admin_phone:'05324444444', teachers:[]},
  {id:'i4', name:'Selimiye Camii',      admin_phone:'05326666666', teachers:['05329999993']},
  {id:'i5', name:'Havzan Camii',        admin_phone:'05325555555', teachers:[]},
]

interface SentMessage {
  id: number; target: string; text: string; hasImage: boolean; sentAt: string; count: number
}

export default function MessagesPage() {
  const { toast } = useToast()
  const [target, setTarget] = useState<Target>('all_admins')
  const [selInst, setSelInst] = useState<string[]>([])
  const [customPhone, setCustomPhone] = useState('')
  const [message, setMessage] = useState('')
  const [imageFile, setImageFile] = useState<File|null>(null)
  const [imagePreview, setImagePreview] = useState<string|null>(null)
  const [sending, setSending] = useState(false)
  const [sentCount, setSentCount] = useState(0)
  const [history, setHistory] = useState<SentMessage[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const TEMPLATES = [
    { label:'📢 Genel Duyuru', text:'Sayın Hocamız 👋\n\nMesyo Soft sisteminde bir güncelleme yapılmıştır.\n\nDetaylar için lütfen panelinizi kontrol edin.\n\nSaygılarımızla 🌿\nMesyo Soft Ekibi' },
    { label:'⏰ Ödeme Hatırlatma', text:'Sayın Hocamız 👋\n\nYıllık sistem kullanım bedeli yaklaşmaktadır. Panelinizde kalan gün bilgisini görebilirsiniz.\n\nSaygılarımızla 🌿\nMesyo Soft' },
    { label:'✅ Sistem Güncellemesi', text:'Sayın Hocamız 👋\n\nMesyo Soft sisteminiz güncellendi! Yeni özellikler:\n\n✨ Ön muhasebe modülü\n✨ Kubbeler Yarışıyor oyunu\n✨ Toplu duyuru\n\nİyi kullanımlar 🌿\nMesyo Soft' },
    { label:'🆘 Bakım Bildirimi', text:'Sayın Hocamız 👋\n\nMesyo Soft sistemi bugün saat 02:00-04:00 arasında bakım nedeniyle erişime kapalı olacaktır.\n\nAnlayışınız için teşekkürler 🌿\nMesyo Soft' },
  ]

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setImageFile(f)
    const reader = new FileReader()
    reader.onload = ev => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(f)
  }

  const getTargets = (): {name:string; phone:string}[] => {
    if (target==='all_admins') return INSTITUTIONS.map(i=>({name:i.name, phone:i.admin_phone}))
    if (target==='all_teachers') return INSTITUTIONS.flatMap(i=>i.teachers.map(t=>({name:i.name+' Öğretmeni', phone:t})))
    if (target==='specific_institution') return INSTITUTIONS.filter(i=>selInst.includes(i.id)).map(i=>({name:i.name, phone:i.admin_phone}))
    if (target==='specific_phone') return customPhone.split(',').map(p=>({name:'Kişi', phone:p.trim()})).filter(p=>p.phone)
    return []
  }

  const targets = getTargets()

  const send = async () => {
    if (!message.trim()) { toast('Mesaj yazın', 'error'); return }
    if (!targets.length) { toast('Hedef seçin', 'error'); return }
    setSending(true); setSentCount(0)

    targets.forEach((t, i) => {
      setTimeout(() => {
        const fullMsg = message
        // Görsel varsa önce görseli aç, sonra mesajı
        if (imageFile && imagePreview) {
          // WA web'e fotoğraf doğrudan gönderilemez, mesajda link veya kullanıcı manuel ekler
          window.open(waLink(t.phone, `[GÖRSEL EKLENDİ - Manuel yükleyin]\n\n${fullMsg}`), '_blank')
        } else {
          window.open(waLink(t.phone, fullMsg), '_blank')
        }
        setSentCount(i + 1)
      }, i * 800)
    })

    await new Promise(r => setTimeout(r, targets.length * 800 + 500))

    setHistory(p=>[{
      id: Date.now(), target: target==='all_admins'?'Tüm Yöneticiler':target==='all_teachers'?'Tüm Öğretmenler':target==='specific_institution'?'Seçili Kurumlar':'Özel Numara',
      text: message, hasImage: !!imageFile, sentAt: new Date().toLocaleTimeString('tr-TR'), count: targets.length
    }, ...p])

    setSending(false)
    toast(`📱 ${targets.length} kişiye mesaj gönderildi!`, 'success')
    setMessage(''); setImageFile(null); setImagePreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <SuperadminLayout>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sol: Mesaj oluştur */}
        <div className="space-y-3">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-sm font-bold text-gray-900 mb-4">📨 Mesaj Gönder</div>

            {/* Hedef */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase">Kime?</label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  ['all_admins','👤 Tüm Yöneticiler'],
                  ['all_teachers','👨‍🏫 Tüm Öğretmenler'],
                  ['specific_institution','🏛️ Belirli Kurum'],
                  ['specific_phone','📱 Özel Numara'],
                ] as [Target,string][]).map(([v,l])=>(
                  <button key={v} onClick={()=>setTarget(v)}
                    className={`py-2.5 px-3 rounded-xl border-2 text-xs font-bold text-left transition-all ${target===v?'border-green-500 bg-green-50 text-green-700':'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    {l}
                  </button>
                ))}
              </div>

              {target==='specific_institution' && (
                <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto">
                  {INSTITUTIONS.map(i=>(
                    <label key={i.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all ${selInst.includes(i.id)?'border-green-400 bg-green-50':'border-gray-200'}`}>
                      <input type="checkbox" checked={selInst.includes(i.id)}
                        onChange={()=>setSelInst(p=>p.includes(i.id)?p.filter(x=>x!==i.id):[...p,i.id])}
                        className="w-4 h-4 accent-green-500"/>
                      <span className="text-xs font-semibold text-gray-800">{i.name}</span>
                    </label>
                  ))}
                </div>
              )}

              {target==='specific_phone' && (
                <textarea value={customPhone} onChange={e=>setCustomPhone(e.target.value)}
                  rows={2} placeholder="05XX..., 05XX... (virgülle ayırın)"
                  className="w-full mt-2 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500 resize-none"/>
              )}
            </div>

            {/* Şablonlar */}
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase">Hazır Şablon</label>
              <div className="flex flex-wrap gap-1.5">
                {TEMPLATES.map(t=>(
                  <button key={t.label} onClick={()=>setMessage(t.text)}
                    className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-green-50 hover:border-green-300 transition-all">
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mesaj */}
            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Mesaj *</label>
              <textarea value={message} onChange={e=>setMessage(e.target.value)} rows={6}
                placeholder="WhatsApp mesajı..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500 resize-none"/>
              <div className="text-right text-[10px] text-gray-400 mt-0.5">{message.length} karakter</div>
            </div>

            {/* Görsel */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase">Görsel (opsiyonel)</label>
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="önizleme" className="w-full h-32 object-cover rounded-xl border"/>
                  <button onClick={()=>{setImageFile(null);setImagePreview(null);if(fileRef.current)fileRef.current.value=''}}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">×</button>
                </div>
              ) : (
                <label className="flex flex-col items-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-green-400 transition-colors">
                  <span className="text-2xl">🖼️</span>
                  <span className="text-xs text-gray-500">Görsel seç (JPG, PNG)</span>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden"/>
                </label>
              )}
              {imageFile && (
                <div className="text-xs text-amber-600 mt-1 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  ℹ️ WA Web API görsel göndermeyi doğrudan desteklemiyor. WhatsApp açıldıktan sonra görseli manuel ekleyin.
                </div>
              )}
            </div>

            {/* Özet + Gönder */}
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-3 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-green-700">
                  {target==='all_admins'?'Tüm Yöneticiler':target==='all_teachers'?'Tüm Öğretmenler':target==='specific_institution'?`${selInst.length} Kurum`:'Özel Numara'}
                </div>
                <div className="text-xs text-green-600">{targets.length} kişiye gidecek</div>
              </div>
              <div className="text-2xl font-extrabold text-green-600">{targets.length}</div>
            </div>

            <Button onClick={send} loading={sending} className="w-full justify-center">
              {sending ? `📱 ${sentCount}/${targets.length} Gönderiliyor...` : `📱 Gönder (${targets.length} kişi)`}
            </Button>
          </div>
        </div>

        {/* Sağ: Geçmiş */}
        <div>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 text-sm font-bold text-gray-900">📋 Gönderim Geçmişi</div>
            {history.length===0
              ? <div className="text-center py-10 text-gray-400 text-sm">Henüz mesaj gönderilmedi</div>
              : history.map(h=>(
                  <div key={h.id} className="px-5 py-3 border-b border-gray-50 last:border-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-bold text-gray-700">{h.target}</span>
                          <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">{h.count} kişi</span>
                          {h.hasImage && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">🖼️ Görsel</span>}
                        </div>
                        <div className="text-xs text-gray-500 line-clamp-2">{h.text}</div>
                        <div className="text-[10px] text-gray-300 mt-1">{h.sentAt}</div>
                      </div>
                    </div>
                  </div>
                ))
            }
          </div>
        </div>
      </div>
    </SuperadminLayout>
  )
}
