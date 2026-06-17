import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { DEMO_DAILY_GAME, DEMO_PARENT_QUESTIONS, calcScore } from '@/lib/game'
import type { Question, Answer, ScoreBreakdown } from '@/lib/game'
import { cn } from '@/lib/utils'

type Stage = 'password' | 'child_intro' | 'child_q' | 'handover' | 'parent_intro' | 'parent_q' | 'result'

const CAT_LABELS: Record<string, string> = {
  dini:'Dini Bilgi', kultur:'Genel Kültür', zeka:'Zeka Sorusu', sinerji:'Aile Sinerjisi'
}
const CAT_COLORS: Record<string, string> = {
  dini:'bg-green-100 text-green-700',
  kultur:'bg-blue-100 text-blue-700',
  zeka:'bg-purple-100 text-purple-700',
  sinerji:'bg-amber-100 text-amber-700'
}

function TimerBar({ seconds, total, onExpire, running }: {
  seconds: number; total: number; onExpire: () => void; running: boolean
}) {
  const [left, setLeft] = useState(seconds)
  const cb = useRef(onExpire)
  cb.current = onExpire

  useEffect(() => {
    setLeft(seconds)
    if (!running) return
    const t = setInterval(() => {
      setLeft(p => {
        if (p <= 1) { clearInterval(t); setTimeout(() => cb.current(), 0); return 0 }
        return p - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [seconds, running])

  const pct = total > 0 ? Math.round(left / total * 100) : 0
  return (
    <div className="mb-5">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-gray-400 font-semibold">Süre</span>
        <span className={cn('font-bold', left <= 5 ? 'text-red-500 animate-pulse' : left <= 10 ? 'text-amber-500' : 'text-gray-600')}>{left} sn</span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-1000',
          pct > 60 ? 'bg-green-400' : pct > 25 ? 'bg-amber-400' : 'bg-red-400')}
          style={{ width: pct + '%' }} />
      </div>
    </div>
  )
}

export default function GamePage() {
  const { slug } = useParams<{ slug: string }>()

  // Panelden yayınlanan oyunu oku, yoksa demo kullan
  const getActiveGame = () => {
    try {
      const saved = localStorage.getItem('mesyo_daily_game_' + slug) 
        || localStorage.getItem('mesyo_daily_game_global')
      if (saved) {
        const parsed = JSON.parse(saved)
        return {
          ...DEMO_DAILY_GAME,
          password: parsed.password || DEMO_DAILY_GAME.password,
          questions: parsed.questions?.length ? parsed.questions : DEMO_DAILY_GAME.questions,
        }
      }
    } catch {}
    return DEMO_DAILY_GAME
  }

  const game = getActiveGame()
  const childQuestions = game.questions
  const parentQuestions = game.parentQuestions || DEMO_PARENT_QUESTIONS

  const [stage, setStage] = useState<Stage>('password')
  const [pwInput, setPwInput] = useState('')
  const [pwError, setPwError] = useState('')
  const [qIdx, setQIdx] = useState(0)
  const [childAnswers, setChildAnswers] = useState<Answer[]>([])
  const [parentAnswers, setParentAnswers] = useState<Answer[]>([])
  const [selected, setSelected] = useState<'A'|'B'|'C'|'D'|null>(null)
  const [answered, setAnswered] = useState(false)
  const [showExp, setShowExp] = useState(false)
  const [startTime, setStartTime] = useState(0)
  const [timerKey, setTimerKey] = useState(0)
  const [result, setResult] = useState<{ total: number; breakdown: ScoreBreakdown[] } | null>(null)

  const isChild = stage === 'child_q'
  const currentQ: Question = isChild ? childQuestions[qIdx] : parentQuestions[qIdx]

  const resetQuestion = () => {
    setSelected(null)
    setAnswered(false)
    setShowExp(false)
    setStartTime(Date.now())
    setTimerKey(k => k + 1)
  }

  const handleSelect = (opt: 'A'|'B'|'C'|'D') => {
    if (answered) return
    setSelected(opt)
    setAnswered(true)
    setTimeout(() => setShowExp(true), 500)
  }

  const handleExpire = useCallback(() => {
    if (answered) return
    setAnswered(true)
    setSelected(null)
    setShowExp(true)
  }, [answered])

  const recordAndNext = () => {
    const timeUsed = Math.min(Math.round((Date.now() - startTime) / 1000), currentQ.timeSeconds)
    const ans: Answer = {
      questionId: currentQ.id,
      chosen: selected,
      timeUsed,
      correct: selected === currentQ.correct,
    }

    if (isChild) {
      const next = [...childAnswers, ans]
      setChildAnswers(next)
      if (qIdx < childQuestions.length - 1) {
        setQIdx(i => i + 1)
        resetQuestion()
      } else {
        setQIdx(0)
        setStage('handover')
      }
    } else {
      const next = [...parentAnswers, ans]
      setParentAnswers(next)
      if (qIdx < parentQuestions.length - 1) {
        setQIdx(i => i + 1)
        resetQuestion()
      } else {
        const r = calcScore(childQuestions, childAnswers, next)
        setResult(r)
        setStage('result')
      }
    }
  }

  const handlePassword = () => {
    if (pwInput.trim().toUpperCase() === game.password.toUpperCase()) {
      setStage('child_intro')
    } else {
      setPwError('Şifre yanlış! Camide hocandan öğren.')
      setPwInput('')
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#f5f5f0' }}>
      {/* Header */}
      <div className="bg-[#1B4332] px-4 pt-6 pb-5 text-center">
        <div className="text-2xl mb-1">🕌</div>
        <div className="text-white font-bold text-lg">Kubbeler Yarışıyor</div>
        <div className="text-white/50 text-xs mt-0.5">Aile Macera Ligi — {slug}</div>
      </div>

      <div className="max-w-md mx-auto px-4 py-5 space-y-3">

        {/* ŞİFRE */}
        {stage === 'password' && (
          <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
            <div className="text-5xl mb-4">🔑</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Günün Gizemli Şifresi</h1>
            <p className="text-sm text-gray-500 mb-5 leading-relaxed">
              Bugün camide hocandan duyduğun kelimeyi yaz. Şifresiz yarışmaya girilemiyor!
            </p>
            {pwError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 mb-4 text-sm text-red-600 font-semibold">
                {pwError}
              </div>
            )}
            <input
              value={pwInput}
              onChange={e => { setPwInput(e.target.value.toUpperCase()); setPwError('') }}
              onKeyDown={e => e.key === 'Enter' && handlePassword()}
              placeholder="ŞİFREYİ YAZ..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-center text-lg font-bold tracking-widest outline-none focus:border-green-500 mb-3 uppercase"
            />
            <button onClick={handlePassword}
              className="w-full py-4 bg-[#1B4332] hover:bg-green-800 text-white font-bold rounded-xl transition-colors">
              Yarışmaya Gir →
            </button>
            <p className="text-xs text-gray-400 mt-3">Şifreyi bilmiyorsan bugün camiye gel!</p>
          </div>
        )}

        {/* ÇOCUK GİRİŞ */}
        {stage === 'child_intro' && (
          <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
            <div className="text-5xl mb-4">🦸</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Hazır mısın, kahraman?</h1>
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
              Sana <strong>{childQuestions.length} soru</strong> sorulacak. Her sorunun kendine özel bir süresi var.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-5 text-sm text-green-800 text-left">
              <div className="font-bold mb-1">Kurallar:</div>
              <div className="text-xs space-y-1">
                <div>✅ Süre dolmadan cevap ver — daha fazla puan!</div>
                <div>⚡ İlk yarıda doğru cevap = bonus puan</div>
                <div>❤️ Aile Sinerjisi sorularında babana/annene söyleme!</div>
              </div>
            </div>
            <button onClick={() => { setStage('child_q'); resetQuestion() }}
              className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors text-base">
              Başla! 🚀
            </button>
          </div>
        )}

        {/* SORU EKRANI — ÇOCUK veya VELİ */}
        {(stage === 'child_q' || stage === 'parent_q') && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            {/* Üst bilgi */}
            <div className="flex items-center justify-between mb-4">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${CAT_COLORS[currentQ.category]}`}>
                {CAT_LABELS[currentQ.category]}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  {isChild ? '👦 Çocuk' : '👨 Veli'} · {qIdx + 1}/{childQuestions.length}
                </span>
                <span className="text-xs text-gray-300">{'★'.repeat(currentQ.difficulty)}</span>
              </div>
            </div>

            {/* Timer */}
            <TimerBar
              key={timerKey}
              seconds={currentQ.timeSeconds}
              total={currentQ.timeSeconds}
              onExpire={handleExpire}
              running={!answered}
            />

            {/* Soru */}
            {!isChild && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-3 text-xs text-amber-800">
                👨 Bu soru size özel — çocuktan farklı ama aynı konuda!
              </div>
            )}
            <p className="text-base font-bold text-gray-900 mb-5 leading-relaxed">{currentQ.text}</p>

            {/* Şıklar */}
            <div className="space-y-2.5 mb-4">
              {(['A','B','C','D'] as const).map(opt => {
                const isSelected = selected === opt
                const isCorrect = opt === currentQ.correct
                let cls = 'border-gray-200 text-gray-700 bg-white hover:border-gray-300 hover:bg-gray-50'
                if (answered) {
                  if (isCorrect) cls = 'border-green-500 bg-green-50 text-green-800'
                  else if (isSelected) cls = 'border-red-400 bg-red-50 text-red-700'
                  else cls = 'border-gray-100 text-gray-300 bg-gray-50'
                } else if (isSelected) {
                  cls = 'border-blue-500 bg-blue-50 text-blue-800'
                }
                return (
                  <button key={opt} onClick={() => handleSelect(opt)} disabled={answered}
                    className={cn('w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left font-semibold text-sm transition-all', cls)}>
                    <span className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                      answered && isCorrect ? 'bg-green-500 text-white' :
                      answered && isSelected && !isCorrect ? 'bg-red-400 text-white' :
                      !answered && isSelected ? 'bg-blue-500 text-white' :
                      'bg-gray-100 text-gray-500')}>
                      {opt}
                    </span>
                    <span className="flex-1">{currentQ.options[opt]}</span>
                    {answered && isCorrect && <span className="text-green-500 font-bold">✓</span>}
                    {answered && isSelected && !isCorrect && <span className="text-red-400">✗</span>}
                  </button>
                )
              })}
            </div>

            {/* İpucu (süre yarıya inince) */}
            {!answered && currentQ.hint && (
              <div className="text-xs text-center text-gray-400 italic mb-3">💡 {currentQ.hint}</div>
            )}

            {/* Açıklama */}
            {answered && showExp && currentQ.explanation && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4 text-sm text-blue-800 leading-relaxed">
                <strong>Bilgi:</strong> {currentQ.explanation}
              </div>
            )}

            {/* Sinerji notu */}
            {currentQ.category === 'sinerji' && !answered && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-3 text-xs text-amber-700">
                ❤️ Aile Sinerjisi! Anne/babanla aynı şıkkı seçersen +50 bonus!
              </div>
            )}

            {answered && (
              <button onClick={recordAndNext}
                className="w-full py-3.5 bg-[#1B4332] hover:bg-green-800 text-white font-bold rounded-xl text-sm transition-colors">
                {qIdx < childQuestions.length - 1
                  ? 'Sonraki Soru →'
                  : isChild ? 'Çocuk Turunu Bitir ✓' : 'Sonuçları Gör 🏆'}
              </button>
            )}
          </div>
        )}

        {/* DEVİR TESLİM */}
        {stage === 'handover' && (
          <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
            <div className="text-5xl mb-4">🎉</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Tebrikler, kahraman!</h1>
            <p className="text-sm text-gray-500 mb-3 leading-relaxed">
              {childQuestions.length} soruyu tamamladın! Şimdi telefonu <strong>annene ya da babana</strong> ver.
            </p>
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl px-5 py-4 mb-5">
              <p className="text-sm font-bold text-amber-800 mb-2">👨 Anne / Baba için:</p>
              <p className="text-sm text-amber-700 leading-relaxed">
                Çocuğunuz kendi sorularını tamamladı. Şimdi <strong>size özel farklı sorular</strong> gelecek — aynı konu ama farklı soru. Siz de araştırın, öğrenin!
              </p>
            </div>
            <button onClick={() => { setQIdx(0); setStage('parent_intro'); resetQuestion() }}
              className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-base transition-colors">
              👨 Ben Hazırım, Başla!
            </button>
            <p className="text-xs text-gray-400 mt-3">Bu butona sadece anne veya baba basmalı!</p>
          </div>
        )}

        {/* VELİ GİRİŞ */}
        {stage === 'parent_intro' && (
          <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
            <div className="text-5xl mb-4">🦅</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Sıra sizde!</h1>
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
              Size de aynı konulardan {parentQuestions.length} soru sorulacak — ama sorular farklı! Araştırın, öğrenin.
            </p>
            <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3 mb-5 text-xs text-purple-800 text-left space-y-1">
              <div>💡 Sorular çocuktan <strong>farklı</strong> — aynı konu, yeni sorular</div>
              <div>❤️ Aile Sinerjisi sorularında çocuğunuzla aynı şıkkı seçin!</div>
              <div>⚡ Hızlı ve doğru cevap = bonus puan</div>
            </div>
            <button onClick={() => { setStage('parent_q'); resetQuestion() }}
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-base transition-colors">
              Başla! 🚀
            </button>
          </div>
        )}

        {/* SONUÇ */}
        {stage === 'result' && result && (
          <div className="space-y-3">
            {/* Ana puan kartı */}
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
              <div className="text-5xl mb-2">🏆</div>
              <div className="text-5xl font-extrabold text-gray-900 mb-1">{result.total}</div>
              <div className="text-sm font-semibold text-gray-400 mb-4">Toplam Puan</div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  ['👦 Çocuk', childAnswers.filter(a=>a.correct).length + '/' + childQuestions.length + ' doğru', 'bg-green-50 text-green-700'],
                  ['👨 Veli', parentAnswers.filter(a=>a.correct).length + '/' + parentQuestions.length + ' doğru', 'bg-blue-50 text-blue-700'],
                  ['⭐ Bonus', '+' + result.breakdown.reduce((a,b)=>a+b.speedBonus+b.synergyBonus,0), 'bg-amber-50 text-amber-700'],
                ].map(([l,v,c])=>(
                  <div key={l} className={`rounded-xl p-2.5 text-center ${c}`}>
                    <div className="text-xs font-bold">{l}</div>
                    <div className="text-sm font-extrabold mt-0.5">{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Soru bazlı detay */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 text-sm font-bold text-gray-900">Soru Detayları</div>
              {result.breakdown.map((b, i) => {
                const cq = childQuestions[i]
                const pq = parentQuestions[i]
                return (
                  <div key={b.questionId} className="px-4 py-4 border-b border-gray-50 last:border-0">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <div className="flex-1">
                        <div className="text-xs text-gray-400 mb-1">Soru {i+1} — {CAT_LABELS[cq.category]}</div>
                        <div className="text-xs font-semibold text-gray-600 mb-0.5">👦 {cq.text}</div>
                        <div className="text-xs text-gray-500 italic">👨 {pq.text}</div>
                      </div>
                      <div className="text-lg font-extrabold text-green-600 flex-shrink-0">+{b.total}</div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${b.childCorrect?'bg-green-100 text-green-700':'bg-red-100 text-red-600'}`}>
                        👦 {b.childCorrect ? 'Doğru' : 'Yanlış'}
                      </span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${b.parentCorrect?'bg-green-100 text-green-700':'bg-red-100 text-red-600'}`}>
                        👨 {b.parentCorrect ? 'Doğru' : 'Yanlış'}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{b.label}</span>
                      {b.speedBonus > 0 && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">⚡ +{b.speedBonus}</span>}
                      {b.synergyBonus > 0 && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">❤️ +{b.synergyBonus}</span>}
                    </div>
                    {(cq.explanation || pq.explanation) && (
                      <div className="mt-2 text-xs text-blue-700 bg-blue-50 rounded-lg px-2.5 py-1.5">
                        {cq.explanation || pq.explanation}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Skor linki */}
            <div className="bg-[#1B4332] rounded-2xl p-5 text-center">
              <div className="text-white font-bold mb-1">Sıralamana bak!</div>
              <div className="text-white/50 text-xs mb-3 font-mono">localhost:5173/skor/{slug}</div>
              <a href={`/skor/${slug}`}
                className="inline-block px-6 py-2.5 bg-white text-[#1B4332] font-bold rounded-xl text-sm hover:bg-gray-100">
                🏆 Liderlik Tablosunu Gör
              </a>
            </div>

            <button onClick={() => window.location.reload()}
              className="w-full py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl text-sm hover:bg-gray-50">
              Yeniden Oyna
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
