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
  const urlPhone = new URLSearchParams(window.location.search).get('tel') || ''
  const [phone] = useState(urlPhone)
  const [password, setPassword] = useState('')
  const [pwError, setPwError] = useState('')
  const [studentName, setStudentName] = useState('')
  const [parentName, setParentName] = useState('')
  const [correctAnswers, setCorrectAnswers] = useState<Record<string,{correct:string,player_type:string}>>({})

  const [qIndex, setQIndex] = useState(0)
  const [timeLeft, setTimeLeft] = useState(30)
  const [chosen, setChosen] = useState<string|null>(null)
  const [showAns, setShowAns] = useState(false)
  const [childAnswers, setChildAnswers] = useState<any[]>([])
  const [parentAnswers, setParentAnswers] = useState<any[]>([])
  const startRef = useRef<number>(0)
  const timerRef = useRef<any>(null)
  const [finalResult, setFinalResult] = useState<any>(null)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [lbLoading, setLbLoading] = useState(false)

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
    setTimeout(() => advance('__'), 2500)
  }

  const pick = (opt: string) => {
    if (chosen) return
    clearInterval(timerRef.current)
    setChosen(opt)
    setShowAns(true)
    setTimeout(() => advance(opt), 2000)
  }

  const advance = (opt: string) => {
    const isChild = screen === 'child-play'
    const qs = isChild ? childQs : parentQs
    const ans = { question_index: qIndex, chosen: opt === '__' ? '' : opt, time_used: Math.round((Date.now()-startRef.current)/1000) }
    const newIdx = qIndex + 1
    if (isChild) {
      const arr = [...childAnswers, ans]
      setChildAnswers(arr)
      if (newIdx < qs.length) { setQIndex(newIdx); setChosen(null); setShowAns(false); startTimer(qs[newIdx].time_seconds||30) }
      else { setScreen('handover') }
    } else {
      const arr = [...parentAnswers, ans]
      setParentAnswers(arr)
      if (newIdx < qs.length) { setQIndex(newIdx); setChosen(null); setShowAns(false); startTimer(qs[newIdx].time_seconds||30) }
      else { submit([...childAnswers], arr) }
    }
  }

  const verifyPw = async () => {
    if (!password.trim()) return
    setPwError('')
    const res = await fetch(`/api/game/play/${gameId}/verify-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: password.trim(), phone })
    }).then(r => r.json())
    if (!res.correct) { setPwError('Şifre yanlış! Hocandan öğren.'); setPassword(''); return }
    setStudentName(res.student_name || 'Öğrenci')
    setParentName(res.parent_name || 'Veli')
    if (res.correct_answers) setCorrectAnswers(res.correct_answers)
    setScreen('child-intro')
  }

  const startChild = () => { setQIndex(0); setChosen(null); setShowAns(false); setChildAnswers([]); setScreen('child-play'); startTimer(childQs[0]?.time_seconds||30) }
  const startParent = () => { setQIndex(0); setChosen(null); setShowAns(false); setParentAnswers([]); setScreen('parent-play'); startTimer(parentQs[0]?.time_seconds||30) }

  const submit = async (cA: any[], pA: any[]) => {
    try {
      const res = await fetch(`/api/game/play/${gameId}/submit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_id: gameId, parent_phone: phone, child_answers: cA, parent_answers: pA })
      }).then(r => r.json())
      setFinalResult(res)
      setScreen('result')
    } catch { setScreen('error') }
  }

  const loadLB = async () => {
    setLbLoading(true)
    try {
      const d = await fetch(`/api/game/play/${gameId}/leaderboard`).then(r => r.json())
      setLeaderboard(d)
      setScreen('leaderboard')
    } finally { setLbLoading(false) }
  }

  const curQ = screen === 'child-play' ? childQs[qIndex] : parentQs[qIndex]
  const totalQs = screen === 'child-play' ? childQs.length : parentQs.length
  const timerPct = curQ ? (timeLeft / (curQ.time_seconds||30)) * 100 : 100
  const correctOpt = curQ ? correctAnswers[curQ.id]?.correct : null

  if (screen === 'loading') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center"><div className="text-5xl mb-3 animate-bounce">🎮</div><div className="text-gray-500 font-semibold">Yükleniyor...</div></div>
    </div>
  )

  if (screen === 'error') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center"><div className="text-5xl mb-3">😔</div><div className="text-xl font-bold text-gray-800">Oyun Bulunamadı</div></div>
    </div>
  )

  if (screen === 'password') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-[#1B4332] rounded-full flex items-center justify-center text-4xl mx-auto mb-3 shadow-lg">🕌</div>
          <h1 className="text-2xl font-extrabold text-gray-900">Kubbeler Yarışıyor</h1>
          <p className="text-gray-400 text-sm mt-1">{game?.game_date}</p>
        </div>
        <div className="bg-white rounded-3xl shadow-xl p-7">
          <div className="text-center mb-5">
            <div className="text-3xl mb-1">🔑</div>
            <h2 className="text-lg font-bold text-gray-900">Günlük Şifre</h2>
            <p className="text-xs text-gray-400 mt-0.5">Hocandan duyduğun kelimeyi yaz</p>
          </div>
          {pwError && <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-semibold px-4 py-2.5 rounded-xl mb-3 text-center">{pwError}</div>}
          <input value={password} onChange={e => { setPassword(e.target.value.toUpperCase()); setPwError('') }}
            onKeyDown={e => e.key==='Enter' && verifyPw()}
            placeholder="ŞİFREYİ YAZ..."
            className="w-full px-4 py-4 border-2 border-amber-300 focus:border-amber-500 rounded-2xl text-center text-2xl font-extrabold tracking-widest uppercase outline-none mb-5" />
          <button onClick={verifyPw} disabled={!password.trim()}
            className="w-full py-4 bg-[#1B4332] hover:bg-green-800 text-white font-extrabold text-lg rounded-2xl disabled:opacity-40 transition-colors shadow-md">
            Yarışmaya Gir →
          </button>
        </div>
      </div>
    </div>
  )

  if (screen === 'child-intro') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-3">🦸</div>
          <h1 className="text-2xl font-extrabold text-gray-900">Hazır mısın, {studentName.split(' ')[0]}?</h1>
          <p className="text-gray-400 text-sm mt-1">Sana {childQs.length} soru sorulacak!</p>
        </div>
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-5">
          {[{icon:'✅',text:'Süre dolmadan cevap ver'},{icon:'⚡',text:'Hızlı cevap = bonus puan'},{icon:'🤫',text:'Anne/babana şıkkı söyleme!'}].map(r => (
            <div key={r.text} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
              <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-xl">{r.icon}</div>
              <span className="text-gray-700 font-semibold text-sm">{r.text}</span>
            </div>
          ))}
        </div>
        <button onClick={startChild} className="w-full py-5 bg-[#1B4332] text-white font-extrabold text-xl rounded-2xl shadow-lg">🚀 Başla!</button>
      </div>
    </div>
  )

  if (screen === 'child-play' || screen === 'parent-play') {
    const isCorrect = showAns && correctOpt && chosen !== '__' && chosen === correctOpt
    const isWrong = showAns && correctOpt && chosen !== '__' && chosen !== correctOpt
    const isTimeout = showAns && chosen === '__'

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col p-4 max-w-sm mx-auto">
        {/* Üst bar */}
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className={cn('w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold', screen==='child-play'?'bg-blue-100 text-blue-700':'bg-purple-100 text-purple-700')}>
              {screen==='child-play'?'👦':'👨'}
            </div>
            <span className="text-gray-600 text-sm font-semibold">{screen==='child-play'?studentName.split(' ')[0]:parentName.split(' ')[0]||'Veli'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {Array.from({length: totalQs}).map((_,i) => (
              <div key={i} className={cn('w-2.5 h-2.5 rounded-full transition-all', i<qIndex?'bg-green-500':i===qIndex?'bg-gray-800':'bg-gray-200')} />
            ))}
          </div>
          <div className={cn('w-12 h-12 rounded-full flex items-center justify-center font-extrabold text-lg border-4',
            timeLeft>10?'border-green-400 text-green-600 bg-green-50':'border-red-400 text-red-500 bg-red-50 animate-pulse')}>
            {timeLeft}
          </div>
        </div>

        {/* Timer bar */}
        <div className="h-2 bg-gray-200 rounded-full mb-4 overflow-hidden flex-shrink-0">
          <div className={cn('h-full rounded-full transition-all duration-1000', timeLeft>10?'bg-green-500':'bg-red-500')} style={{width:`${timerPct}%`}} />
        </div>

        {/* Cevap animasyonu overlay */}
        {showAns && (
          <div className={cn('fixed inset-0 z-50 flex items-center justify-center p-6 transition-all', isCorrect?'bg-green-500/90':isWrong?'bg-red-500/90':'bg-gray-700/90')}>
            <div className="text-center">
              <div className={cn('text-8xl mb-4 animate-bounce', isCorrect?'':'')}>
                {isCorrect ? '✅' : isTimeout ? '⏰' : '❌'}
              </div>
              <div className="text-white font-extrabold text-3xl mb-2">
                {isCorrect ? 'Doğru!' : isTimeout ? 'Süre Doldu!' : 'Yanlış!'}
              </div>
              {isWrong && correctOpt && (
                <div className="bg-white/20 rounded-2xl px-6 py-3 text-white font-bold text-lg">
                  Doğru cevap: {correctOpt}
                </div>
              )}
              {isCorrect && (
                <div className="bg-white/20 rounded-2xl px-6 py-3 text-white font-bold text-lg">
                  +{timeLeft > (curQ?.time_seconds||30)/2 ? '120' : '100'} puan!
                </div>
              )}
            </div>
          </div>
        )}

        {/* Soru kartı */}
        <div className="bg-white rounded-3xl shadow-md p-6 mb-4 flex-shrink-0 border border-gray-100">
          <div className="text-xs font-bold text-gray-400 uppercase mb-2">Soru {qIndex+1} / {totalQs}</div>
          <div className="text-gray-900 font-bold text-lg leading-relaxed">{curQ?.question_text}</div>
        </div>

        {/* Şıklar */}
        <div className="space-y-3 flex-1">
          {OPTS.map(opt => {
            const text = curQ?.[`option_${opt.toLowerCase()}`] || ''
            const optColors = { A:'bg-blue-500', B:'bg-purple-500', C:'bg-orange-500', D:'bg-red-500' }
            const isChosen = chosen === opt
            const isCorr = showAns && correctOpt === opt
            const isWr = showAns && isChosen && correctOpt !== opt

            let cls = 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
            if (isCorr) cls = 'border-green-400 bg-green-50'
            else if (isWr) cls = 'border-red-400 bg-red-50'
            else if (!showAns && isChosen) cls = 'border-blue-400 bg-blue-50'
            else if (showAns && !isChosen) cls = 'border-gray-100 bg-gray-50 opacity-40'

            return (
              <button key={opt} onClick={() => pick(opt)} disabled={!!chosen}
                className={cn('w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 font-semibold text-left transition-all shadow-sm', cls)}>
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-extrabold flex-shrink-0', optColors[opt])}>
                  {isCorr ? '✓' : isWr ? '✗' : opt}
                </div>
                <span className="text-gray-800 text-base">{text}</span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  if (screen === 'handover') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-3">🎉</div>
          <h1 className="text-2xl font-extrabold text-gray-900">Tebrikler, {studentName.split(' ')[0]}!</h1>
          <p className="text-gray-400 text-sm mt-1">Sorularını tamamladın!</p>
        </div>
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-5 border-l-4 border-amber-400">
          <div className="font-bold text-gray-900 mb-1">👨 {parentName||'Veli'} için:</div>
          <p className="text-gray-600 text-sm">Sıra sizde! {parentQs.length} soru gelecek.</p>
        </div>
        <button onClick={() => setScreen('parent-intro')}
          className="w-full py-5 bg-amber-500 hover:bg-amber-400 text-white font-extrabold text-xl rounded-2xl shadow-lg">
          👨 Ben Hazırım!
        </button>
        <p className="text-gray-400 text-xs text-center mt-3">Bu butona sadece veli basmalı!</p>
      </div>
    </div>
  )

  if (screen === 'parent-intro') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-3">🦅</div>
          <h1 className="text-2xl font-extrabold text-gray-900">Sıra sizde{parentName?`, ${parentName.split(' ')[0]}`:''}!</h1>
          <p className="text-gray-400 text-sm mt-1">{parentQs.length} soru — veli puanı x1.5!</p>
        </div>
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-5">
          {[{icon:'💡',text:'Sorular çocuktan farklı'},{icon:'⚡',text:'Hızlı ve doğru = bonus puan'},{icon:'🏆',text:'Veli puanı 1.5 kat!'}].map(r => (
            <div key={r.text} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
              <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center text-xl">{r.icon}</div>
              <span className="text-gray-700 font-semibold text-sm">{r.text}</span>
            </div>
          ))}
        </div>
        <button onClick={startParent} className="w-full py-5 bg-purple-600 text-white font-extrabold text-xl rounded-2xl shadow-lg">🚀 Başla!</button>
      </div>
    </div>
  )

  if (screen === 'result' && finalResult) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center mb-4">
          <div className="text-6xl mb-3">{finalResult.already_played?'🔄':'🏆'}</div>
          <div className="text-6xl font-extrabold text-[#1B4332] mb-1">{finalResult.total_score}</div>
          <div className="text-gray-400 text-sm mb-4">Toplam Puan</div>
          <div className="border-t border-gray-100 pt-4">
            <div className="font-bold text-gray-900">{finalResult.student_name}</div>
            {finalResult.parent_name && finalResult.parent_name !== 'Veli' && <div className="text-gray-400 text-sm">{finalResult.parent_name}</div>}
          </div>
        </div>

        {finalResult.breakdown && finalResult.breakdown.length > 0 && (
          <div className="bg-white rounded-3xl shadow-xl p-5 mb-4">
            <div className="text-sm font-bold text-gray-700 mb-3">Soru Sonuçları</div>
            <div className="space-y-2">
              {finalResult.breakdown.map((b: any, i: number) => (
                <div key={i} className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl', b.is_correct?'bg-green-50':'bg-red-50')}>
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0', b.is_correct?'bg-green-500 text-white':'bg-red-400 text-white')}>
                    {b.is_correct?'✓':'✗'}
                  </div>
                  <div className="flex-1 text-xs">
                    <span className="text-gray-500 font-semibold">{b.player==='child'?'👦 Öğrenci':'👨 Veli'}</span>
                    <span className={cn('ml-2 font-bold', b.is_correct?'text-green-600':'text-red-500')}>{b.is_correct?'Doğru':'Yanlış'}</span>
                  </div>
                  <div className="font-bold text-gray-700 text-sm">+{b.score}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={loadLB} disabled={lbLoading}
          className="w-full py-5 bg-[#1B4332] text-white font-extrabold text-lg rounded-2xl shadow-lg disabled:opacity-60">
          {lbLoading ? '⏳ Yükleniyor...' : '🏆 Puan Tablosunu Gör'}
        </button>
      </div>
    </div>
  )

  if (screen === 'leaderboard') return (
    <div className="min-h-screen bg-gray-50 p-4 pb-10">
      <div className="max-w-sm mx-auto">
        <div className="text-center mb-6 pt-4">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-2">🏆</div>
          <h2 className="text-2xl font-extrabold text-gray-900">Puan Tablosu</h2>
          <p className="text-gray-400 text-sm">{game?.game_date}</p>
        </div>
        <div className="space-y-2 mb-5">
          {leaderboard.length === 0
            ? <div className="bg-white rounded-2xl shadow p-6 text-center text-gray-400 text-sm">Henüz katılımcı yok</div>
            : leaderboard.map((e, i) => {
              const medal = i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}.`
              const isMe = e.name === studentName
              return (
                <div key={i} className={cn('bg-white rounded-2xl shadow-sm flex items-center gap-3 px-4 py-4 border-2', isMe?'border-amber-400 bg-amber-50':'border-transparent')}>
                  <div className="text-2xl w-8 text-center flex-shrink-0">{medal}</div>
                  <div className="flex-1 min-w-0">
                    <div className={cn('font-bold text-sm', isMe?'text-amber-700':'text-gray-900')}>{e.name}{isMe&&' 👈'}</div>
                  </div>
                  <div className={cn('font-extrabold text-xl flex-shrink-0', isMe?'text-amber-600':'text-gray-800')}>{e.score}</div>
                </div>
              )
            })
          }
        </div>
        <button onClick={loadLB} disabled={lbLoading}
          className="w-full py-3 bg-white border border-gray-200 text-gray-600 font-semibold rounded-2xl text-sm shadow-sm hover:bg-gray-50 disabled:opacity-50">
          {lbLoading ? '⏳ Yükleniyor...' : '🔄 Yenile'}
        </button>
      </div>
    </div>
  )

  return null
}
