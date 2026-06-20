import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { cn } from '@/lib/utils'

const OPTS = ['A','B','C','D'] as const
const OPT_COLORS = { A:'bg-blue-500', B:'bg-purple-500', C:'bg-orange-500', D:'bg-red-500' }

type Screen = 'loading'|'phone'|'password'|'child-intro'|'child-play'|'handover'|'parent-intro'|'parent-play'|'result'|'leaderboard'|'error'

export default function GamePlayPage() {
  const { gameId } = useParams<{ gameId: string }>()
  const [screen, setScreen] = useState<Screen>('loading')
  const [game, setGame] = useState<any>(null)
  const [childQs, setChildQs] = useState<any[]>([])
  const [parentQs, setParentQs] = useState<any[]>([])

  // Kullanıcı bilgileri
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [studentName, setStudentName] = useState('')
  const [parentName, setParentName] = useState('')

  // Oyun state
  const [qIndex, setQIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [chosen, setChosen] = useState<string|null>(null)
  const [showResult, setShowResult] = useState(false)
  const [childAnswers, setChildAnswers] = useState<any[]>([])
  const [parentAnswers, setParentAnswers] = useState<any[]>([])
  const startTimeRef = useRef<number>(0)
  const timerRef = useRef<any>(null)

  // Sonuç
  const [finalResult, setFinalResult] = useState<any>(null)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!gameId) return
    fetch(`/api/game/play/${gameId}`)
      .then(r => r.json())
      .then(d => {
        if (d.detail) { setScreen('error'); return }
        setGame(d)
        setChildQs(d.child_questions || [])
        setParentQs(d.parent_questions || [])
        setScreen('phone')
      })
      .catch(() => setScreen('error'))
  }, [gameId])

  const startTimer = (seconds: number) => {
    clearInterval(timerRef.current)
    setTimeLeft(seconds)
    startTimeRef.current = Date.now()
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          handleTimeout()
          return 0
        }
        return t - 1
      })
    }, 1000)
  }

  const handleTimeout = () => {
    if (chosen) return
    setChosen('__timeout__')
    setShowResult(true)
    setTimeout(() => nextQuestion(), 1500)
  }

  const handleChoose = (opt: string) => {
    if (chosen) return
    clearInterval(timerRef.current)
    setChosen(opt)
    setShowResult(true)
    setTimeout(() => nextQuestion(), 1500)
  }

  const nextQuestion = () => {
    const isChild = screen === 'child-play'
    const qs = isChild ? childQs : parentQs
    const ans = {
      question_index: qIndex,
      chosen: chosen === '__timeout__' ? '' : (chosen || ''),
      time_used: Math.round((Date.now() - startTimeRef.current) / 1000)
    }

    if (isChild) {
      const newAns = [...childAnswers, ans]
      setChildAnswers(newAns)
      if (qIndex + 1 < qs.length) {
        setQIndex(i => i+1)
        setChosen(null)
        setShowResult(false)
        const nextQ = qs[qIndex+1]
        startTimer(nextQ?.time_seconds || 30)
      } else {
        setScreen('handover')
      }
    } else {
      const newAns = [...parentAnswers, ans]
      setParentAnswers(newAns)
      if (qIndex + 1 < qs.length) {
        setQIndex(i => i+1)
        setChosen(null)
        setShowResult(false)
        const nextQ = qs[qIndex+1]
        startTimer(nextQ?.time_seconds || 30)
      } else {
        submitAnswers([...childAnswers], newAns)
      }
    }
  }

  const verifyPassword = async () => {
    if (!password.trim()) return
    const res = await fetch(`/api/game/play/${gameId}/verify-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: password.trim(), phone })
    }).then(r => r.json())

    if (!res.correct) {
      alert('Şifre yanlış! Hocandan öğren.')
      setPassword('')
      return
    }
    setStudentName(res.student_name || phone)
    setParentName(res.parent_name || 'Veli')
    setScreen('child-intro')
  }

  const startChildPlay = () => {
    setQIndex(0)
    setChosen(null)
    setShowResult(false)
    setChildAnswers([])
    setScreen('child-play')
    startTimer(childQs[0]?.time_seconds || 30)
  }

  const startParentPlay = () => {
    setQIndex(0)
    setChosen(null)
    setShowResult(false)
    setParentAnswers([])
    setScreen('parent-play')
    startTimer(parentQs[0]?.time_seconds || 30)
  }

  const submitAnswers = async (cAnswers: any[], pAnswers: any[]) => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/game/play/${gameId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_id: gameId,
          parent_phone: phone,
          child_answers: cAnswers,
          parent_answers: pAnswers,
        })
      }).then(r => r.json())
      setFinalResult(res)
      setScreen('result')
    } catch {
      setScreen('error')
    } finally {
      setSubmitting(false)
    }
  }

  const loadLeaderboard = async () => {
    const data = await fetch(`/api/game/play/${gameId}/leaderboard`).then(r => r.json())
    setLeaderboard(data)
    setScreen('leaderboard')
  }

  const currentQ = screen === 'child-play' ? childQs[qIndex] : parentQs[qIndex]
  const timerPct = currentQ ? (timeLeft / currentQ.time_seconds) * 100 : 100

  if (screen === 'loading') return (
    <div className="min-h-screen bg-[#1B4332] flex items-center justify-center">
      <div className="text-white text-center"><div className="text-5xl mb-3 animate-bounce">🎮</div><div className="font-bold">Yükleniyor...</div></div>
    </div>
  )

  if (screen === 'error') return (
    <div className="min-h-screen bg-[#1B4332] flex items-center justify-center p-4">
      <div className="text-white text-center"><div className="text-5xl mb-3">😔</div><div className="text-xl font-bold">Oyun Bulunamadı</div><div className="text-sm opacity-60 mt-2">Bu link geçerli değil veya süresi dolmuş</div></div>
    </div>
  )

  if (screen === 'phone') return (
    <div className="min-h-screen bg-gradient-to-b from-[#1B4332] to-[#2D6A4F] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🕌</div>
          <h1 className="text-2xl font-extrabold text-white">Kubbeler Yarışıyor</h1>
          <p className="text-white/50 text-sm mt-1">{game?.game_date}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-2xl">
          <div className="text-base font-bold text-gray-900 mb-4 text-center">Telefon Numaranız</div>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
            placeholder="05XX XXX XX XX"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-center text-lg font-mono outline-none focus:border-green-500 mb-3" />
          <p className="text-xs text-gray-400 text-center mb-5">Kayıtlı veli telefon numaranızı girin</p>
          <button onClick={() => phone.trim().length >= 10 && setScreen('password')}
            disabled={phone.trim().length < 10}
            className="w-full py-4 bg-[#1B4332] text-white font-extrabold text-lg rounded-2xl disabled:opacity-40 transition-colors hover:bg-green-800">
            Devam Et →
          </button>
        </div>
      </div>
    </div>
  )

  if (screen === 'password') return (
    <div className="min-h-screen bg-gradient-to-b from-[#1B4332] to-[#2D6A4F] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🔑</div>
          <h1 className="text-2xl font-extrabold text-white">Günlük Şifre</h1>
          <p className="text-white/50 text-sm mt-1">Hocandan duyduğun kelimeyi yaz</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-2xl">
          <input value={password} onChange={e => setPassword(e.target.value.toUpperCase())}
            placeholder="ŞİFREYİ YAZ..."
            className="w-full px-4 py-3 border-2 border-amber-300 rounded-xl text-center text-xl font-bold tracking-widest uppercase outline-none focus:border-amber-500 mb-5" />
          <button onClick={verifyPassword} disabled={!password.trim()}
            className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-lg rounded-2xl disabled:opacity-40">
            Gir →
          </button>
          <p className="text-xs text-gray-400 text-center mt-3">Şifreyi bilmiyorsan bugün camiye gel!</p>
        </div>
      </div>
    </div>
  )

  if (screen === 'child-intro') return (
    <div className="min-h-screen bg-gradient-to-b from-[#1B4332] to-[#2D6A4F] flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <div className="text-6xl mb-4">🦸</div>
        <h1 className="text-2xl font-extrabold text-white mb-2">Hazır mısın, {studentName.split(' ')[0]}?</h1>
        <p className="text-white/60 text-sm mb-6">Sana {childQs.length} soru sorulacak. Her sorunun kendi süresi var!</p>
        <div className="bg-white/10 rounded-2xl p-4 mb-6 text-left space-y-2">
          <div className="text-white text-sm">✅ Süre dolmadan cevap ver</div>
          <div className="text-white text-sm">⚡ Hızlı cevap = bonus puan</div>
          <div className="text-white text-sm">🤫 Veliye ipucu verme!</div>
        </div>
        <button onClick={startChildPlay}
          className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-extrabold text-xl rounded-2xl">
          🚀 Başla!
        </button>
      </div>
    </div>
  )

  if (screen === 'child-play' || screen === 'parent-play') return (
    <div className="min-h-screen bg-gradient-to-b from-[#1B4332] to-[#2D6A4F] flex flex-col p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-white/60 text-xs font-bold">
          {screen==='child-play'?`👦 ${studentName.split(' ')[0]}`:`👨 ${parentName.split(' ')[0]||'Veli'}`} • {qIndex+1}/{screen==='child-play'?childQs.length:parentQs.length}
        </div>
        <div className={cn('w-14 h-14 rounded-full border-4 flex items-center justify-center font-extrabold text-xl',
          timeLeft>10?'border-green-400 text-white':'border-red-400 text-red-300 animate-pulse')}>
          {timeLeft}
        </div>
      </div>

      <div className="h-2 bg-white/20 rounded-full mb-5 overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-1000', timeLeft>10?'bg-green-400':'bg-red-400')}
          style={{ width: `${timerPct}%` }} />
      </div>

      <div className="bg-white/10 backdrop-blur rounded-2xl p-5 mb-5 flex-shrink-0">
        <div className="text-white font-bold text-lg leading-relaxed text-center">{currentQ?.question_text}</div>
      </div>

      <div className="grid grid-cols-2 gap-3 flex-1">
        {OPTS.map(opt => {
          const text = currentQ?.[`option_${opt.toLowerCase()}`] || ''
          const isChosen = chosen === opt
          return (
            <button key={opt}
              onClick={() => handleChoose(opt)}
              disabled={!!chosen}
              className={cn('py-4 px-3 rounded-2xl font-bold text-white text-sm transition-all shadow-lg flex flex-col items-center justify-center gap-1',
                isChosen ? `${OPT_COLORS[opt]} scale-95` :
                chosen ? `${OPT_COLORS[opt]} opacity-40` :
                `${OPT_COLORS[opt]} hover:scale-105 active:scale-95`)}>
              <span className="text-2xl font-extrabold">{opt}</span>
              <span className="text-xs leading-tight text-center">{text}</span>
            </button>
          )
        })}
      </div>
    </div>
  )

  if (screen === 'handover') return (
    <div className="min-h-screen bg-gradient-to-b from-[#1B4332] to-[#2D6A4F] flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-extrabold text-white mb-2">Harika, {studentName.split(' ')[0]}!</h1>
        <p className="text-white/60 text-sm mb-5">{childQs.length} soruyu tamamladın! Şimdi telefonu <strong className="text-white">{parentName || 'anne/babana'}</strong> ver.</p>
        <div className="bg-amber-400/20 border-2 border-amber-400 rounded-2xl p-5 mb-6">
          <p className="text-amber-200 text-sm font-bold mb-1">👨 {parentName || 'Veli'} için:</p>
          <p className="text-amber-100 text-sm">Sıra sizde! {parentQs.length} soru gelecek. Hazır olunca başla butonuna basın.</p>
        </div>
        <button onClick={() => setScreen('parent-intro')}
          className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-lg rounded-2xl">
          👨 Ben Hazırım, Başla!
        </button>
        <p className="text-white/30 text-xs mt-3">Bu butona sadece veli basmalı!</p>
      </div>
    </div>
  )

  if (screen === 'parent-intro') return (
    <div className="min-h-screen bg-gradient-to-b from-[#1B4332] to-[#2D6A4F] flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <div className="text-6xl mb-4">🦅</div>
        <h1 className="text-2xl font-extrabold text-white mb-2">Sıra sizde{parentName ? `, ${parentName.split(' ')[0]}` : ''}!</h1>
        <p className="text-white/60 text-sm mb-6">{parentQs.length} soru gelecek — çocuktan farklı ama aynı konuda!</p>
        <div className="bg-white/10 rounded-2xl p-4 mb-6 text-left space-y-2">
          <div className="text-white text-sm">💡 Sorular çocuktan farklı</div>
          <div className="text-white text-sm">⚡ Hızlı ve doğru = bonus puan</div>
          <div className="text-white text-sm">🏆 Veli puanı x1.5 çarpan!</div>
        </div>
        <button onClick={startParentPlay}
          className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xl rounded-2xl">
          🚀 Başla!
        </button>
      </div>
    </div>
  )

  if (screen === 'result' && finalResult) return (
    <div className="min-h-screen bg-gradient-to-b from-[#1B4332] to-[#2D6A4F] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-5">
          <div className="text-6xl mb-2">{finalResult.already_played ? '🔄' : '🏆'}</div>
          <div className="text-5xl font-extrabold text-yellow-300 mb-1">{finalResult.total_score}</div>
          <div className="text-white/60 text-sm">Toplam Puan</div>
          {finalResult.already_played && <div className="text-amber-300 text-sm mt-1">Bu oyunu daha önce oynadınız</div>}
        </div>

        <div className="bg-white/10 rounded-2xl p-4 mb-4">
          <div className="text-white/60 text-xs font-bold uppercase mb-2">Aile</div>
          <div className="text-white font-bold">{finalResult.student_name}</div>
          {finalResult.parent_name && <div className="text-white/70 text-sm">{finalResult.parent_name}</div>}
        </div>

        <button onClick={loadLeaderboard}
          className="w-full py-4 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-extrabold text-base rounded-2xl mb-3">
          🏆 Puan Tablosunu Gör
        </button>
      </div>
    </div>
  )

  if (screen === 'leaderboard') return (
    <div className="min-h-screen bg-gradient-to-b from-[#1B4332] to-[#2D6A4F] p-4 pb-8">
      <div className="max-w-sm mx-auto">
        <div className="text-center mb-5">
          <div className="text-4xl mb-1">🏆</div>
          <h2 className="text-2xl font-extrabold text-white">Puan Tablosu</h2>
          <p className="text-white/50 text-sm">{game?.game_date}</p>
        </div>
        <div className="space-y-2 mb-5">
          {leaderboard.length === 0
            ? <div className="bg-white/10 rounded-xl p-6 text-center text-white/50">Henüz katılımcı yok</div>
            : leaderboard.map((e, i) => {
              const medal = i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}.`
              const isMe = e.name === studentName
              return (
                <div key={i} className={cn('flex items-center gap-3 px-4 py-3 rounded-xl',
                  isMe?'bg-yellow-400/20 border-2 border-yellow-400':'bg-white/10')}>
                  <div className="text-2xl w-8 text-center">{medal}</div>
                  <div className="flex-1">
                    <div className={cn('font-bold text-sm', isMe?'text-yellow-300':'text-white')}>
                      {e.name} {isMe&&'(Sen)'}
                    </div>
                  </div>
                  <div className={cn('font-extrabold text-lg', isMe?'text-yellow-300':'text-white')}>{e.score}</div>
                </div>
              )
            })
          }
        </div>
        <button onClick={loadLeaderboard}
          className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-sm">
          🔄 Yenile
        </button>
      </div>
    </div>
  )

  return null
}
