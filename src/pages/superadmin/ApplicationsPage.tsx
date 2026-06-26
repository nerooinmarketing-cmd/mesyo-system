import { useState, useEffect } from 'react'
import { SuperadminLayout } from '@/components/layout/SuperadminLayout'
import { Button, Modal, useToast, Alert } from '@/components/ui'
import { waLink } from '@/lib/utils'
import { applicationsApi, superadminApi } from '@/lib/api'

// Kurum adından otomatik slug üret — backend'deki generate_slug_from_name() ile aynı mantık,
// kullanıcıya anlık önizleme göstermek için burada da tekrarlanıyor (asıl üretim backend'de).
function autoSlug(name: string) {
  return name.toLowerCase()
    .replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s').replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c')
    .replace(/[^a-z0-9]/g,'').slice(0, 20)
}

export default function ApplicationsPage() {
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [apps, setApps] = useState<any[]>([])
  const [filter, setFilter] = useState<'all'|'pending'|'approved'|'rejected'>('all')
  const [detail, setDetail] = useState<any|null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectModal, setRejectModal] = useState<any|null>(null)
  const [approveModal, setApproveModal] = useState<any|null>(null)
  const [slugInput, setSlugInput] = useState('')
  const [slugError, setSlugError] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setLoadError('')
      try {
        const list = await applicationsApi.list()
        if (!cancelled) setApps(list)
      } catch (e: any) {
        if (!cancelled) setLoadError(e.message || 'Başvurular yüklenirken bir hata oluştu')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const pending = apps.filter(a=>a.status==='pending').length
  const filtered = apps.filter(a => filter==='all'||a.status===filter)

  const openApproveModal = (app: any) => {
    setSlugInput(autoSlug(app.name))
    setSlugError('')
    setApproveModal(app)
  }

  const validateSlug = (value: string) => {
    if (!value.trim()) return 'Slug boş olamaz'
    if (value.length < 3) return 'Slug en az 3 karakter olmalı'
    if (!/^[a-z0-9]+$/.test(value)) return 'Sadece küçük harf ve sayı kullanılabilir'
    return ''
  }

  const confirmApprove = async () => {
    if (!approveModal) return
    const err = validateSlug(slugInput)
    if (err) { setSlugError(err); return }

    setProcessing(true)
    try {
      const { temp_password } = await applicationsApi.approve(approveModal.id, slugInput)
      const msg = `Sayın ${approveModal.responsible_name} 👋\n\n${approveModal.name} için Mesyo Soft başvurunuz onaylandı! 🎉\n\n📱 Giriş bilgileriniz:\n🔗 Panel: ${slugInput}.mesyosoft.com.tr\n📞 Kullanıcı: ${approveModal.responsible_phone}\n🔑 Geçici Şifre: ${temp_password}\n\nİlk girişte şifrenizi değiştirmenizi öneriyoruz.\n\nHoş geldiniz! Mesyo Soft`
      setApps(p=>p.map(a=>a.id===approveModal.id?{...a,status:'approved',final_slug:slugInput}:a))
      window.open(waLink(approveModal.responsible_phone, msg), '_blank')
      setApproveModal(null)
      setDetail(null)
      toast(`${approveModal.name} onaylandı — ${slugInput}.mesyosoft.com.tr aktif, WA şifre gönderildi ✅`, 'success')
    } catch (e: any) {
      setSlugError(e.message || 'Onaylama başarısız oldu')
    } finally {
      setProcessing(false)
    }
  }

  const reject = async (app: any) => {
    setProcessing(true)
    try {
      await applicationsApi.reject(app.id, rejectReason || undefined)
      const msg = `Sayın ${app.responsible_name} 👋\n\n${app.name} için yaptığınız Mesyo Soft başvurusu değerlendirilmiş olup${rejectReason?` maalesef kabul edilememiştir.\n\nNeden: ${rejectReason}`:'maalesef kabul edilememiştir.'}\n\nAnlayışınız için teşekkür ederiz 🌿\nMesyo Soft`
      setApps(p=>p.map(a=>a.id===app.id?{...a,status:'rejected',rejection_reason:rejectReason}:a))
      window.open(waLink(app.responsible_phone, msg), '_blank')
      setRejectModal(null); setRejectReason('')
      toast('Başvuru reddedildi — WA bildirim gönderildi', 'info')
    } catch (e: any) {
      toast(e.message || 'Reddetme işlemi başarısız oldu', 'error')
    } finally {
      setProcessing(false)
    }
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

  if (loading) return (
    <SuperadminLayout>
      <div className="flex items-center justify-center py-24 text-gray-400">
        <div className="text-center">
          <div className="text-3xl mb-2 animate-pulse">⏳</div>
          <p className="text-sm">Yükleniyor...</p>
        </div>
      </div>
    </SuperadminLayout>
  )

  if (loadError) return (
    <SuperadminLayout>
      <Alert variant="warn">{loadError}</Alert>
      <button onClick={() => window.location.reload()}
        className="mt-3 px-4 py-2 bg-green-500 text-white text-sm font-bold rounded-lg">
        Tekrar Dene
      </button>
    </SuperadminLayout>
  )

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
                  {app.student_count_estimate && <div className="text-xs text-gray-400 mt-0.5">Tahmini: {app.student_count_estimate}</div>}
                  {app.status==='pending' && (
                    <div className="text-xs text-gray-400 mt-0.5 font-mono">Önerilen adres: {autoSlug(app.name)}.mesyosoft.com.tr</div>
                  )}
                  {app.note && <div className="text-xs text-gray-400 italic mt-0.5">"{app.note}"</div>}
                  <div className="text-[10px] text-gray-300 mt-1">{app.created_at?.split('T')[0]}</div>
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
                  <button onClick={async()=>{
                    if(!window.confirm(`"${app.name}" başvurusunu silmek istediğinize emin misiniz?`)) return
                    try {
                      await superadminApi.deleteApplication(app.id)
                      setApps(p => p.filter(x => x.id !== app.id))
                      toast('Başvuru silindi', 'success')
                    } catch(e:any) { toast('Silinemedi: ' + e.message, 'error') }
                  }}
                    className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-500 text-xs font-bold rounded-lg hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-colors">
                    🗑️
                  </button>
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
              ['Adres',detail.address || '—'],['Sorumlu',detail.responsible_name],
              ['Telefon',detail.responsible_phone],['E-posta',detail.email||'—'],
              ['Tahmini Öğrenci',detail.student_count_estimate||'—'],['Başvuru',detail.created_at?.split('T')[0]],
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
          footer={<><Button variant="outline" onClick={()=>setApproveModal(null)}>İptal</Button><Button onClick={confirmApprove} loading={processing}>✅ Onayla + WA Şifre Gönder</Button></>}>
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
                <p className="text-xs text-green-600 mt-1">✓ {slugInput}.mesyosoft.com.tr</p>
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
            <Button variant="danger" onClick={()=>reject(rejectModal)} loading={processing}>Reddet + WA Bildir</Button>
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
