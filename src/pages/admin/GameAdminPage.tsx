import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { useToast } from '@/components/ui'
import { gameApi } from '@/lib/api'
import { cn, waLink } from '@/lib/utils'

const DAYS = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz']
const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']
const OPTS = ['A','B','C','D'] as const

function getDaysInMonth(y: number, m: number) { return new Date(y, m+1, 0).getDate() }
function getFirstDay(y: number, m: number) { let d = new Date(y,m,1).getDay(); return d===0?6:d-1 }

const emptyQ = () => ({ question_text:'', option_a:'', option_b:'', option_c:'', option_d:'', correct_option:'A', time_seconds:30, player_type:'child' as 'child'|'parent' })

export default function GameAdminPage() {
  const { toast } = useToast()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [games, setGames] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'game'|'whatsapp'|null>(null)
  const [selGame, setSelGame] = useState<any|null>(null)
  const [selDay, setSelDay] = useState<number|null>(null)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [sentCount, setSentCount] = useState(0)
  const [participants, setParticipants] = useState<any[]>([])

  // Oyun form
  const [password, setPassword] = useState('')
  const [openTime, setOpenTime] = useState('20:00')
  const [closeTime, setCloseTime] = useState('23:00')
  const [questions, setQuestions] = useState([
    emptyQ(), emptyQ(), emptyQ(),
    {...emptyQ(), player_type:'parent' as const},
    {...emptyQ(), player_type:'parent' as const},
    {...emptyQ(), player_type:'parent' as const},
  ])

  useEffect(() => {
    let cancelled = false
    gameApi.calendar().then(d => { if (!cancelled) setGames(d||[]) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDay(year, month)

  const gameByDay = (day: number) => {
    const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    return games.find(g => g.game_date === ds)
  }

  const openModal = (day: number) => {
    setSelDay(day)
    const existing = gameByDay(day)
    setSelGame(existing || null)
    setPassword('')
    setOpenTime('20:00')
    setCloseTime('23:00')
    setQuestions([
      emptyQ(), emptyQ(), emptyQ(),
      {...emptyQ(), player_type:'parent' as const},
      {...emptyQ(), player_type:'parent' as const},
      {...emptyQ(), player_type:'parent' as const},
    ])
    setModal('game')
  }

  const setQ = (i: number, field: string, val: string | number) => {
    setQuestions(p => p.map((q, idx) => idx===i ? {...q, [field]: val} : q))
  }

  const saveGame = async () => {
    if (!password.trim()) { toast('Şifreyi girin', 'error'); return }
    const incomplete = questions.find(q => !q.question_text || !q.option_a || !q.option_b || !q.option_c || !q.option_d)
    if (incomplete) { toast('Tüm soruları doldurun', 'error'); return }
    setSaving(true)
    try {
      const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(selDay!).padStart(2,'0')}`
      if (selGame) { await gameApi.deleteDailyGame(selGame.id) }
      const created = await gameApi.createDailyGame({
        game_date: ds,
        password: password.trim().toUpperCase(),
        open_time: openTime,
        close_time: closeTime,
        questions,
      })
      setGames(p => [...p.filter(g => g.game_date !== ds), created])
      toast('Oyun kaydedildi ✅', 'success')
      setModal(null)
    } catch(e:any) {
      toast(e.message || 'Kayıt başarısız', 'error')
    } finally {
      setSaving(false)
    }
  }

  const deleteGame = async (game: any) => {
    if (!confirm('Bu günün oyununu silmek istiyor musunuz?')) return
    try {
      await gameApi.deleteDailyGame(game.id)
      setGames(p => p.filter(g => g.id !== game.id))
      toast('Silindi', 'info')
      setModal(null)
    } catch(e:any) { toast(e.message||'Silinemedi','error') }
  }

  const openWhatsApp = async (game: any) => {
    setSelGame(game)
    setSentCount(0)
    try {
      const data = await gameApi.participants(game.id)
      setParticipants(data.students || [])
      setModal('whatsapp')
    } catch(e:any) { toast(e.message||'Yüklenemedi','error') }
  }

  const sendAll = async () => {
    if (!participants.length) { toast('Veli bulunamadı','error'); return }
    setSending(true); setSentCount(0)
    const gameUrl = (tel: string) => `${window.location.origin}/oyun/${selGame?.id}?tel=${encodeURIComponent(tel)}`
    participants.forEach((s, i) => {
      setTimeout(() => {
        const msg = `Sayın ${s.parent_first_name} ${s.parent_last_name} 👋\n\n🎮 *Kubbeler Yarışıyor!*\n📅 ${selGame?.game_date} — ⏰ Saat ${selGame?.open_time?.slice(0,5)}\n\n👇 Katılmak için tıklayın:\n${gameUrl(s.parent_phone)}\n\nBaşarılar! 🌙`
        window.open(waLink(s.parent_phone, msg), '_blank')
        setSentCount(i+1)
      }, i*800)
    })
    await new Promise(r => setTimeout(r, participants.length*800+500))
    setSending(false)
    toast(`📱 ${participants.length} veliye gönderildi!`, 'success')
  }

  const prevMonth = () => { if (month===0){setMonth(11);setYear(y=>y-1)}else setMonth(m=>m-1) }
  const nextMonth = () => { if (month===11){setMonth(0);setYear(y=>y+1)}else setMonth(m=>m+1) }

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <button onClick={prevMonth} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center font-bold text-gray-600">‹</button>
            <div className="text-base font-extrabold text-gray-900">{MONTHS[month]} {year}</div>
            <button onClick={nextMonth} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center font-bold text-gray-600">›</button>
          </div>
          <div className="grid grid-cols-7 border-b border-gray-100">
            {DAYS.map(d => <div key={d} className="py-2 text-center text-[10px] font-bold text-gray-400 uppercase">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({length: firstDay}).map((_,i) => <div key={`e-${i}`} className="aspect-square p-1 border-b border-r border-gray-50"/>)}
            {Array.from({length: daysInMonth}).map((_,i) => {
              const day = i+1
              const game = gameByDay(day)
              const isToday = day===today.getDate() && month===today.getMonth() && year===today.getFullYear()
              return (
                <div key={day} className={cn('aspect-square p-1 border-b border-r border-gray-50', isToday&&'bg-green-50')}>
                  <div onClick={() => openModal(day)}
                    className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mx-auto mb-0.5 cursor-pointer hover:bg-green-100',
                      isToday?'bg-[#1B4332] text-white':'text-gray-700')}>
                    {day}
                  </div>
                  {game && (
                    <div className="space-y-0.5">
                      <div onClick={() => openModal(day)} className="text-[9px] bg-green-500 text-white rounded px-1 font-bold text-center cursor-pointer">
                        🎮 {game.open_time?.slice(0,5)}
                      </div>
                      <div onClick={() => openWhatsApp(game)} className="text-[9px] bg-[#25D366] text-white rounded px-1 font-bold text-center cursor-pointer hover:bg-[#128C7E]">
                        📱 Gönder
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="px-5 py-3 bg-gray-50 text-xs text-gray-400 flex gap-4">
            <span>🎮 = Güne tıkla / düzenle</span>
            <span>📱 = Velilere WhatsApp gönder</span>
          </div>
        </div>
      </div>

      {/* OYUN OLUŞTUR/DÜZENLE MODAL */}
      {modal === 'game' && selDay !== null && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={() => !saving && setModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl my-4" onClick={e => e.stopPropagation()}>
            <div className="text-lg font-bold text-gray-900 mb-1">🎮 Günlük Oyun Planla</div>
            <div className="text-xs text-gray-400 mb-4">
              {year}-{String(month+1).padStart(2,'0')}-{String(selDay).padStart(2,'0')}
            </div>

            {/* Şifre ve saat */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="col-span-3 md:col-span-1">
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Günlük Şifre *</label>
                <input value={password} onChange={e => setPassword(e.target.value.toUpperCase())}
                  placeholder="TEBESSÜM"
                  className="w-full px-3 py-2.5 border-2 border-amber-300 rounded-lg text-sm outline-none focus:border-amber-500 font-bold text-center tracking-widest uppercase" />
                <p className="text-[10px] text-gray-400 mt-1">Çocukların kulağına söylenecek şifre</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Başlangıç</label>
                <input type="time" value={openTime} onChange={e => setOpenTime(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Bitiş</label>
                <input type="time" value={closeTime} onChange={e => setCloseTime(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
              </div>
            </div>

            {/* Sorular */}
            <div className="space-y-4 mb-5">
              {questions.map((q, i) => (
                <div key={i} className={cn('p-4 rounded-xl border-2', q.player_type==='child'?'border-blue-200 bg-blue-50':'border-purple-200 bg-purple-50')}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={cn('text-xs font-bold px-2 py-1 rounded-full', q.player_type==='child'?'bg-blue-500 text-white':'bg-purple-500 text-white')}>
                      {q.player_type==='child'?`👦 Öğrenci Sorusu ${i+1}`:`👨 Veli Sorusu ${i-2}`}
                    </span>
                    <div className="ml-auto flex items-center gap-2">
                      <label className="text-xs text-gray-500">Süre:</label>
                      <input type="number" value={q.time_seconds} onChange={e => setQ(i,'time_seconds',parseInt(e.target.value)||30)}
                        min={10} max={600} className="w-16 px-2 py-1 border border-gray-200 rounded text-xs outline-none" />
                      <span className="text-xs text-gray-400">sn</span>
                    </div>
                  </div>
                  <textarea value={q.question_text} onChange={e => setQ(i,'question_text',e.target.value)}
                    placeholder="Soru metnini yazın..." rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500 resize-none mb-3 bg-white" />
                  <div className="grid grid-cols-2 gap-2">
                    {OPTS.map(opt => (
                      <div key={opt} className="flex items-center gap-2">
                        <button onClick={() => setQ(i,'correct_option',opt)}
                          className={cn('w-7 h-7 rounded-lg text-xs font-bold flex-shrink-0 transition-all',
                            q.correct_option===opt?'bg-green-500 text-white':'bg-white border border-gray-300 text-gray-500 hover:bg-green-50')}>
                          {opt}
                        </button>
                        <input value={q[`option_${opt.toLowerCase()}` as keyof typeof q] as string}
                          onChange={e => setQ(i,`option_${opt.toLowerCase()}`,e.target.value)}
                          placeholder={`${opt} şıkkı`}
                          className="flex-1 px-2 py-1.5 border border-gray-200 rounded text-xs outline-none focus:border-green-500 bg-white" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              {selGame && (
                <button onClick={() => deleteGame(selGame)} disabled={saving}
                  className="px-3 py-2.5 border border-red-200 text-red-400 font-semibold rounded-xl text-sm disabled:opacity-50 hover:bg-red-50">
                  🗑️
                </button>
              )}
              <button onClick={() => setModal(null)} disabled={saving}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl text-sm disabled:opacity-50">
                İptal
              </button>
              <button onClick={saveGame} disabled={saving}
                className="flex-1 py-3 bg-[#1B4332] hover:bg-green-800 text-white font-bold rounded-xl text-sm disabled:opacity-50">
                {saving ? '⏳ Kaydediliyor...' : '✅ Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOPLU WHATSAPP MODAL */}
      {modal === 'whatsapp' && selGame && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !sending && setModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-lg font-bold text-gray-900 mb-1">📱 Velilere Oyun Linki Gönder</div>
            <div className="text-xs text-gray-400 mb-4">{selGame.game_date} — ⏰ {selGame.open_time?.slice(0,5)}</div>

            <div className="bg-gray-50 rounded-xl p-3 mb-4 text-xs text-gray-600 font-mono whitespace-pre-wrap">
              {`🎮 Kubbeler Yarışıyor!\n📅 ${selGame.game_date} — Saat ${selGame.open_time?.slice(0,5)}\n👇 ${window.location.origin}/oyun/${selGame.id}\nBaşarılar! 🌙`}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-700 font-semibold">
              ⚠️ Şifreyi ({selGame.password}) çocuklara camide söylemeyi unutmayın!
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-5 flex items-center justify-between">
              <div className="text-xs font-bold text-green-700">Toplam Veli</div>
              <div className="text-2xl font-extrabold text-green-600">{participants.length}</div>
            </div>

            {sending && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4 text-sm font-semibold text-blue-700">
                📱 Gönderiliyor... {sentCount} / {participants.length}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setModal(null)} disabled={sending}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl text-sm disabled:opacity-50">
                İptal
              </button>
              <button onClick={sendAll} disabled={sending || !participants.length}
                className="flex-1 py-3 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold rounded-xl text-sm disabled:opacity-50">
                {sending ? 'Gönderiliyor...' : `📱 ${participants.length} Veliye Gönder`}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
