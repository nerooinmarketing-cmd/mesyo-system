// ─── TİPLER ──────────────────────────────────────────────────────────────────
export interface Question {
  id: number
  category: 'dini' | 'kultur' | 'zeka' | 'sinerji'
  difficulty: 1 | 2 | 3
  text: string
  options: { A: string; B: string; C: string; D: string }
  correct: 'A' | 'B' | 'C' | 'D'
  timeSeconds: number
  hint?: string
  explanation?: string
}

export interface DailyGame {
  slug: string
  date: string
  password: string
  questions: Question[]         // çocuk soruları
  parentQuestions?: Question[]  // veli soruları (farklı soru, aynı konu)
  openAt: string
  closeAt: string
  active: boolean
}

export interface Answer {
  questionId: number
  chosen: 'A' | 'B' | 'C' | 'D' | null
  timeUsed: number  // saniye
  correct: boolean
}

export interface GameSession {
  studentId: string
  studentName: string
  parentName: string
  classId: string
  className: string
  date: string
  childAnswers: Answer[]
  parentAnswers: Answer[]
  totalScore: number
  breakdown: ScoreBreakdown[]
  completedAt: string
}

export interface ScoreBreakdown {
  questionId: number
  childCorrect: boolean
  parentCorrect: boolean
  childTime: number
  parentTime: number
  base: number
  speedBonus: number
  synergyBonus: number
  total: number
  label: string
}

export interface LeaderboardEntry {
  rank: number
  studentName: string
  parentName: string
  className: string
  todayScore: number
  weeklyScore: number
  totalScore: number
  badge?: string
  playedToday: boolean
}

// ─── DEMO VERİ ────────────────────────────────────────────────────────────────

export interface QuestionPair {
  childQuestion: Question
  parentQuestion: Question
}

// Çocuk soruları — camide öğrendiklerini test eder
export const DEMO_QUESTIONS: Question[] = [
  {
    id: 1, category: 'dini', difficulty: 1,
    text: 'Fatiha suresi kaç ayettir?',
    options: { A: '5', B: '6', C: '7', D: '8' },
    correct: 'C', timeSeconds: 20,
    hint: '7 rakamını düşün...',
    explanation: 'Fatiha suresi 7 ayettir. Açılış suresi olarak her namazda okunur.'
  },
  {
    id: 2, category: 'kultur', difficulty: 2,
    text: 'Türkiye\'nin başkenti hangi şehirdir?',
    options: { A: 'İstanbul', B: 'İzmir', C: 'Bursa', D: 'Ankara' },
    correct: 'D', timeSeconds: 15,
    explanation: 'Ankara, 13 Ekim 1923\'te Türkiye Cumhuriyeti\'nin başkenti ilan edildi.'
  },
  {
    id: 3, category: 'sinerji', difficulty: 1,
    text: 'Ailenizde en çok kim çay içer?',
    options: { A: 'Anne', B: 'Baba', C: 'Ben', D: 'Hepsi Eşit' },
    correct: 'A', timeSeconds: 25,
    explanation: 'Aile Sinerjisi sorusu! Aynı şıkkı seçerseniz +50 bonus puan!'
  },
]

// Veli soruları — AYNI KONU, FARKLI SORU. Veli de araştırıp öğrensin!
export const DEMO_PARENT_QUESTIONS: Question[] = [
  {
    id: 11, category: 'dini', difficulty: 2,
    text: 'Fatiha suresi Kuran-ı Kerim\'in kaçıncı suresidir?',
    options: { A: '2. Sure', B: '5. Sure', C: '1. Sure', D: '7. Sure' },
    correct: 'C', timeSeconds: 20,
    hint: 'Kuran\'ın tam başına bak...',
    explanation: 'Fatiha, Kuran-ı Kerim\'in 1. suresidir. "Açılış" anlamına gelir.'
  },
  {
    id: 12, category: 'kultur', difficulty: 2,
    text: 'Ankara hangi yılda Türkiye\'nin başkenti ilan edilmiştir?',
    options: { A: '1920', B: '1923', C: '1925', D: '1938' },
    correct: 'B', timeSeconds: 20,
    explanation: 'Ankara, 13 Ekim 1923\'te başkent ilan edildi.'
  },
  {
    id: 13, category: 'sinerji', difficulty: 1,
    text: 'Çocuğunuzla aynı şıkkı seçin! — Ailenizde en çok kim çay içer?',
    options: { A: 'Baba', B: 'Anne', C: 'Hepsi Eşit', D: 'Ben' },
    correct: 'B', timeSeconds: 25,
    explanation: 'Aile Sinerjisi! İkisi aynı şıkkı seçerse +50 bonus puan!'
  },
]

export const DEMO_DAILY_GAME: DailyGame = {
  slug: 'karacihan',
  date: new Date().toISOString().split('T')[0],
  password: 'TEBESSÜM',
  questions: DEMO_QUESTIONS,
  parentQuestions: DEMO_PARENT_QUESTIONS,
  openAt: '00:00',
  closeAt: '23:59',
  active: true,
}



