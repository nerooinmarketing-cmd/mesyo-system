import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { cn } from '@/lib/utils'

const OPTS = ['A','B','C','D'] as const

type Screen = 'loading'|'password'|'child-intro'|'child-play'|'handover'|'parent-intro'|'parent-play'|'result'|'leaderboard'|'error'

export default function GamePlayPage() {
  const { gameId } = useParams<{ gameId: string }>()
  const [screen, setScreen] = useState<Screen>('loading')
  const [game, setGame] = useState<any>(null)
  const [childQs, setChildQs] = useState<any[]>([])
  const [parentQs, setParentQs] = useState<any[]>([])

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [pwError, setPwError] = useState('')
  const [studentName, setStudentName] = useState('')
  const [parentName, setParentName] = useState('')

  const [qIndex, setQIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [chosen, setChosen] = useState<string|null>(null)
  const [correctOpt, setCorrectOpt] = useState<string|null>(null)
  const [showAns, setShowAns] = useState(false)
  const [childAnswers, setChildAnswers] = useState<any[]>([])
  const [parentAnswers, setParentAnswers] = useState<any[]>([])
  const startRef = useRef<number>(0)
  const timerRef = useRef<any>(null)

  const [finalResult, setFinalResult] = useState<any>(null)
  const [leaderboard, setLeaderboard] = useState<any[]>([])

  useEffect(() => {
    if (!gameId) return
    fetch(`/api/game/play/${gameId}`)
      .then(r => r.json())
      .then(d => {
        if (d.detail) { setScreen('error'); return }
        setGame(d)
        setChildQs(d.child_questions || [])
        setParentQs(d.parent_questions || [])
        setScreen('password')
      })
      .catch(() => setScreen('error'))
  }, [gameId])

  const startTimer = (secs: number) => {
    clearInterval(timerRef.current)
    setTimeLeft(secs)
    startRef.current = Date.now()
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); autoTimeout(); return 0 }
        return t - 1
      })
    }, 1000)
  }

  const autoTimeout = () => {
    if (chosen) return
    setChosen('__')
    setShowAns(true)
    setTimeout(() => advance('__'), 2000)
  }

  const pick = (opt: string) => {
    if (chosen) return
    clearInterval(timerRef.current)
    setChosen(opt)
    setShowAns(true)
    setTimeout(() => advance(opt), 1800)
  }

  const advance = (opt: string) => {
    const isChild = screen === 'child-play'
    const qs = isChild ? childQs : parentQs
    const ans = { question_index: qIndex, chosen: opt === '__' ? '' : opt, time_used: Math.round((Date.now()-startRef.current)/1000) }
    const newIdx = qIndex + 1

    if (isChild) {
      const arr = [...childAnswers, ans]
      setChildAnswers(arr)
      if (newIdx < qs.length) { setQIndex(newIdx); setChosen(null); setShowAns(false); setCorrectOpt(null); startTimer(qs[newIdx].time_seconds||30) }
      else { setScreen('handover') }
    } else {
      const arr = [...parentAnswers, ans]
      setParentAnswers(arr)
      if (newIdx < qs.length) { setQIndex(newIdx); setChosen(null); setShowAns(false); setCorrectOpt(null); startTimer(qs[newIdx].time_seconds||30) }
      else { submit([...childAnswers], arr) }
    }
  }

  // Cevap gösterilince doğru şıkkı çek
  useEffect(() => {
    if (!showAns || !gameId) return
    const qs = screen === 'child-play' ? childQs : parentQs
    const qid = qs[qIndex]?.id
    if (!qid) return
    fetch(`/api/game/play/${gameId}`)
      .then(r => r.json())
      .then(d => {
        // Doğru cevabı backend'den al — şimdilik hint yok, soruyu tekrar çekemeyiz
        // Bu yüzden görsel olarak seçimi gösteriyoruz
      })
  }, [showAns])

  const verifyPw = async () => {
    if (!password.trim()) return
    setPwError('')
    const res = await fetch(`/api/game/play/${gameId}/verify-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: password.trim(), phone: phone.trim() })
    }).then(r => r.json())

    if (!res.correct) { setPwError('Şifre yanlış! Hocandan öğren.'); setPassword(''); return }
    setStudentName(res.student_name || 'Öğrenci')
    setParentName(res.parent_name || 'Veli')
    setScreen('child-intro')
  }

  const startChild = () => { setQIndex(0); setChosen(null); setShowAns(false); setCorrectOpt(null); setChildAnswers([]); setScreen('child-play'); startTimer(childQs[0]?.time_seconds||30) }
  const startParent = () => { setQIndex(0); setChosen(null); setShowAns(false); setCorrectOpt(null); setParentAnswers([]); setScreen('parent-play'); startTimer(parentQs[0]?.time_seconds||30) }

  const submit = async (cA: any[], pA: any[]) => {
    try {
      const res = await fetch(`/api/game/play/${gameId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: gameId, parent_phone: phone, child_answers: cA, parent_answers: pA })
      }).then(r => r.json())
      setFinalResult(res)
      setScreen('result')
    } catch { setScreen('error') }
  }

  const loadLB = async () => {
    const d = await fetch(`/api/game/play/${gameId}/leaderboard`).then(r => r.json())
    setLeaderboard(d)
    setScreen('leaderboard')
  }

  const curQ = screen === 'child-play' ? childQs[qIndex] : parentQs[qIndex]
  const totalQs = screen === 'child-play' ? childQs.length : parentQs.length
  const timerPct = curQ ? (timeLeft / (curQ.time_seconds||30)) * 100 : 100

  // ── EKRANLAR ──────────────────────────────────────────────────────────────

  if (screen === 'loading') return (
    <div className="min-h-screen bg-[#1B4332] flex items-center justify-center">
      <div className="text-center text-white"><div className="text-5xl mb-3 animate-bounce">🎮</div><div className="font-bold text-lg">Yükleniyor...</div></div>
    </div>
  )

  if (screen === 'error') return (
    <div className="min-h-screen bg-[#1B4332] flex items-center justify-center p-4">
      <div className="text-center text-white"><div className="text-5xl mb-3">😔</div><div className="text-xl font-bold">Oyun Bulunamadı</div><div className="text-sm opacity-60 mt-2">Bu link geçerli değil veya süresi dolmuş</div></div>
    </div>
  )

  if (screen === 'password') return (
    <div className="min-h-screen bg-gradient-to-b from-[#1B4332] to-[#2D6A4F] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🕌</div>
          <h1 className="text-3xl font-extrabold text-white">Kubbeler Yarışıyor</h1>
          <p className="text-white/50 text-sm mt-1">{game?.game_date}</p>
        </div>
        <div className="bg-white rounded-3xl p-7 shadow-2xl">
          <div className="text-center mb-5">
            <div className="text-3xl mb-1">🔑</div>
            <h2 className="text-lg font-bold text-gray-900">Günlük Şifre</h2>
            <p className="text-xs text-gray-400 mt-0.5">Hocandan duyduğun kelimeyi yaz</p>
          </div>
          {pwError && <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-semibold px-4 py-2.5 rounded-xl mb-3 text-center">{pwError}</div>}
          <input value={password} onChange={e => { setPassword(e.target.value.toUpperCase()); setPwError('') }}
            onKeyDown={e => e.key==='Enter' && verifyPw()}
            placeholder="ŞİFREYİ YAZ..."
            className="w-full px-4 py-4 border-2 border-amber-300 focus:border-amber-500 rounded-2xl text-center text-2xl font-extrabold tracking-widest uppercase outline-none mb-3" />
          <input value={phone} onChange={e => setPhone(e.target.value)}
            placeholder="Veli telefonu (opsiyonel)"
            type="tel"
            className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-center text-sm outline-none focus:border-green-400 mb-5 text-gray-600" />
          <button onClick={verifyPw} disabled={!password.trim()}
            className="w-full py-4 bg-[#1B4332] hover:bg-green-800 text-white font-extrabold text-lg rounded-2xl disabled:opacity-40 transition-colors">
            Yarışmaya Gir →
          </button>
        </div>
      </div>
    </div>
  )

  if (screen === 'child-intro') return (
    <div className="min-h-screen bg-gradient-to-b from-[#1B4332] to-[#2D6A4F] flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <div className="text-7xl mb-5">🦸</div>
        <h1 className="text-2xl font-extrabold text-white mb-2">Hazır mısın, {studentName.split(' ')[0]}?</h1>
        <p className="text-white/60 text-sm mb-7">Sana <strong className="text-white">{childQs.length} soru</strong> sorulacak!</p>
        <div className="bg-white/10 rounded-2xl p-5 mb-7 text-left space-y-3">
          {['✅ Süre dolmadan cevap ver', '⚡ Hızlı cevap = bonus puan', '🤫 Anne/babana şıkkı söyleme!'].map(t => (
            <div key={t} className="text-white text-sm">{t}</div>
          ))}
        </div>
        <button onClick={startChild}
          className="w-full py-5 bg-green-500 hover:bg-green-400 text-white font-extrabold text-xl rounded-2xl transition-colors shadow-lg">
          🚀 Başla!
        </button>
      </div>
    </div>
  )

  if (screen === 'child-play' || screen === 'parent-play') return (
    <div className="min-h-screen bg-gradient-to-b from-[#1B4332] to-[#2D6A4F] flex flex-col p-4">
      {/* Üst bar */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="text-white/70 text-xs font-bold">
          {screen==='child-play' ? `👦 ${studentName.split(' ')[0]}` : `👨 ${parentName.split(' ')[0]||'Veli'}`}
        </div>
        <div className="flex items-center gap-2">
          {Array.from({length: totalQs}).map((_,i) => (
            <div key={i} className={cn('w-2 h-2 rounded-full', i<qIndex?'bg-green-400':i===qIndex?'bg-white':'bg-white/20')} />
          ))}
        </div>
        <div className={cn('w-12 h-12 rounded-full border-4 flex items-center justify-center font-extrabold text-lg',
          timeLeft>10?'border-green-400 text-white':'border-red-400 text-red-300 animate-pulse')}>
          {timeLeft}
        </div>
      </div>

      {/* Timer bar */}
      <div className="h-1.5 bg-white/20 rounded-full mb-5 overflow-hidden flex-shrink-0">
        <div className={cn('h-full rounded-full transition-all duration-1000', timeLeft>10?'bg-green-400':'bg-red-400')}
          style={{width:`${timerPct}%`}} />
      </div>

      {/* Soru */}
      <div className="bg-white/15 backdrop-blur-sm rounded-3xl p-6 mb-6 flex-shrink-0">
        <div className="text-white/50 text-xs font-bold uppercase mb-2">Soru {qIndex+1} / {totalQs}</div>
        <div className="text-white font-bold text-xl leading-relaxed">{curQ?.question_text}</div>
      </div>

      {/* Şıklar */}
      <div className="grid grid-cols-1 gap-3 flex-1">
        {OPTS.map(opt => {
          const text = curQ?.[`option_${opt.toLowerCase()}`] || ''
          const isChosen = chosen === opt
          const isCorrect = showAns && correctOpt === opt
          const isWrong = showAns && isChosen && opt !== correctOpt

          let cls = 'bg-white/20 border-2 border-white/30 text-white hover:bg-white/30 hover:border-white/50'
          if (!showAns && isChosen) cls = 'bg-white/40 border-2 border-white text-white scale-[0.98]'
          if (showAns && isChosen && !correctOpt) cls = 'bg-white/30 border-2 border-white text-white'
          if (isCorrect) cls = 'bg-green-500 border-2 border-green-300 text-white'
          if (isWrong) cls = 'bg-red-500 border-2 border-red-300 text-white'
          if (showAns && !isChosen && !isCorrect) cls = 'bg-white/10 border-2 border-white/20 text-white/50'

          return (
            <button key={opt} onClick={() => pick(opt)} disabled={!!chosen}
              className={cn('flex items-center gap-4 px-5 py-4 rounded-2xl font-semibold text-left transition-all', cls)}>
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center text-sm font-extrabold flex-shrink-0',
                isCorrect?'bg-green-600':isWrong?'bg-red-600':'bg-white/20')}>
                {showAns && isCorrect ? '✓' : showAns && isWrong ? '✗' : opt}
              </div>
              <span className="text-base">{text}</span>
            </button>
          )
        })}
      </div>

      {/* Cevap sonucu */}
      {showAns && (
        <div className={cn('mt-4 rounded-2xl p-4 text-center font-bold text-lg flex-shrink-0',
          chosen && chosen!=='__' ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200')}>
          {chosen === '__' ? '⏰ Süre Doldu!' : '✅ Cevap kaydedildi'}
        </div>
      )}
    </div>
  )

  if (screen === 'handover') return (
    <div className="min-h-screen bg-gradient-to-b from-[#1B4332] to-[#2D6A4F] flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <div className="text-7xl mb-5">🎉</div>
        <h1 className="text-2xl font-extrabold text-white mb-2">Harika, {studentName.split(' ')[0]}!</h1>
        <p className="text-white/60 text-sm mb-6">Sorularını tamamladın! Şimdi telefonu <strong className="text-white">{parentName||'anne/babana'}</strong> ver.</p>
        <div className="bg-amber-400/20 border-2 border-amber-400 rounded-2xl p-5 mb-7">
          <p className="text-amber-200 font-bold mb-1">👨 {parentName||'Veli'} için:</p>
          <p className="text-amber-100 text-sm">Sıra sizde! {parentQs.length} soru gelecek.</p>
        </div>
        <button onClick={() => setScreen('parent-intro')}
          className="w-full py-5 bg-amber-500 hover:bg-amber-400 text-white font-extrabold text-xl rounded-2xl">
          👨 Ben Hazırım!
        </button>
        <p className="text-white/30 text-xs mt-3">Bu butona sadece veli basmalı!</p>
      </div>
    </div>
  )

  if (screen === 'parent-intro') return (
    <div className="min-h-screen bg-gradient-to-b from-[#1B4332] to-[#2D6A4F] flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <div className="text-7xl mb-5">🦅</div>
        <h1 className="text-2xl font-extrabold text-white mb-2">Sıra sizde{parentName?`, ${parentName.split(' ')[0]}`:''}!</h1>
        <p className="text-white/60 text-sm mb-7">{parentQs.length} soru — veli puanı <strong className="text-yellow-300">x1.5 çarpan!</strong></p>
        <div className="bg-white/10 rounded-2xl p-5 mb-7 text-left space-y-3">
          {['💡 Sorular çocuktan farklı ama aynı konu','⚡ Hızlı ve doğru = bonus puan','🏆 Veli puanı 1.5 kat!'].map(t=>(
            <div key={t} className="text-white text-sm">{t}</div>
          ))}
        </div>
        <button onClick={startParent}
          className="w-full py-5 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xl rounded-2xl">
          🚀 Başla!
        </button>
      </div>
    </div>
  )

  if (screen === 'result' && finalResult) return (
    <div className="min-h-screen bg-gradient-to-b from-[#1B4332] to-[#2D6A4F] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm text-center">
        <div className="text-7xl mb-3">{finalResult.already_played?'🔄':'🏆'}</div>
        <div className="text-6xl font-extrabold text-yellow-300 mb-1">{finalResult.total_score}</div>
        <div className="text-white/60 text-sm mb-2">Toplam Puan</div>
        {finalResult.already_played && <div className="text-amber-300 text-sm mb-4">Bu oyunu daha önce oynadınız</div>}
        <div className="bg-white/10 rounded-2xl p-4 mb-6 text-center">
          <div className="text-white font-bold">{finalResult.student_name}</div>
          {finalResult.parent_name && <div className="text-white/60 text-sm">{finalResult.parent_name}</div>}
        </div>
        <button onClick={loadLB}
          className="w-full py-5 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-extrabold text-lg rounded-2xl shadow-lg">
          🏆 Puan Tablosunu Gör
        </button>
      </div>
    </div>
  )

  if (screen === 'leaderboard') return (
    <div className="min-h-screen bg-gradient-to-b from-[#1B4332] to-[#2D6A4F] p-4 pb-10">
      <div className="max-w-sm mx-auto">
        <div className="text-center mb-6">
          <div className="text-4xl mb-1">🏆</div>
          <h2 className="text-2xl font-extrabold text-white">Puan Tablosu</h2>
          <p className="text-white/50 text-sm">{game?.game_date}</p>
        </div>
        <div className="space-y-2 mb-5">
          {leaderboard.length === 0
            ? <div className="bg-white/10 rounded-2xl p-6 text-center text-white/50 text-sm">Henüz katılımcı yok</div>
            : leaderboard.map((e,i) => {
              const medal = i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}.`
              const isMe = e.name === studentName
              return (
                <div key={i} className={cn('flex items-center gap-3 px-4 py-3.5 rounded-2xl',
                  isMe?'bg-yellow-400/20 border-2 border-yellow-400':'bg-white/10')}>
                  <div className="text-2xl w-8 text-center flex-shrink-0">{medal}</div>
                  <div className="flex-1 min-w-0">
                    <div className={cn('font-bold text-sm truncate', isMe?'text-yellow-300':'text-white')}>
                      {e.name}{isMe&&' (Sen)'}
                    </div>
                  </div>
                  <div className={cn('font-extrabold text-xl flex-shrink-0', isMe?'text-yellow-300':'text-white')}>{e.score}</div>
                </div>
              )
            })
          }
        </div>
        <button onClick={loadLB}
          className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-sm transition-colors">
          🔄 Yenile
        </button>
      </div>
    </div>
  )

  return null
}
