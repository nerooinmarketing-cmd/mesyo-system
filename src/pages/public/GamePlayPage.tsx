import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { cn } from '@/lib/utils'

const OPTIONS = ['A','B','C','D'] as const
const OPTION_COLORS = { A:'bg-blue-500', B:'bg-purple-500', C:'bg-orange-500', D:'bg-red-500' }
const OPTION_LIGHT  = { A:'bg-blue-50 border-blue-300 text-blue-800', B:'bg-purple-50 border-purple-300 text-purple-800', C:'bg-orange-50 border-orange-300 text-orange-800', D:'bg-red-50 border-red-300 text-red-800' }

type Screen = 'loading'|'enter-phone'|'playing'|'result'|'leaderboard'|'not-found'|'already-played'|'closed'

export default function GamePlayPage() {
  const { gameId } = useParams<{ gameId: string }>()
  const [screen, setScreen] = useState<Screen>('loading')
  const [game, setGame] = useState<any>(null)
  const [question, setQuestion] = useState<any>(null)
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [timeLeft, setTimeLeft] = useState(30)
  const [chosen, setChosen] = useState<string|null>(null)
  const [result, setResult] = useState<any>(null)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const timerRef = useRef<any>(null)
  const startTimeRef = useRef<number>(0)

  // Oyunu yükle
  useEffect(() => {
    if (!gameId) return
    fetch(`/api/game/play/${gameId}`)
      .then(r => r.json())
      .then(data => {
        if (data.detail) { setScreen('not-found'); return }
        setGame(data)
        setQuestion(data.question)
        setTimeLeft(data.question?.time_seconds || 30)
        setScreen('enter-phone')
      })
      .catch(() => setScreen('not-found'))
  }, [gameId])

  // Geri sayım
  const startTimer = () => {
    startTimeRef.current = Date.now()
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          // Süre doldu — boş cevap gönder
          submitAnswer('TIMEOUT')
          return 0
        }
        return t - 1
      })
    }, 1000)
  }

  const submitAnswer = async (opt: string) => {
    if (chosen) return // Zaten cevaplandı
    clearInterval(timerRef.current)
    const timeUsed = Math.round((Date.now() - startTimeRef.current) / 1000)
    setChosen(opt)

    try {
      const res = await fetch(`/api/game/play/${gameId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participant_phone: phone, participant_name: name || undefined, chosen_option: opt === 'TIMEOUT' ? 'X' : opt, time_used: timeUsed })
      }).then(r => r.json())

      setResult(res)
      setTimeout(() => setScreen('result'), 1000)
    } catch {
      setScreen('result')
    }
  }

  const loadLeaderboard = async () => {
    const data = await fetch(`/api/game/play/${gameId}/leaderboard`).then(r => r.json())
    setLeaderboard(data)
    setScreen('leaderboard')
  }

  const startGame = () => {
    if (!phone.trim() || phone.trim().length < 10) { alert('Geçerli bir telefon numarası girin'); return }
    setScreen('playing')
    setTimeLeft(question?.time_seconds || 30)
    startTimer()
  }

  const timerPct = (timeLeft / (question?.time_seconds || 30)) * 100

  if (screen === 'loading') return (
    <div className="min-h-screen bg-[#1B4332] flex items-center justify-center">
      <div className="text-white text-center">
        <div className="text-5xl mb-4 animate-bounce">🎮</div>
        <div className="text-lg font-bold">Yükleniyor...</div>
      </div>
    </div>
  )

  if (screen === 'not-found') return (
    <div className="min-h-screen bg-[#1B4332] flex items-center justify-center p-4">
      <div className="text-white text-center">
        <div className="text-5xl mb-4">😔</div>
        <div className="text-xl font-bold">Oyun Bulunamadı</div>
        <div className="text-sm opacity-70 mt-2">Bu link geçerli değil veya süresi dolmuş</div>
      </div>
    </div>
  )

  if (screen === 'enter-phone') return (
    <div className="min-h-screen bg-gradient-to-b from-[#1B4332] to-[#2D6A4F] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🕌</div>
          <h1 className="text-2xl font-extrabold text-white">Kubbeler Yarışıyor</h1>
          <p className="text-white/60 text-sm mt-1">{game?.game_date}</p>
          <div className="mt-3 inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5">
            <span className="text-white/80 text-sm">⏰ Saat {game?.open_time} — {game?.close_time}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-2xl">
          <div className="text-base font-bold text-gray-900 mb-4 text-center">Yarışmaya Katıl!</div>

          <div className="mb-3">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Telefon Numaranız *</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="05XX XXX XX XX"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-center text-lg font-mono outline-none focus:border-green-500" />
            <p className="text-[10px] text-gray-400 mt-1 text-center">Kaydınızdaki veli telefon numarasını girin</p>
          </div>

          <div className="mb-5">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Adınız (opsiyonel)</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Ad Soyad"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-green-500" />
          </div>

          <button onClick={startGame}
            className="w-full py-4 bg-[#1B4332] hover:bg-green-800 text-white font-extrabold text-lg rounded-2xl transition-colors shadow-lg">
            🚀 Yarışmaya Başla!
          </button>
        </div>
      </div>
    </div>
  )

  if (screen === 'playing') return (
    <div className="min-h-screen bg-gradient-to-b from-[#1B4332] to-[#2D6A4F] flex flex-col p-4">
      {/* Timer */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-white/60 text-sm">Kubbeler Yarışıyor 🕌</div>
        <div className={cn('w-14 h-14 rounded-full border-4 flex items-center justify-center font-extrabold text-xl transition-colors',
          timeLeft > 10 ? 'border-green-400 text-white' : 'border-red-400 text-red-300 animate-pulse')}>
          {timeLeft}
        </div>
      </div>

      {/* Timer bar */}
      <div className="h-2 bg-white/20 rounded-full mb-6 overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-1000', timeLeft > 10 ? 'bg-green-400' : 'bg-red-400')}
          style={{ width: `${timerPct}%` }} />
      </div>

      {/* Soru */}
      <div className="bg-white/10 backdrop-blur rounded-2xl p-5 mb-6 flex-shrink-0">
        <div className="text-white font-bold text-lg leading-relaxed text-center">{question?.question_text}</div>
        {question?.hint && <div className="text-white/50 text-xs text-center mt-2">💡 {question.hint}</div>}
      </div>

      {/* Şıklar */}
      <div className="grid grid-cols-2 gap-3">
        {OPTIONS.map(opt => {
          const text = question?.[`option_${opt.toLowerCase()}`] || ''
          const isChosen = chosen === opt
          return (
            <button key={opt}
              onClick={() => !chosen && submitAnswer(opt)}
              disabled={!!chosen}
              className={cn('py-4 px-4 rounded-2xl font-bold text-white text-sm transition-all shadow-lg',
                isChosen ? `${OPTION_COLORS[opt]} scale-95 shadow-none` :
                chosen ? 'opacity-40 cursor-not-allowed ' + OPTION_COLORS[opt] :
                `${OPTION_COLORS[opt]} hover:scale-105 active:scale-95`)}>
              <div className="text-2xl font-extrabold mb-1">{opt}</div>
              <div className="text-xs leading-tight">{text}</div>
            </button>
          )
        })}
      </div>
    </div>
  )

  if (screen === 'result') return (
    <div className="min-h-screen bg-gradient-to-b from-[#1B4332] to-[#2D6A4F] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <div className="text-8xl mb-4">
          {result?.is_correct ? '🎉' : chosen === 'TIMEOUT' ? '⏰' : '😔'}
        </div>
        <h2 className="text-2xl font-extrabold text-white mb-2">
          {result?.is_correct ? 'Doğru Cevap!' : chosen === 'TIMEOUT' ? 'Süre Doldu!' : 'Yanlış Cevap!'}
        </h2>

        {result && !result.is_correct && result.correct_option && (
          <div className="bg-white/10 rounded-2xl p-4 mb-4">
            <div className="text-white/70 text-sm mb-1">Doğru cevap</div>
            <div className="text-white font-bold text-xl">{result.correct_option})</div>
          </div>
        )}

        {result?.is_correct && (
          <div className="bg-white/10 rounded-2xl p-4 mb-4">
            <div className="text-white/70 text-sm">Puanınız</div>
            <div className="text-4xl font-extrabold text-yellow-300">{result.score}</div>
          </div>
        )}

        <button onClick={loadLeaderboard}
          className="w-full py-4 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-extrabold text-base rounded-2xl transition-colors shadow-lg mt-2">
          🏆 Puan Durumunu Gör
        </button>
      </div>
    </div>
  )

  if (screen === 'leaderboard') return (
    <div className="min-h-screen bg-gradient-to-b from-[#1B4332] to-[#2D6A4F] p-4 pb-8">
      <div className="max-w-sm mx-auto">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🏆</div>
          <h2 className="text-2xl font-extrabold text-white">Puan Durumu</h2>
          <p className="text-white/60 text-sm">{game?.game_date}</p>
        </div>

        <div className="space-y-2">
          {leaderboard.length === 0 ? (
            <div className="bg-white/10 rounded-2xl p-6 text-center text-white/60">
              Henüz katılımcı yok
            </div>
          ) : leaderboard.map((entry, i) => {
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`
            const isMe = entry.name === (name || phone)
            return (
              <div key={i} className={cn('flex items-center gap-3 px-4 py-3 rounded-xl',
                isMe ? 'bg-yellow-400/20 border-2 border-yellow-400' : 'bg-white/10')}>
                <div className="text-2xl w-8 text-center">{medal}</div>
                <div className="flex-1">
                  <div className={cn('font-bold text-sm', isMe ? 'text-yellow-300' : 'text-white')}>
                    {entry.name} {isMe && '(Sen)'}
                  </div>
                </div>
                <div className={cn('font-extrabold text-lg', isMe ? 'text-yellow-300' : 'text-white')}>
                  {entry.score}
                </div>
              </div>
            )
          })}
        </div>

        <button onClick={loadLeaderboard}
          className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl mt-4 transition-colors text-sm">
          🔄 Yenile
        </button>
      </div>
    </div>
  )

  return null
}
