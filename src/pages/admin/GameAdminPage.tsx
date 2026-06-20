import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { useToast } from '@/components/ui'
import { gameApi } from '@/lib/api'
import { cn, waLink } from '@/lib/utils'

const DAYS = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz']
const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']
const OPTIONS = ['A','B','C','D']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfMonth(year: number, month: number) {
  let d = new Date(year, month, 1).getDay()
  return d === 0 ? 6 : d - 1 // Pazartesi=0
}

export default function GameAdminPage() {
  const { toast } = useToast()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [games, setGames] = useState<any[]>([])
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selDay, setSelDay] = useState<number | null>(null)
  const [tab, setTab] = useState<'takvim'|'sorular'>('takvim')

  // Modal state
  const [modal, setModal] = useState<'game'|'question'|'result'|null>(null)
  const [selGame, setSelGame] = useState<any|null>(null)
  const [saving, setSaving] = useState(false)

  // Oyun form
  const [gForm, setGForm] = useState({ question_id: '', open_time: '20:00', close_time: '23:00' })

  // Soru form
  const [qForm, setQForm] = useState({
    question_text: '', option_a: '', option_b: '', option_c: '', option_d: '',
    correct_option: 'A', time_seconds: 30, hint: '', explanation: ''
  })

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [cal, qs] = await Promise.all([gameApi.calendar(), gameApi.questions()])
        if (!cancelled) { setGames(cal); setQuestions(qs) }
      } catch (e: any) {
        toast(e.message || 'Veriler yüklenemedi', 'error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const gameByDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return games.find(g => g.game_date === dateStr)
  }

  const openGameModal = (day: number) => {
    setSelDay(day)
    const existing = gameByDay(day)
    if (existing) {
      setSelGame(existing)
      setGForm({ question_id: existing.question_ids?.[0] || '', open_time: existing.open_time || '20:00', close_time: existing.close_time || '23:00' })
    } else {
      setSelGame(null)
      setGForm({ question_id: questions[0]?.id || '', open_time: '20:00', close_time: '23:00' })
    }
    setModal('game')
  }

  const saveGame = async () => {
    if (!gForm.question_id) { toast('Soru seçin', 'error'); return }
    setSaving(true)
    try {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(selDay!).padStart(2, '0')}`
      const created = await gameApi.createDailyGame({ game_date: dateStr, question_id: gForm.question_id, open_time: gForm.open_time, close_time: gForm.close_time })
      setGames(p => {
        const filtered = p.filter(g => g.game_date !== dateStr)
        return [...filtered, created]
      })
      toast('Oyun kaydedildi ✅', 'success')
      setModal(null)
    } catch (e: any) {
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
    } catch (e: any) {
      toast(e.message || 'Silinemedi', 'error')
    }
  }

  const saveQuestion = async () => {
    if (!qForm.question_text || !qForm.option_a || !qForm.option_b || !qForm.option_c || !qForm.option_d) {
      toast('Tüm alanları doldurun', 'error'); return
    }
    setSaving(true)
    try {
      const created = await gameApi.createQuestion(qForm)
      setQuestions(p => [created, ...p])
      toast('Soru eklendi ✅', 'success')
      setQForm({ question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'A', time_seconds: 30, hint: '', explanation: '' })
      setModal(null)
    } catch (e: any) {
      toast(e.message || 'Eklenemedi', 'error')
    } finally {
      setSaving(false)
    }
  }

  const deleteQuestion = async (id: string) => {
    if (!confirm('Bu soruyu silmek istiyor musunuz?')) return
    try {
      await gameApi.deleteQuestion(id)
      setQuestions(p => p.filter(q => q.id !== id))
      toast('Soru silindi', 'info')
    } catch (e: any) {
      toast(e.message || 'Silinemedi', 'error')
    }
  }

  const getWhatsAppMsg = (game: any) => {
    const q = questions.find(q => q.id === game?.question_ids?.[0])
    const gameUrl = `${window.location.origin}/oyun/${game?.id}`
    return `🎮 *Kubbeler Yarışıyor!*\n\n📅 ${game?.game_date} tarihli yarışma başlıyor!\n⏰ Saat ${game?.open_time}'de başlayacak\n\n👇 Katılmak için linke tıklayın:\n${gameUrl}\n\n❓ Soru: ${q?.question_text || '...'}\n⏱️ Süre: ${q?.time_seconds || 30} saniye\n\nBaşarılar! 🌙`
  }

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Sekmeler */}
        <div className="flex gap-2">
          {[['takvim','📅 Yarışma Takvimi'],['sorular','❓ Soru Bankası']].map(([t,l]) => (
            <button key={t} onClick={() => setTab(t as any)}
              className={cn('px-4 py-2 rounded-xl text-sm font-bold transition-all', tab === t ? 'bg-[#1B4332] text-white' : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm')}>
              {l}
            </button>
          ))}
        </div>

        {/* TAKVİM */}
        {tab === 'takvim' && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Ay navigasyonu */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <button onClick={prevMonth} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-600 font-bold">‹</button>
              <div className="text-base font-extrabold text-gray-900">{MONTHS[month]} {year}</div>
              <button onClick={nextMonth} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-600 font-bold">›</button>
            </div>

            {/* Gün başlıkları */}
            <div className="grid grid-cols-7 border-b border-gray-100">
              {DAYS.map(d => (
                <div key={d} className="py-2 text-center text-[10px] font-bold text-gray-400 uppercase">{d}</div>
              ))}
            </div>

            {/* Günler */}
            <div className="grid grid-cols-7">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square p-1 border-b border-r border-gray-50" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const game = gameByDay(day)
                const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
                const isPast = new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate())

                return (
                  <div key={day}
                    onClick={() => openGameModal(day)}
                    className={cn('aspect-square p-1 border-b border-r border-gray-50 cursor-pointer transition-all hover:bg-green-50 relative',
                      isToday && 'bg-green-50',
                      isPast && 'opacity-60')}>
                    <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mx-auto mb-0.5',
                      isToday ? 'bg-[#1B4332] text-white' : 'text-gray-700')}>
                      {day}
                    </div>
                    {game && (
                      <div className="text-center">
                        <div className="text-[9px] bg-green-500 text-white rounded px-1 font-bold truncate">🎮 {game.open_time}</div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="px-5 py-3 bg-gray-50 text-xs text-gray-400 flex items-center gap-4">
              <span>🎮 = Oyun planlandı</span>
              <span>Güne tıklayarak oyun ekle/düzenle</span>
            </div>
          </div>
        )}

        {/* SORU BANKASI */}
        {tab === 'sorular' && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <button onClick={() => setModal('question')}
                className="px-4 py-2 bg-[#1B4332] text-white text-sm font-bold rounded-xl hover:bg-green-800 transition-colors">
                + Yeni Soru Ekle
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-3xl mb-2 animate-pulse">⏳</div>
                <p className="text-sm">Yükleniyor...</p>
              </div>
            ) : questions.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm text-center py-12 text-gray-400">
                <div className="text-4xl mb-2">❓</div>
                <p className="text-sm font-semibold">Henüz soru eklenmemiş</p>
                <p className="text-xs mt-1">Yarışma için soru ekleyerek başlayın</p>
              </div>
            ) : questions.map(q => (
              <div key={q.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-900 mb-2">❓ {q.question_text}</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {OPTIONS.map(opt => (
                        <div key={opt} className={cn('text-xs px-2 py-1.5 rounded-lg',
                          q.correct_option === opt ? 'bg-green-100 text-green-700 font-bold' : 'bg-gray-50 text-gray-600')}>
                          {opt}) {q[`option_${opt.toLowerCase()}`]}
                          {q.correct_option === opt && ' ✓'}
                        </div>
                      ))}
                    </div>
                    <div className="text-[10px] text-gray-400 mt-2">⏱️ {q.time_seconds} sn</div>
                  </div>
                  <button onClick={() => deleteQuestion(q.id)}
                    className="px-2.5 py-1.5 border border-red-200 text-red-400 text-xs font-semibold rounded-lg hover:bg-red-50 flex-shrink-0">
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* OYUN EKLE/DÜZENLE MODAL */}
      {modal === 'game' && selDay !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !saving && setModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-lg font-bold text-gray-900 mb-1">
              {selGame ? '✏️ Oyunu Düzenle' : '🎮 Oyun Planla'}
            </div>
            <div className="text-xs text-gray-400 mb-4">
              {year}-{String(month + 1).padStart(2, '0')}-{String(selDay).padStart(2, '0')}
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Soru Seç *</label>
                {questions.length === 0 ? (
                  <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    ⚠️ Önce Soru Bankası'na soru ekleyin
                  </div>
                ) : (
                  <select value={gForm.question_id} onChange={e => setGForm(f => ({ ...f, question_id: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500">
                    <option value="">Soru seçin...</option>
                    {questions.map(q => (
                      <option key={q.id} value={q.id}>{q.question_text.slice(0, 60)}{q.question_text.length > 60 ? '...' : ''}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Başlangıç Saati</label>
                  <input type="time" value={gForm.open_time} onChange={e => setGForm(f => ({ ...f, open_time: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Bitiş Saati</label>
                  <input type="time" value={gForm.close_time} onChange={e => setGForm(f => ({ ...f, close_time: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
                </div>
              </div>
            </div>

            {selGame && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="text-xs font-bold text-blue-700 mb-2">📱 WhatsApp Mesajı Gönder</div>
                <a href={waLink('', getWhatsAppMsg(selGame))} target="_blank" rel="noreferrer"
                  onClick={e => {
                    e.preventDefault()
                    const msg = getWhatsAppMsg(selGame)
                    try {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(msg)
                      } else {
                        const ta = document.createElement('textarea')
                        ta.value = msg
                        document.body.appendChild(ta)
                        ta.select()
                        document.execCommand('copy')
                        document.body.removeChild(ta)
                      }
                      toast('Mesaj kopyalandı! WhatsApp\'tan yapıştırın 📋', 'success')
                    } catch { toast('Kopyalanamadı, manuel kopyalayın', 'error') }
                  }}
                  className="block w-full py-2 bg-[#25D366] hover:bg-[#128C7E] text-white text-xs font-bold rounded-lg text-center transition-colors">
                  📋 Mesajı Kopyala
                </a>
                <div className="text-[10px] text-blue-500 mt-1">Kopyaladıktan sonra WhatsApp grubuna yapıştırın</div>
              </div>
            )}

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
              <button onClick={saveGame} disabled={saving || !gForm.question_id}
                className="flex-1 py-2.5 bg-[#1B4332] hover:bg-green-800 text-white font-bold rounded-xl text-sm disabled:opacity-50 transition-colors">
                {saving ? '⏳ Kaydediliyor...' : '✅ Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SORU EKLE MODAL */}
      {modal === 'question' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !saving && setModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="text-lg font-bold text-gray-900 mb-4">❓ Yeni Soru Ekle</div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Soru *</label>
                <textarea value={qForm.question_text} onChange={e => setQForm(f => ({ ...f, question_text: e.target.value }))}
                  rows={3} placeholder="Soru metnini yazın..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500 resize-none" />
              </div>
              {OPTIONS.map(opt => (
                <div key={opt} className="flex items-center gap-2">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0',
                    qForm.correct_option === opt ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600')}>
                    {opt}
                  </div>
                  <input value={qForm[`option_${opt.toLowerCase()}` as keyof typeof qForm] as string}
                    onChange={e => setQForm(f => ({ ...f, [`option_${opt.toLowerCase()}`]: e.target.value }))}
                    placeholder={`${opt} şıkkı`}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
                  <button onClick={() => setQForm(f => ({ ...f, correct_option: opt }))}
                    className={cn('px-3 py-2 rounded-lg text-xs font-bold transition-all',
                      qForm.correct_option === opt ? 'bg-green-500 text-white' : 'border border-gray-200 text-gray-500 hover:bg-green-50')}>
                    Doğru
                  </button>
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Süre (saniye)</label>
                <input type="number" value={qForm.time_seconds} onChange={e => setQForm(f => ({ ...f, time_seconds: parseInt(e.target.value) || 30 }))}
                  min={10} max={600}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">İpucu (opsiyonel)</label>
                <input value={qForm.hint} onChange={e => setQForm(f => ({ ...f, hint: e.target.value }))}
                  placeholder="İpucu metni..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setModal(null)} disabled={saving}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl text-sm disabled:opacity-50">İptal</button>
              <button onClick={saveQuestion} disabled={saving}
                className="flex-1 py-2.5 bg-[#1B4332] text-white font-bold rounded-xl text-sm disabled:opacity-50 transition-colors">
                {saving ? '⏳ Kaydediliyor...' : '✅ Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
