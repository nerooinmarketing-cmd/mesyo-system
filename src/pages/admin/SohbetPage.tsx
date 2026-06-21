import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { useToast } from '@/components/ui'
import { sohbetApi } from '@/lib/api'
import { cn, waLink } from '@/lib/utils'

const DAYS = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz']
const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']

function getDaysInMonth(y: number, m: number) { return new Date(y, m+1, 0).getDate() }
function getFirstDay(y: number, m: number) { let d = new Date(y,m,1).getDay(); return d===0?6:d-1 }

export default function SohbetPage() {
  const { toast } = useToast()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [sohbetler, setSohbetler] = useState<any[]>([])
  const [arsiv, setArsiv] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'takvim'|'arsiv'>('takvim')
  const [modal, setModal] = useState<'create'|'detail'|'whatsapp'|null>(null)
  const [selSohbet, setSelSohbet] = useState<any|null>(null)
  const [kayitlar, setKayitlar] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [sentCount, setSentCount] = useState(0)
  const [waTarget, setWaTarget] = useState<'arsiv'|'custom'>('arsiv')

  // Form
  const [form, setForm] = useState({ title: '', topic: '', location: '', event_date: '', event_time: '19:30' })

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [s, a] = await Promise.all([sohbetApi.list(), sohbetApi.arsiv()])
        if (!cancelled) { setSohbetler(s||[]); setArsiv(a||[]) }
      } catch (e: any) {
        toast(e.message||'Yüklenemedi', 'error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDay(year, month)

  const sohbetByDay = (day: number) => {
    const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    return sohbetler.filter(s => s.event_date === ds)
  }

  const openCreate = (day?: number) => {
    const ds = day ? `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}` : ''
    setForm({ title: '', topic: '', location: '', event_date: ds, event_time: '19:30' })
    setModal('create')
  }

  const saveSohbet = async () => {
    if (!form.title || !form.event_date || !form.event_time) { toast('Başlık, tarih ve saat zorunlu', 'error'); return }
    setSaving(true)
    try {
      const created = await sohbetApi.create(form)
      created.kayit_count = 0
      setSohbetler(p => [created, ...p])
      toast('Sohbet oluşturuldu ✅', 'success')
      setModal(null)
    } catch (e: any) {
      toast(e.message||'Kayıt başarısız', 'error')
    } finally {
      setSaving(false)
    }
  }

  const openDetail = async (s: any) => {
    setSelSohbet(s)
    setModal('detail')
    try {
      const k = await sohbetApi.kayitlar(s.id)
      setKayitlar(k||[])
    } catch { setKayitlar([]) }
  }

  const openWhatsApp = (s: any) => {
    setSelSohbet(s)
    setWaTarget('arsiv')
    setSentCount(0)
    setModal('whatsapp')
  }

  const sendWhatsApp = async () => {
    const targets = waTarget === 'arsiv' ? arsiv : []
    if (!targets.length) { toast('Gönderilecek kişi yok', 'error'); return }
    setSending(true); setSentCount(0)
    const link = `${window.location.origin}/sohbet/${selSohbet?.id}`
    const msg = `Sayın kardeşimiz 👋\n\n🕌 *${selSohbet?.title}*\n📅 ${selSohbet?.event_date} — ⏰ ${selSohbet?.event_time?.slice(0,5)}\n${selSohbet?.location ? `📍 ${selSohbet.location}\n` : ''}${selSohbet?.topic ? `📖 Konu: ${selSohbet.topic}\n` : ''}\n👇 Katılım için tıklayın:\n${link}\n\nSelamlar 🌙`
    targets.forEach((p: any, i: number) => {
      setTimeout(() => {
        window.open(waLink(p.phone, msg), '_blank')
        setSentCount(i+1)
      }, i*800)
    })
    await new Promise(r => setTimeout(r, targets.length*800+500))
    setSending(false)
    toast(`📱 ${targets.length} kişiye gönderildi!`, 'success')
  }

  const deleteSohbet = async (s: any) => {
    if (!confirm('Bu sohbeti silmek istiyor musunuz?')) return
    try {
      await sohbetApi.delete(s.id)
      setSohbetler(p => p.filter(x => x.id !== s.id))
      toast('Silindi', 'info')
      setModal(null)
    } catch (e: any) { toast(e.message||'Silinemedi', 'error') }
  }

  const prevMonth = () => { if (month===0){setMonth(11);setYear(y=>y-1)}else setMonth(m=>m-1) }
  const nextMonth = () => { if (month===11){setMonth(0);setYear(y=>y+1)}else setMonth(m=>m+1) }

  const katildi = kayitlar.filter(k => k.katiliyor)
  const katilmadi = kayitlar.filter(k => !k.katiliyor)

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Sekmeler */}
        <div className="flex gap-2 items-center">
          {[['takvim','📅 Sohbet Takvimi'],['arsiv','👥 Katılımcı Arşivi']].map(([t,l]) => (
            <button key={t} onClick={() => setTab(t as any)}
              className={cn('px-4 py-2 rounded-xl text-sm font-bold transition-all', tab===t?'bg-[#1B4332] text-white':'bg-white text-gray-600 hover:bg-gray-50 shadow-sm')}>
              {l} {t==='arsiv' && arsiv.length > 0 && <span className="ml-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">{arsiv.length}</span>}
            </button>
          ))}
          <button onClick={() => openCreate()} className="ml-auto px-4 py-2 bg-[#1B4332] text-white text-sm font-bold rounded-xl hover:bg-green-800">
            + Yeni Sohbet
          </button>
        </div>

        {/* TAKVİM */}
        {tab === 'takvim' && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <button onClick={prevMonth} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center font-bold">‹</button>
              <div className="text-base font-extrabold text-gray-900">{MONTHS[month]} {year}</div>
              <button onClick={nextMonth} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center font-bold">›</button>
            </div>
            <div className="grid grid-cols-7 border-b border-gray-100">
              {DAYS.map(d => <div key={d} className="py-2 text-center text-[10px] font-bold text-gray-400 uppercase">{d}</div>)}
            </div>
            <div className="grid grid-cols-7">
              {Array.from({length: firstDay}).map((_,i) => <div key={`e-${i}`} className="min-h-[80px] p-1 border-b border-r border-gray-50"/>)}
              {Array.from({length: daysInMonth}).map((_,i) => {
                const day = i+1
                const daySohbetler = sohbetByDay(day)
                const isToday = day===today.getDate() && month===today.getMonth() && year===today.getFullYear()
                return (
                  <div key={day} className={cn('min-h-[80px] p-1 border-b border-r border-gray-50', isToday&&'bg-green-50')}>
                    <div onClick={() => openCreate(day)}
                      className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mx-auto mb-1 cursor-pointer hover:bg-green-100',
                        isToday?'bg-[#1B4332] text-white':'text-gray-700')}>
                      {day}
                    </div>
                    <div className="space-y-0.5">
                      {daySohbetler.map(s => (
                        <div key={s.id} onClick={() => openDetail(s)}
                          className="text-[9px] bg-[#1B4332] text-white rounded px-1 py-0.5 font-bold cursor-pointer hover:bg-green-700 truncate">
                          🕌 {s.event_time?.slice(0,5)} {s.title.slice(0,12)}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Yaklaşan sohbetler listesi */}
            <div className="border-t border-gray-100">
              <div className="px-5 py-3 text-xs font-bold text-gray-500 uppercase">Yaklaşan Sohbetler</div>
              {sohbetler.filter(s => s.event_date >= today.toISOString().split('T')[0]).slice(0,5).map(s => (
                <div key={s.id} className="flex items-center gap-3 px-5 py-3 border-t border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => openDetail(s)}>
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-lg flex-shrink-0">🕌</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-gray-900 truncate">{s.title}</div>
                    <div className="text-xs text-gray-400">{s.event_date} — {s.event_time?.slice(0,5)} {s.location && `• ${s.location}`}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">{s.kayit_count} kayıt</span>
                    <button onClick={e => { e.stopPropagation(); openWhatsApp(s) }}
                      className="px-2.5 py-1.5 bg-[#25D366] text-white text-xs font-bold rounded-lg hover:bg-[#128C7E]">
                      📱
                    </button>
                  </div>
                </div>
              ))}
              {sohbetler.filter(s => s.event_date >= today.toISOString().split('T')[0]).length === 0 && (
                <div className="px-5 py-6 text-center text-gray-400 text-sm">Yaklaşan sohbet yok</div>
              )}
            </div>
          </div>
        )}

        {/* ARŞİV */}
        {tab === 'arsiv' && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="text-sm font-bold text-gray-900">Kümülatif Katılımcı Arşivi</div>
              <div className="text-xs text-gray-400">{arsiv.length} kişi</div>
            </div>
            {loading ? (
              <div className="text-center py-10 text-gray-400 text-sm">⏳ Yükleniyor...</div>
            ) : arsiv.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">
                <div className="text-3xl mb-2">👥</div>
                <p>Henüz arşiv yok. Sohbete katılan kişiler burada birikir.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Ad Soyad','Telefon','Meslek','Katılım Sayısı','Son Katılım'].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 text-xs font-bold text-gray-400 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {arsiv.map(a => (
                      <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-semibold text-gray-900">{a.first_name} {a.last_name}</td>
                        <td className="px-4 py-2.5 text-gray-500 font-mono text-xs">{a.phone}</td>
                        <td className="px-4 py-2.5 text-gray-500">{a.meslek||'—'}</td>
                        <td className="px-4 py-2.5">
                          <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold">{a.katilim_count} kez</span>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-gray-400">{a.last_seen_at?.split('T')[0]||'—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SOHBET OLUŞTUR MODAL */}
      {modal === 'create' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !saving && setModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-lg font-bold text-gray-900 mb-4">🕌 Yeni Sohbet Oluştur</div>
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Başlık *</label>
                <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))}
                  placeholder="örn: Cuma Sohbeti, Tefsir Dersi"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Konu</label>
                <input value={form.topic} onChange={e => setForm(f => ({...f, topic: e.target.value}))}
                  placeholder="örn: Sabır ve Şükür"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Konum</label>
                <input value={form.location} onChange={e => setForm(f => ({...f, location: e.target.value}))}
                  placeholder="örn: Karacihan Camii"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Tarih *</label>
                  <input type="date" value={form.event_date} onChange={e => setForm(f => ({...f, event_date: e.target.value}))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Saat *</label>
                  <input type="time" value={form.event_time} onChange={e => setForm(f => ({...f, event_time: e.target.value}))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} disabled={saving}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl text-sm disabled:opacity-50">İptal</button>
              <button onClick={saveSohbet} disabled={saving}
                className="flex-1 py-3 bg-[#1B4332] text-white font-bold rounded-xl text-sm disabled:opacity-50">
                {saving ? '⏳ Kaydediliyor...' : '✅ Oluştur'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SOHBET DETAY MODAL */}
      {modal === 'detail' && selSohbet && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-lg font-bold text-gray-900">{selSohbet.title}</div>
                <div className="text-xs text-gray-400 mt-0.5">{selSohbet.event_date} — {selSohbet.event_time?.slice(0,5)} {selSohbet.location && `• ${selSohbet.location}`}</div>
                {selSohbet.topic && <div className="text-xs text-green-700 font-semibold mt-1">📖 {selSohbet.topic}</div>}
              </div>
              <button onClick={() => deleteSohbet(selSohbet)} className="text-red-400 hover:text-red-600 text-xl">🗑️</button>
            </div>

            {/* Özetler */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                {l:'Toplam',v:kayitlar.length,c:'text-gray-900'},
                {l:'Katılıyor',v:katildi.length,c:'text-green-600'},
                {l:'Katılmıyor',v:katilmadi.length,c:'text-red-500'},
              ].map(s => (
                <div key={s.l} className="bg-gray-50 rounded-xl p-3 text-center">
                  <div className={`text-2xl font-extrabold ${s.c}`}>{s.v}</div>
                  <div className="text-xs text-gray-400 font-semibold">{s.l}</div>
                </div>
              ))}
            </div>

            {/* WhatsApp gönder */}
            <button onClick={() => { setModal(null); openWhatsApp(selSohbet) }}
              className="w-full py-3 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold rounded-xl text-sm mb-4">
              📱 WhatsApp ile Duyur
            </button>

            {/* Katılımcı listesi */}
            {kayitlar.length > 0 && (
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="px-4 py-2 bg-gray-50 text-xs font-bold text-gray-500 uppercase">Kayıtlar</div>
                {kayitlar.map(k => (
                  <div key={k.id} className="flex items-center gap-3 px-4 py-2.5 border-t border-gray-50">
                    <div className={cn('w-2 h-2 rounded-full flex-shrink-0', k.katiliyor?'bg-green-500':'bg-red-400')} />
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-gray-900">{k.first_name} {k.last_name}</span>
                      {k.meslek && <span className="text-xs text-gray-400 ml-2">{k.meslek}</span>}
                    </div>
                    <div className="text-xs text-gray-400 font-mono">{k.phone}</div>
                    <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', k.katiliyor?'bg-green-100 text-green-700':'bg-red-100 text-red-500')}>
                      {k.katiliyor?'Katılıyor':'Katılmıyor'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* WHATSAPP GÖNDER MODAL */}
      {modal === 'whatsapp' && selSohbet && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !sending && setModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-lg font-bold text-gray-900 mb-1">📱 WhatsApp ile Duyur</div>
            <div className="text-xs text-gray-400 mb-4">{selSohbet.title} — {selSohbet.event_date}</div>

            <div className="bg-gray-50 rounded-xl p-3 mb-4 text-xs text-gray-600 font-mono whitespace-pre-wrap">
              {`🕌 ${selSohbet.title}\n📅 ${selSohbet.event_date} — ⏰ ${selSohbet.event_time?.slice(0,5)}${selSohbet.location?`\n📍 ${selSohbet.location}`:''}${selSohbet.topic?`\n📖 ${selSohbet.topic}`:''}\n👇 ${window.location.origin}/sohbet/${selSohbet.id}`}
            </div>

            <div className="mb-4">
              <div className="text-xs font-bold text-gray-500 uppercase mb-2">Kime Gönderilsin?</div>
              <button onClick={() => setWaTarget('arsiv')}
                className={cn('w-full py-3 px-4 rounded-xl border-2 text-sm font-semibold text-left transition-all mb-2',
                  waTarget==='arsiv'?'border-green-500 bg-green-50 text-green-700':'border-gray-200 text-gray-600')}>
                👥 Tüm Arşiv ({arsiv.length} kişi)
                <div className="text-xs opacity-70 font-normal">Şimdiye kadar herhangi bir sohbete katılmış herkes</div>
              </button>
            </div>

            {sending && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4 text-sm font-semibold text-blue-700">
                📱 Gönderiliyor... {sentCount} / {arsiv.length}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setModal(null)} disabled={sending}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl text-sm disabled:opacity-50">İptal</button>
              <button onClick={sendWhatsApp} disabled={sending || arsiv.length === 0}
                className="flex-1 py-3 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold rounded-xl text-sm disabled:opacity-50">
                {sending ? 'Gönderiliyor...' : `📱 ${arsiv.length} Kişiye Gönder`}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
