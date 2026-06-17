import { useState } from 'react'
import { SuperadminLayout } from '@/components/layout/SuperadminLayout'
import { Button, Modal, useToast } from '@/components/ui'
import { waLink } from '@/lib/utils'

interface Application {
  id: string; name: string; city: string; district: string
  responsible_name: string; responsible_phone: string; email?: string
  student_estimate?: string; note?: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

const DEMO_APPS: Application[] = [
  { id:'a1', name:'Saraçoğlu Camii',   city:'Konya', district:'Karatay',  responsible_name:'Ömer Sarı',    responsible_phone:'05331234567', student_estimate:'31-60 öğrenci',   status:'pending',  created_at:'2026-06-15' },
  { id:'a2', name:'Dedeman Mescidi',   city:'Konya', district:'Meram',    responsible_name:'Veli Kılıç',   responsible_phone:'05332345678', student_estimate:'1-30 öğrenci',    status:'pending',  created_at:'2026-06-14' },
  { id:'a3', name:'Beşyüzevler Camii', city:'Konya', district:'Selçuklu', responsible_name:'Hakkı Acar',   responsible_phone:'05333456789', student_estimate:'61-100 öğrenci', status:'approved', created_at:'2026-06-10' },
  { id:'a4', name:'Yazır Camii',       city:'Konya', district:'Selçuklu', responsible_name:'Cemil Yılmaz', responsible_phone:'05334567890', note:'Çok geniş katılım bekliyoruz', status:'rejected', created_at:'2026-06-08' },
]

// Kurum adından otomatik slug üret — Türkçe karakterleri sadeleştirir
function autoSlug(name: string) {
  return name.toLowerCase()
    .replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s').replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c')
    .replace(/[^a-z0-9]/g,'').slice(0, 20)
}

// Şu an kullanılan slug'lar — gerçek sistemde institutions tablosundan çekilir.
// Çakışma kontrolü için burada tutuyoruz.
const EXISTING_SLUGS = ['karacihan', 'fatih', 'merkez', 'yenimahalle', 'havzan', 'selimiye', 'alaaddin', 'iplikci']

