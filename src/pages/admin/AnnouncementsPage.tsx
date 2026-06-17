import { useState } from 'react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Button, Modal, Alert, useToast, Badge } from '@/components/ui'
import { DEMO_STUDENTS, DEMO_CLASSROOMS } from '@/lib/demo-data'
import { waLink } from '@/lib/utils'

type Target = 'all' | 'class' | 'gender' | 'custom'

interface Announcement {
  id: number; title: string; message: string
  target: string; sentCount: number; date: string
}

const TEMPLATES = [
  { label:'📅 Ders İptal', text:'Sayın velimiz 👋\n\nBilginize: {tarih} tarihinde ders yapılmayacaktır.\n\nAnlayışınız için teşekkür ederiz 🌿\nMesyo Eğitim' },
  { label:'🎉 Etkinlik', text:'Sayın velimiz 👋\n\nSizi bir etkinliğimize davet etmek istiyoruz:\n\n{etkinlik_detay}\n\nSevgi ve saygılarımızla 🌿\nMesyo Eğitim' },
  { label:'📋 Veli Toplantısı', text:'Sayın velimiz 👋\n\nVeli toplantımız {tarih} tarihinde saat {saat}\'de yapılacaktır.\n\nKatılımınızı bekliyoruz 🌿\nMesyo Eğitim' },
  { label:'🌙 Bayram Kutlaması', text:'Sayın velimiz 👋\n\nBayramınızı tebrik eder, ailenizle birlikte sağlıklı ve huzurlu günler dileriz 🌙✨\n\nMesyo Eğitim' },
  { label:'📚 Yeni Dönem', text:'Sayın velimiz 👋\n\nYeni eğitim dönemimiz {tarih} tarihinde başlayacaktır. Çocuğunuzla birlikte görmeyi sabırsızlıkla bekliyoruz 💚\n\nMesyo Eğitim' },
]