export const DEMO_LEADERBOARD: LeaderboardEntry[] = [
  { rank:1,  studentName:'Ahmet Y.',  parentName:'Mehmet Yılmaz',  className:'Sabah Grubu',   todayScore:230, weeklyScore:1120, totalScore:3450, badge:'Günün Kaşifi', playedToday:true },
  { rank:2,  studentName:'Zeynep K.', parentName:'Ali Kaya',       className:'Öğleden Sonra', todayScore:200, weeklyScore:980,  totalScore:2900, playedToday:true },
  { rank:3,  studentName:'Ömer D.',   parentName:'Hasan Demir',    className:'Sabah Grubu',   todayScore:180, weeklyScore:950,  totalScore:2750, playedToday:true },
  { rank:4,  studentName:'Fatma A.',  parentName:'İbrahim Arslan', className:'Akşam Grubu',   todayScore:160, weeklyScore:820,  totalScore:2400, playedToday:true },
  { rank:5,  studentName:'Ali V.',    parentName:'Kemal Vural',    className:'Öğleden Sonra', todayScore:140, weeklyScore:710,  totalScore:2100, playedToday:true },
  { rank:6,  studentName:'Elif T.',   parentName:'Ramazan Koç',    className:'Sabah Grubu',   todayScore:130, weeklyScore:680,  totalScore:1950, playedToday:true },
  { rank:7,  studentName:'Musa S.',   parentName:'Yusuf Şahin',    className:'Akşam Grubu',   todayScore:120, weeklyScore:630,  totalScore:1800, playedToday:true },
  { rank:8,  studentName:'Hatice O.', parentName:'Mustafa Öz',     className:'Sabah Grubu',   todayScore:100, weeklyScore:580,  totalScore:1650, playedToday:true },
  { rank:9,  studentName:'Yusuf B.',  parentName:'Ahmet Boz',      className:'Öğleden Sonra', todayScore:80,  weeklyScore:490,  totalScore:1400, playedToday:true },
  { rank:10, studentName:'Büşra Ç.', parentName:'Emre Çelik',     className:'Akşam Grubu',   todayScore:60,  weeklyScore:420,  totalScore:1200, playedToday:true },
]

// ─── PUAN HESAPLAMA ───────────────────────────────────────────────────────────
export function calcScore(
  questions: Question[],
  childAnswers: Answer[],
  parentAnswers: Answer[]
): { total: number; breakdown: ScoreBreakdown[] } {
  let total = 0
  const breakdown: ScoreBreakdown[] = []

  questions.forEach((q, i) => {
    const ca = childAnswers[i]
    const pa = parentAnswers[i]
    const childCorrect  = ca?.chosen === q.correct
    const parentCorrect = pa?.chosen === q.correct

    let base = 10
    if (childCorrect && parentCorrect)  { base = 100 }
    else if (childCorrect)              { base = 60  }
    else if (parentCorrect)             { base = 40  }

    // Hız bonusu
    const childSpeed  = ca && childCorrect  && ca.timeUsed  <= q.timeSeconds / 2 ? 10 : 0
    const parentSpeed = pa && parentCorrect && pa.timeUsed  <= q.timeSeconds / 2 ? 10 : 0
    const speedBonus  = childSpeed + parentSpeed

    // Sinerji bonusu
    const synergyBonus = (q.category === 'sinerji' && ca?.chosen && pa?.chosen && ca.chosen === pa.chosen) ? 50 : 0

    const questionTotal = base + speedBonus + synergyBonus
    total += questionTotal

    let label = 'Katılım Desteği'
    if (childCorrect && parentCorrect) label = 'Tam Sinerji'
    else if (childCorrect)             label = 'Boynuz Kulağı Geçti'
    else if (parentCorrect)            label = 'Babadan Bilgelik'

    breakdown.push({
      questionId: q.id,
      childCorrect, parentCorrect,
      childTime:  ca?.timeUsed  || 0,
      parentTime: pa?.timeUsed  || 0,
      base, speedBonus, synergyBonus,
      total: questionTotal,
      label,
    })
  })

  return { total, breakdown }
}

// Şıkları karıştır (veli turu için)
export function shuffleOptions(q: Question): Question {
  const entries = Object.entries(q.options) as ['A'|'B'|'C'|'D', string][]
  for (let i = entries.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [entries[i], entries[j]] = [entries[j], entries[i]]
  }
  const newOptions = Object.fromEntries(entries.map(([,v], i) => [['A','B','C','D'][i], v])) as Question['options']
  const correctValue = q.options[q.correct]
  const newCorrect = (Object.entries(newOptions).find(([,v]) => v === correctValue)?.[0] || 'A') as 'A'|'B'|'C'|'D'
  return { ...q, options: newOptions, correct: newCorrect }
}