export default function ApplicationsPage() {
  const { toast } = useToast()
  const [apps, setApps] = useState<Application[]>(DEMO_APPS)
  const [filter, setFilter] = useState<'all'|'pending'|'approved'|'rejected'>('all')
  const [detail, setDetail] = useState<Application|null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectModal, setRejectModal] = useState<Application|null>(null)
  const [approveModal, setApproveModal] = useState<Application|null>(null)
  const [slugInput, setSlugInput] = useState('')
  const [slugError, setSlugError] = useState('')

  const pending = apps.filter(a=>a.status==='pending').length
  const filtered = apps.filter(a => filter==='all'||a.status===filter)

  const genTempPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    return Array.from({length:8},()=>chars[Math.floor(Math.random()*chars.length)]).join('')
  }

  // "Onayla" tıklanınca direkt göndermez — önce slug'ı göster/düzenlemeye izin ver
  const openApproveModal = (app: Application) => {
    setSlugInput(autoSlug(app.name))
    setSlugError('')
    setApproveModal(app)
  }

  const validateSlug = (value: string) => {
    if (!value.trim()) return 'Slug boş olamaz'
    if (value.length < 3) return 'Slug en az 3 karakter olmalı'
    if (!/^[a-z0-9]+$/.test(value)) return 'Sadece küçük harf ve sayı kullanılabilir'
    if (EXISTING_SLUGS.includes(value)) return 'Bu slug zaten kullanılıyor — başka bir tane girin'
    return ''
  }

  const confirmApprove = () => {
    if (!approveModal) return
    const err = validateSlug(slugInput)
    if (err) { setSlugError(err); return }

    const app = approveModal
    const tempPw = genTempPassword()
    const msg = `Sayın ${app.responsible_name} 👋\n\n${app.name} için Mesyo Soft başvurunuz onaylandı! 🎉\n\n📱 Giriş bilgileriniz:\n🔗 Panel: ${slugInput}.mesyosoft.com.tr\n📞 Kullanıcı: ${app.responsible_phone}\n🔑 Geçici Şifre: ${tempPw}\n\nİlk girişte şifrenizi değiştirmenizi öneriyoruz.\n\nHoş geldiniz! Mesyo Soft`
    setApps(p=>p.map(a=>a.id===app.id?{...a,status:'approved'}:a))
    window.open(waLink(app.responsible_phone, msg), '_blank')
    setApproveModal(null)
    setDetail(null)
    toast(`${app.name} onaylandı — ${slugInput}.mesyosoft.com.tr aktif, WA şifre gönderildi ✅`, 'success')
  }

  const reject = (app: Application) => {
    const msg = `Sayın ${app.responsible_name} 👋\n\n${app.name} için yaptığınız Mesyo Soft başvurusu değerlendirilmiş olup${rejectReason?` maalesef kabul edilememiştir.\n\nNeden: ${rejectReason}`:'maalesef kabul edilememiştir.'}\n\nAnlayışınız için teşekkür ederiz 🌿\nMesyo Soft`
    setApps(p=>p.map(a=>a.id===app.id?{...a,status:'rejected'}:a))
    window.open(waLink(app.responsible_phone, msg), '_blank')
    setRejectModal(null); setRejectReason('')
    toast('Başvuru reddedildi — WA bildirim gönderildi', 'info')
  }

  const StatusBadge = ({status}:{status:string}) => {
    const m: Record<string,[string,string]> = {
      pending:  ['bg-amber-100 text-amber-700','⏳ Bekliyor'],
      approved: ['bg-green-100 text-green-700','✅ Onaylandı'],
      rejected: ['bg-red-100 text-red-500','❌ Reddedildi'],
    }
    const [cls,label]=m[status]||['bg-gray-100 text-gray-500',status]
    return <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${cls}`}>{label}</span>
  }

  return (
    <SuperadminLayout>
      <div className="space-y-4">
        {/* Özet */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {l:'Bekleyen',   v:apps.filter(a=>a.status==='pending').length,  c:'text-amber-500', f:'pending'  as const},
            {l:'Onaylanan',  v:apps.filter(a=>a.status==='approved').length, c:'text-green-600', f:'approved' as const},
            {l:'Reddedilen', v:apps.filter(a=>a.status==='rejected').length, c:'text-red-500',   f:'rejected' as const},
          ].map(s=>(
            <button key={s.l} onClick={()=>setFilter(f=>f===s.f?'all':s.f)}
              className={`bg-white rounded-xl shadow-sm p-4 text-center border-b-4 transition-all ${filter===s.f?'border-green-400 ring-2 ring-green-100':'border-gray-100'}`}>
              <div className={`text-2xl font-extrabold ${s.c}`}>{s.v}</div>
              <div className="text-xs text-gray-400 font-semibold mt-0.5">{s.l}</div>
            </button>
          ))}
        </div>

        {pending>0 && filter!=='pending' && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 text-sm text-amber-800 font-semibold">
            ⏳ {pending} yeni kurum başvurusu onay bekliyor!
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          {(['all','pending','approved','rejected'] as const).map(v=>(
            <button key={v} onClick={()=>setFilter(v)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${filter===v?'bg-green-500 text-white border-green-500':'border-gray-200 text-gray-500 bg-white'}`}>
              {v==='all'?'Tümü':v==='pending'?'⏳ Bekleyen':v==='approved'?'✅ Onaylı':'❌ Reddedilen'}
            </button>
          ))}
        </div>

        {/* Liste */}
        <div className="space-y-2">
          {filtered.map(app=>(
            <div key={app.id} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-bold text-gray-900">{app.name}</span>
                    <StatusBadge status={app.status}/>
                  </div>
                  <div className="text-xs text-gray-500">{app.city} / {app.district} • {app.responsible_name} • {app.responsible_phone}</div>
                  {app.student_estimate && <div className="text-xs text-gray-400 mt-0.5">Tahmini: {app.student_estimate}</div>}
                  {app.status==='pending' && (
                    <div className="text-xs text-gray-400 mt-0.5 font-mono">Önerilen adres: {autoSlug(app.name)}.mesyosoft.com.tr</div>
                  )}
                  {app.note && <div className="text-xs text-gray-400 italic mt-0.5">"{app.note}"</div>}
                  <div className="text-[10px] text-gray-300 mt-1">{app.created_at}</div>
                </div>
                <div className="flex gap-2 flex-wrap flex-shrink-0">
                  <button onClick={()=>setDetail(app)}
                    className="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50">
                    Detay
                  </button>
                  {app.status==='pending' && <>
                    <button onClick={()=>openApproveModal(app)}
                      className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg transition-colors">
                      ✅ Onayla + WA
                    </button>
                    <button onClick={()=>setRejectModal(app)}
                      className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-500 text-xs font-bold rounded-lg hover:bg-red-100">
                      ❌ Reddet
                    </button>
                  </>}
                  {app.status==='approved' && (
                    <button onClick={()=>{
                      const tempPw=genTempPassword()
                      const msg=`Sayın ${app.responsible_name} 👋\n\nMesyo Soft şifreniz sıfırlandı.\n🔑 Yeni Geçici Şifre: ${tempPw}\n\nMesyo Soft`
                      window.open(waLink(app.responsible_phone,msg),'_blank')
                    }} className="px-3 py-1.5 border border-amber-200 text-amber-600 text-xs font-semibold rounded-lg hover:bg-amber-50">
                      🔑 Şifre Yolla
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filtered.length===0 && (
            <div className="text-center py-12 text-gray-400"><div className="text-3xl mb-2">📋</div><p className="text-sm">Başvuru bulunamadı</p></div>
          )}
        </div>
      </div>

      {/* Detay Modal */}
      {detail && (
        <Modal open={!!detail} onClose={()=>setDetail(null)} title={`📋 ${detail.name}`}
          footer={<>
            <Button variant="outline" onClick={()=>setDetail(null)}>Kapat</Button>
            {detail.status==='pending' && <Button onClick={()=>openApproveModal(detail)}>✅ Onayla + WA Gönder</Button>}
          </>}>
          <div className="space-y-2">
            {[
              ['Kurum Adı',detail.name],['Şehir/İlçe',`${detail.city} / ${detail.district}`],
              ['Adres',detail.responsible_phone],['Sorumlu',detail.responsible_name],
              ['Telefon',detail.responsible_phone],['E-posta',detail.email||'—'],
              ['Tahmini Öğrenci',detail.student_estimate||'—'],['Başvuru',detail.created_at],
            ].map(([l,v])=>(
              <div key={l} className="flex gap-3 text-sm py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-xs font-semibold text-gray-400 w-28 flex-shrink-0 pt-0.5">{l}</span>
                <span className="text-gray-700">{v}</span>
              </div>
            ))}
            {detail.note && <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 italic">"{detail.note}"</div>}
          </div>
        </Modal>
      )}

      {/* Onay Modal — Slug Düzenlenebilir */}
      {approveModal && (
        <Modal open={!!approveModal} onClose={()=>setApproveModal(null)} title={`✅ Onayla — ${approveModal.name}`}
          footer={<><Button variant="outline" onClick={()=>setApproveModal(null)}>İptal</Button><Button onClick={confirmApprove}>✅ Onayla + WA Şifre Gönder</Button></>}>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Kurum adından otomatik bir adres önerildi. İsterseniz değiştirebilirsiniz — kurum bu adresten panele erişecek.
            </p>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Panel Adresi (slug)</label>
              <div className="flex items-center gap-0 border-[1.5px] rounded-lg overflow-hidden focus-within:border-green-500"
                style={{borderColor: slugError ? '#f87171' : '#e5e7eb'}}>
                <input value={slugInput}
                  onChange={e=>{
                    const v = e.target.value.toLowerCase().replace(/[^a-z0-9]/g,'')
                    setSlugInput(v); setSlugError('')
                  }}
                  className="flex-1 px-3 py-2.5 text-sm font-mono outline-none"/>
                <span className="px-3 py-2.5 bg-gray-50 text-gray-400 text-sm font-mono border-l border-gray-200">.mesyosoft.com.tr</span>
              </div>
              {slugError && <p className="text-xs text-red-500 mt-1">{slugError}</p>}
              {!slugError && slugInput && (
                <p className="text-xs text-green-600 mt-1">✓ {slugInput}.mesyosoft.com.tr kullanılabilir</p>
              )}
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5 text-xs text-blue-700">
              Onayladığınızda <strong>{approveModal.responsible_phone}</strong> numarasına geçici şifre ve panel adresi WhatsApp ile gönderilecek.
            </div>
          </div>
        </Modal>
      )}

      {/* Ret Modal */}
      {rejectModal && (
        <Modal open={!!rejectModal} onClose={()=>setRejectModal(null)} title={`❌ Reddet — ${rejectModal.name}`}
          footer={<>
            <Button variant="outline" onClick={()=>setRejectModal(null)}>İptal</Button>
            <Button variant="danger" onClick={()=>reject(rejectModal)}>Reddet + WA Bildir</Button>
          </>}>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Ret Nedeni (opsiyonel)</label>
            <textarea value={rejectReason} onChange={e=>setRejectReason(e.target.value)} rows={3}
              placeholder="örn: Bölgenizdeki kota doldu..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500 resize-none"/>
          </div>
        </Modal>
      )}
    </SuperadminLayout>
  )
}