export default function AnnouncementsPage() {
  const { toast } = useToast()
  const [target, setTarget] = useState<Target>('all')
  const [selClass, setSelClass] = useState('')
  const [selGender, setSelGender] = useState<'erkek'|'kiz'|''>('')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [preview, setPreview] = useState(false)
  const [sending, setSending] = useState(false)
  const [sentCount, setSentCount] = useState(0)
  const [past, setPast] = useState<Announcement[]>([
    { id:1, title:'Ders İptali', message:'17-18 Haziran tarihlerinde ders yapılmayacaktır.', target:'Tüm Veliler', sentCount:9, date:'2026-06-15' },
    { id:2, title:'Bayram Tebriği', message:'Bayramınızı tebrik eder...', target:'Tüm Veliler', sentCount:9, date:'2026-06-10' },
  ])

  // Hedef velileri hesapla
  const getTargets = () => {
    let students = DEMO_STUDENTS
    if (target === 'class' && selClass) students = students.filter(s => s.classroom_id === selClass)
    if (target === 'gender' && selGender) students = students.filter(s => s.gender === selGender)
    return students
  }

  const targets = getTargets()
  const targetLabel = target==='all'?'Tüm Veliler':target==='class'?`${DEMO_CLASSROOMS.find(c=>c.id===selClass)?.name||'Sınıf'} Velileri`:target==='gender'?`${selGender==='erkek'?'Erkek':'Kız'} Öğrenci Velileri`:'Özel Liste'

  const send = async () => {
    if (!title || !message) { toast('Başlık ve mesaj zorunlu','error'); return }
    if (!targets.length) { toast('Hedef veli bulunamadı','error'); return }
    setSending(true); setSentCount(0)
    targets.forEach((s, i) => {
      setTimeout(() => {
        window.open(waLink(s.parent_phone, `Sayın ${(s.parent_first_name + ' ' + s.parent_last_name)} 👋\n\n*${title}*\n\n${message}`), '_blank')
        setSentCount(i + 1)
      }, i * 800)
    })
    await new Promise(r => setTimeout(r, targets.length * 800 + 500))
    setPast(p => [{ id: Date.now(), title, message, target: targetLabel, sentCount: targets.length, date: new Date().toLocaleDateString('tr-TR') }, ...p])
    setSending(false); setPreview(false)
    toast(`📱 ${targets.length} veliye duyuru gönderildi!`, 'success')
    setTitle(''); setMessage('')
  }

  return (
    <AdminLayout>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Yeni duyuru */}
        <div className="space-y-3">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-sm font-bold text-gray-900 mb-4">📢 Yeni Duyuru Gönder</div>

            {/* Şablonlar */}
            <div className="mb-4">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Hazır Şablon Seç</div>
              <div className="flex flex-wrap gap-1.5">
                {TEMPLATES.map(t => (
                  <button key={t.label} onClick={() => setMessage(t.text)}
                    className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-green-50 hover:border-green-300 transition-all">
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Başlık</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="örn: Ders İptal Duyurusu"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Mesaj</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5}
                placeholder="Velilere gönderilecek mesaj..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500 resize-none" />
            </div>

            {/* Hedef */}
            <div className="mb-4">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Kimler Alacak?</div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                {[['all','👥 Tüm Veliler'],['class','🏫 Belirli Sınıf'],['gender','⚧ Cinsiyet Bazlı']] .map(([v,l]) => (
                  <button key={v} onClick={() => setTarget(v as Target)}
                    className={`py-2 px-3 rounded-lg border-2 text-xs font-semibold text-left transition-all ${target===v?'border-green-500 bg-green-50 text-green-700':'border-gray-200 text-gray-600'}`}>
                    {l}
                  </button>
                ))}
              </div>
              {target==='class' && (
                <select value={selClass} onChange={e=>setSelClass(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500 mt-1">
                  <option value="">Sınıf seçin</option>
                  {DEMO_CLASSROOMS.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
              {target==='gender' && (
                <select value={selGender} onChange={e=>setSelGender(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500 mt-1">
                  <option value="">Cinsiyet seçin</option>
                  <option value="erkek">👦 Erkek</option>
                  <option value="kiz">👧 Kız</option>
                </select>
              )}
            </div>

            {/* Özet */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-green-700">Hedef: {targetLabel}</div>
                <div className="text-xs text-green-600 mt-0.5">{targets.length} veliye gönderilecek</div>
              </div>
              <div className="text-2xl font-extrabold text-green-600">{targets.length}</div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setPreview(true)} className="flex-1 justify-center">👁 Önizle</Button>
              <Button onClick={send} loading={sending} className="flex-1 justify-center">
                {sending ? `📱 ${sentCount}/${targets.length} Gönderiliyor...` : '📱 Gönder'}
              </Button>
            </div>
          </div>
        </div>

        {/* Geçmiş */}
        <div>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 text-sm font-bold text-gray-900">📋 Geçmiş Duyurular</div>
            {past.length===0
              ? <div className="text-center py-10 text-gray-400 text-sm">Henüz duyuru gönderilmedi</div>
              : past.map(a=>(
                  <div key={a.id} className="px-4 py-3 border-b border-gray-50 last:border-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-gray-900">{a.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{a.message}</div>
                        <div className="flex gap-2 mt-1">
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">{a.target}</span>
                          <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">{a.sentCount} kişi</span>
                          <span className="text-[10px] text-gray-400">{a.date}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
            }
          </div>
        </div>
      </div>

      {/* Önizleme modal */}
      <Modal open={preview} onClose={() => setPreview(false)} title="👁 Mesaj Önizleme"
        footer={<><Button variant="outline" onClick={() => setPreview(false)}>Kapat</Button><Button onClick={send} loading={sending}>📱 Gönder ({targets.length} kişi)</Button></>}>
        <div className="bg-[#E8FDD8] rounded-2xl p-4 mb-3">
          <div className="text-xs font-semibold text-gray-500 mb-1">WhatsApp'ta görünüm:</div>
          <div className="text-sm text-gray-800 whitespace-pre-line">
            {`Sayın [Veli Adı] 👋\n\n*${title}*\n\n${message}`}
          </div>
        </div>
        <div className="text-xs text-gray-400 text-center">Bu mesaj {targets.length} veliye sırayla gönderilecek</div>
      </Modal>
    </AdminLayout>
  )
}
