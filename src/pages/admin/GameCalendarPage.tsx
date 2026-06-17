import { useState, useEffect, useRef } from 'react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Button, Modal, useToast } from '@/components/ui'
import { DEMO_QUESTIONS, DEMO_PARENT_QUESTIONS, DEMO_LEADERBOARD } from '@/lib/game'
import type { Question } from '@/lib/game'
import { waLink } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

// ─── TİPLER ──────────────────────────────────────────────────────────────────
interface DayPlan {
  date: string           // YYYY-MM-DD
  password: string
  questionIds: number[]
  published: boolean
  publishedAt?: string
  waSentAt?: string
  participantCount?: number
  topScore?: number
  topFamily?: string
}

// ─── DEMO VERİ ───────────────────────────────────────────────────────────────
const today = new Date()
const yd = (d: number) => { const r=new Date(today);r.setDate(r.getDate()+d);return r.toISOString().split('T')[0] }

const PASSWORDS = ['TEBESSÜM','SABIR','ŞÜKÜR','BEREKET','MERHAMET','IHLAS','TAKVA','HIDAYET','TEVBE','ÜMIT','VEFA','SÜKUR']

const DEMO_PLANS: DayPlan[] = [
  { date:yd(-6), password:'ŞÜKÜR',    questionIds:[1,2,3], published:true,  publishedAt:'17:45', waSentAt:'20:00', participantCount:7,  topScore:280, topFamily:'Yılmaz Ailesi' },
  { date:yd(-5), password:'SABIR',    questionIds:[1,2,3], published:true,  publishedAt:'18:00', waSentAt:'20:00', participantCount:9,  topScore:310, topFamily:'Kaya Ailesi' },
  { date:yd(-4), password:'BEREKET',  questionIds:[1,2,3], published:true,  publishedAt:'17:30', waSentAt:'20:00', participantCount:8,  topScore:250, topFamily:'Demir Ailesi' },
  { date:yd(-3), password:'MERHAMET', questionIds:[1,2,3], published:true,  publishedAt:'18:15', waSentAt:'20:00', participantCount:10, topScore:330, topFamily:'Arslan Ailesi' },
  { date:yd(-2), password:'IHLAS',    questionIds:[1,2,3], published:true,  publishedAt:'17:50', waSentAt:'20:00', participantCount:6,  topScore:200, topFamily:'Öz Ailesi' },
  { date:yd(-1), password:'TAKVA',    questionIds:[1,2,3], published:true,  publishedAt:'18:00', waSentAt:'20:00', participantCount:11, topScore:350, topFamily:'Çelik Ailesi' },
  { date:yd(0),  password:'HIDAYET',  questionIds:[1,2,3], published:true,  publishedAt:'17:45', waSentAt:undefined, participantCount:0 },
  { date:yd(1),  password:'TEVBE',    questionIds:[1,2,3], published:false },
  { date:yd(2),  password:'ÜMIT',     questionIds:[1,2,3], published:false },
  { date:yd(3),  password:'VEFA',     questionIds:[1,2,3], published:false },
]

const DEMO_PARENTS = [
  {name:'Mehmet Yılmaz', phone:'05321111111'},
  {name:'Ali Kaya',       phone:'05322222222'},
  {name:'Hasan Demir',    phone:'05323333333'},
  {name:'İbrahim Arslan', phone:'05324444444'},
  {name:'Fatma Öz',       phone:'05325555555'},
  {name:'Hasan Çelik',    phone:'05326666666'},
  {name:'Mustafa Şahin',  phone:'05327777777'},
]

const CAT_LABELS: Record<string,string> = {
  dini:'🕌 Dini Bilgi', kultur:'🌍 Genel Kültür', zeka:'🧩 Zeka', sinerji:'❤️ Aile Sinerjisi'
}

// ─── YARDIMCI ────────────────────────────────────────────────────────────────
function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric',weekday:'long'})
}

function isToday(dateStr: string) {
  return dateStr === today.toISOString().split('T')[0]
}

function isPast(dateStr: string) {
  return dateStr < today.toISOString().split('T')[0]
}

// ─── SORU KARTÇIĞI ───────────────────────────────────────────────────────────
function QuestionCard({ q, pq, idx }: { q: Question; pq?: Question; idx: number }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-5 h-5 bg-[#1B4332] text-white rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">
          {idx}
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
          {CAT_LABELS[q.category] || q.category}
        </span>
        <span className="text-[10px] text-gray-400 ml-auto">⏱ {q.timeSeconds}sn</span>
      </div>
      <div className="text-xs font-bold text-gray-900 mb-1">👦 {q.text}</div>
      <div className="flex gap-1.5 flex-wrap mb-2">
        {(['A','B','C','D'] as const).map(opt=>(
          <span key={opt} className={cn('text-[10px] px-1.5 py-0.5 rounded font-mono',
            opt===q.correct?'bg-green-100 text-green-700 font-bold':'bg-gray-100 text-gray-500')}>
            {opt}: {q.options[opt]}
          </span>
        ))}
      </div>
      {pq && (
        <div className="border-t border-gray-200 pt-2 mt-1">
          <div className="text-xs text-gray-600 mb-1">👨 <span className="font-semibold">{pq.text}</span></div>
          <div className="flex gap-1.5 flex-wrap">
            {(['A','B','C','D'] as const).map(opt=>(
              <span key={opt} className={cn('text-[10px] px-1.5 py-0.5 rounded font-mono',
                opt===pq.correct?'bg-blue-100 text-blue-700 font-bold':'bg-gray-100 text-gray-500')}>
                {opt}: {pq.options[opt]}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── GÜN DETAY MODAL ─────────────────────────────────────────────────────────
function DayModal({
  date, plan, questions, parentQuestions, slug,
  onClose, onSave
}: {
  date: string
  plan: DayPlan | undefined
  questions: Question[]
  parentQuestions: Question[]
  slug: string
  onClose: () => void
  onSave: (plan: DayPlan) => void
}) {
  const { toast } = useToast()
  const [pw, setPw] = useState(plan?.password || '')
  const [selIds, setSelIds] = useState<number[]>(plan?.questionIds || [])
  const [activeTab, setActiveTab] = useState<'sorular'|'wa'|'sonuclar'>('sorular')
  const [sending, setSending] = useState(false)
  const [sentCount, setSentCount] = useState(0)
  const past = isPast(date)
  const todayFlag = isToday(date)

  const canPublish = pw.trim().length >= 2 && selIds.length === 3
  const gameUrl = `${window.location.origin}/oyun/${slug}`

  const toggleQ = (id: number) => {
    setSelIds(p => p.includes(id) ? p.filter(x=>x!==id) : p.length<3 ? [...p,id] : p)
  }

  const save = (published: boolean) => {
    if (published && !canPublish) { toast('Şifre ve 3 soru seçin','error'); return }
    onSave({
      date, password: pw.trim(), questionIds: selIds,
      published,
      publishedAt: published ? new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'}) : plan?.publishedAt,
      waSentAt: plan?.waSentAt,
      participantCount: plan?.participantCount,
      topScore: plan?.topScore,
      topFamily: plan?.topFamily,
    })
    toast(published ? 'Yayınlandı ✅ — Saat 20:00\'de WA gönderilecek' : 'Taslak kaydedildi','success')
    onClose()
  }

  const sendWA = async () => {
    setSending(true); setSentCount(0)
    const msg = `🕌 *Kubbeler Yarışıyor — ${new Date(date).toLocaleDateString('tr-TR',{day:'numeric',month:'long'})}*\n\n✨ Bu akşamın soruları hazır!\n\n🎮 Yarışmaya katılmak için:\n${gameUrl}\n\n🔑 Şifre: Çocuğunuz bugün camide öğrendi!\n\n⏰ Yarışma: 20:00 – 23:00\n\nAilenizle birlikte oynayın, puan kazanın! 🏆`
    DEMO_PARENTS.forEach((p,i)=>{
      setTimeout(()=>{
        window.open(waLink(p.phone, msg.replace('[VELİ]', p.name)), '_blank')
        setSentCount(i+1)
      }, i*700)
    })
    await new Promise(r=>setTimeout(r, DEMO_PARENTS.length*700+500))
    setSending(false)
    onSave({ ...plan!, date, password:pw, questionIds:selIds, published:true,
      waSentAt: new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'}) })
    toast(`📱 ${DEMO_PARENTS.length} veliye WA gönderildi!`, 'success')
    onClose()
  }

  return (
    <Modal open={true} onClose={onClose} title={formatDate(date)} wide>
      <div className="space-y-4">
        {/* Durum bandı */}
        {plan?.published && (
          <div className={cn('flex items-center gap-3 px-4 py-2.5 rounded-xl border',
            plan.waSentAt ? 'bg-green-50 border-green-300' : 'bg-blue-50 border-blue-300')}>
            <span className="text-xl">{plan.waSentAt ? '✅' : '📅'}</span>
            <div>
              <div className="text-sm font-bold text-gray-900">
                {plan.waSentAt ? `WA Gönderildi — ${plan.waSentAt}` : 'Yayınlandı — WA bekleniyor'}
              </div>
              <div className="text-xs text-gray-500">
                {plan.waSentAt
                  ? `${plan.participantCount||0} katılımcı · ${plan.topFamily||'—'} birinci`
                  : `Yayın: ${plan.publishedAt} · WA saat 20:00'de gidecek`}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1">
          {([['sorular','📚 Sorular'],['wa','📱 WA Gönder'],['sonuclar','📊 Sonuçlar']] as const).map(([t,l])=>(
            <button key={t} onClick={()=>setActiveTab(t)}
              className={cn('flex-1 py-2 text-xs font-semibold rounded-lg transition-all',
                activeTab===t?'bg-white text-gray-900 shadow-sm':'text-gray-400')}>
              {l}
            </button>
          ))}
        </div>

        {/* ── SORULAR ── */}
        {activeTab==='sorular' && (
          <div className="space-y-3">
            {/* Şifre */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">
                🔑 Günün Şifresi {!past && <span className="text-red-400">*</span>}
              </label>
              <div className="flex gap-2">
                <input value={pw} onChange={e=>setPw(e.target.value.toUpperCase())}
                  disabled={past}
                  placeholder="TEBESSÜM, SABIR..." maxLength={20}
                  className="flex-1 px-3 py-2.5 border-2 border-gray-200 rounded-xl text-center text-base font-bold tracking-widest outline-none focus:border-green-500 uppercase disabled:bg-gray-50 disabled:text-gray-400"/>
                {!past && (
                  <button onClick={()=>setPw(PASSWORDS[Math.floor(Math.random()*PASSWORDS.length)])}
                    className="px-3 py-2.5 border border-gray-200 rounded-xl text-xs text-gray-500 hover:bg-gray-50 whitespace-nowrap">
                    🎲 Rastgele
                  </button>
                )}
              </div>
              {!past && <p className="text-xs text-gray-400 mt-1">Bu kelimeyi dersin sonunda çocuklara söyleyin. WA grubuna yazmayın!</p>}
            </div>

            {/* Soru seçimi */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-500 uppercase">
                  Sorular {!past && <span className="text-red-400">*</span>} (tam 3 tane)
                </label>
                <div className="flex gap-1">
                  {[0,1,2].map(i=>(
                    <div key={i} className={cn('w-3 h-3 rounded-full transition-all',
                      i<selIds.length?'bg-green-500':'bg-gray-200')}/>
                  ))}
                </div>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {questions.map((q,idx)=>{
                  const isSel = selIds.includes(q.id)
                  const disabled = !past && !isSel && selIds.length>=3
                  return (
                    <div key={q.id} onClick={()=>!past && !disabled && toggleQ(q.id)}
                      className={cn('border-2 rounded-xl p-3 transition-all',
                        past ? 'border-gray-100 cursor-default' :
                        isSel ? 'border-green-500 bg-green-50 cursor-pointer' :
                        disabled ? 'border-gray-100 opacity-40 cursor-not-allowed' :
                        'border-gray-200 hover:border-gray-300 cursor-pointer')}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0',
                          isSel?'bg-green-500 text-white':'bg-gray-100 text-gray-400')}>
                          {isSel ? selIds.indexOf(q.id)+1 : idx+1}
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          {CAT_LABELS[q.category]}
                        </span>
                        <span className="text-[10px] text-gray-400 ml-auto">⏱ {q.timeSeconds}sn</span>
                      </div>
                      <p className="text-xs text-gray-800 font-semibold">{q.text}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Seçili sorular önizleme */}
            {selIds.length>0 && (
              <div>
                <div className="text-xs font-bold text-gray-500 uppercase mb-2">Seçili Sorular (Çocuk + Veli)</div>
                <div className="space-y-2">
                  {selIds.map((id,i)=>{
                    const q  = questions.find(x=>x.id===id)
                    const pq = parentQuestions[i]
                    if (!q) return null
                    return <QuestionCard key={id} q={q} pq={pq} idx={i+1}/>
                  })}
                </div>
              </div>
            )}

            {/* Kaydet butonları */}
            {!past && (
              <div className="flex gap-2 pt-2">
                <button onClick={()=>save(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl text-sm hover:bg-gray-50">
                  💾 Taslak Kaydet
                </button>
                <button onClick={()=>save(true)} disabled={!canPublish}
                  className="flex-1 py-2.5 bg-[#1B4332] hover:bg-green-800 disabled:opacity-40 text-white font-bold rounded-xl text-sm transition-colors">
                  🚀 Yayınla
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── WA GÖNDER ── */}
        {activeTab==='wa' && (
          <div className="space-y-3">
            {!plan?.published && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-sm text-amber-800">
                ⚠️ Önce "Sorular" sekmesinden günü yayınlayın, sonra WA gönderebilirsiniz.
              </div>
            )}

            {/* Mesaj önizleme */}
            <div>
              <div className="text-xs font-bold text-gray-500 uppercase mb-2">Mesaj Önizleme</div>
              <div className="bg-[#E8FDD8] rounded-2xl p-4 text-sm text-gray-800 whitespace-pre-line font-sans leading-relaxed border border-green-200">
                {`🕌 *Kubbeler Yarışıyor — ${new Date(date).toLocaleDateString('tr-TR',{day:'numeric',month:'long'})}*

✨ Bu akşamın soruları hazır!

🎮 Yarışmaya katılmak için:
${gameUrl}

🔑 Şifre: Çocuğunuz bugün camide öğrendi!

⏰ Yarışma: 20:00 – 23:00

Ailenizle birlikte oynayın, puan kazanın! 🏆`}
              </div>
            </div>

            {/* Hedef liste */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs font-bold text-gray-500 uppercase mb-2">
                Alıcılar ({DEMO_PARENTS.length} veli)
              </div>
              <div className="space-y-1.5">
                {DEMO_PARENTS.map((p,i)=>(
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-[10px] text-gray-500">{i+1}</span>
                    <span className="font-semibold text-gray-700">{p.name}</span>
                    <span className="text-gray-400 font-mono">{p.phone}</span>
                  </div>
                ))}
              </div>
            </div>

            {plan?.waSentAt && (
              <div className="bg-green-50 border border-green-300 rounded-xl p-3 text-sm text-green-800 font-semibold text-center">
                ✅ Bu gün için WA {plan.waSentAt}'de gönderildi
              </div>
            )}

            <button
              onClick={sendWA}
              disabled={!plan?.published || sending}
              className="w-full py-4 bg-[#25D366] hover:bg-[#128C7E] disabled:opacity-40 text-white font-bold rounded-2xl text-base transition-colors">
              {sending
                ? `📱 ${sentCount}/${DEMO_PARENTS.length} Gönderiliyor...`
                : `📱 Hemen ${DEMO_PARENTS.length} Veliye Gönder`}
            </button>

            {!plan?.waSentAt && plan?.published && (
              <div className="text-xs text-gray-400 text-center">
                💡 Saat 20:00'de otomatik hatırlatma için "Yayınla" yeterli. Manuel göndermek isterseniz yukarıdaki butonu kullanın.
              </div>
            )}
          </div>
        )}

        {/* ── SONUÇLAR ── */}
        {activeTab==='sonuclar' && (
          <div className="space-y-3">
            {!plan?.waSentAt
              ? <div className="text-center py-10 text-gray-400"><div className="text-3xl mb-2">📊</div><p className="text-sm">WA henüz gönderilmedi. Sonuçlar geldikçe burada görünecek.</p></div>
              : (
                <>
                  {/* Mini özet */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {l:'Katılımcı',   v:plan.participantCount||0, c:'text-green-600'},
                      {l:'En Yüksek',   v:plan.topScore||0,         c:'text-amber-600'},
                      {l:'Katılım %',   v:Math.round(((plan.participantCount||0)/DEMO_PARENTS.length)*100)+'%', c:'text-blue-600'},
                    ].map(s=>(
                      <div key={s.l} className="bg-gray-50 rounded-xl p-3 text-center">
                        <div className={`text-xl font-extrabold ${s.c}`}>{s.v}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{s.l}</div>
                      </div>
                    ))}
                  </div>

                  {plan.topFamily && (
                    <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 text-center">
                      <div className="text-2xl mb-1">🏆</div>
                      <div className="text-sm font-extrabold text-amber-800">{plan.topFamily}</div>
                      <div className="text-xs text-amber-600">{plan.topScore} puan · Günün Kaşifi</div>
                    </div>
                  )}

                  {/* Mini liderlik */}
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-gray-100 text-xs font-bold text-gray-700">Bu Günün Sıralaması</div>
                    {DEMO_LEADERBOARD.slice(0,5).map((e,i)=>(
                      <div key={i} className="flex items-center gap-2.5 px-4 py-2.5 border-b border-gray-50 last:border-0">
                        <span className="text-base">{i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}.`}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-gray-900 truncate">{e.studentName}</div>
                          <div className="text-[10px] text-gray-400">{e.parentName}</div>
                        </div>
                        <div className="text-sm font-bold text-green-600">{e.todayScore}</div>
                      </div>
                    ))}
                  </div>
                </>
              )
            }
          </div>
        )}
      </div>
    </Modal>
  )
}

// ─── ANA SAYFA ────────────────────────────────────────────────────────────────
export default function GameCalendarPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const slug = user?.institution_slug || 'karacihan'

  const [year,  setYear]  = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())  // 0-based
  const [plans, setPlans] = useState<DayPlan[]>(DEMO_PLANS)
  const [selDate, setSelDate] = useState<string|null>(null)
  const [view, setView] = useState<'ay'|'hafta'>('ay')

  // WA auto-send simülasyonu (gerçekte sunucu tarafı olur)
  const autoSendRef = useRef(false)
  useEffect(() => {
    const check = () => {
      const now = new Date()
      if (now.getHours()===20 && now.getMinutes()===0 && !autoSendRef.current) {
        autoSendRef.current = true
        const todayStr = now.toISOString().split('T')[0]
        const plan = plans.find(p=>p.date===todayStr && p.published && !p.waSentAt)
        if (plan) {
          toast('⏰ Saat 20:00 — Bugünün WA linki velilere gönderiliyor!', 'success')
        }
      }
      if (now.getHours()!==20) autoSendRef.current = false
    }
    const t = setInterval(check, 30000)
    return ()=>clearInterval(t)
  }, [plans])

  const savePlan = (plan: DayPlan) => {
    setPlans(p => {
      const idx = p.findIndex(x=>x.date===plan.date)
      return idx>=0 ? p.map(x=>x.date===plan.date?plan:x) : [...p,plan]
    })
    // localStorage'a kaydet
    try {
      const all = [...plans.filter(x=>x.date!==plan.date), plan]
      localStorage.setItem(`mesyo_game_plans_${slug}`, JSON.stringify(all))
    } catch {}
  }

  // Takvim hesapla
  const firstDay = new Date(year, month, 1)
  const lastDay  = new Date(year, month+1, 0)
  const startDow = (firstDay.getDay()+6)%7  // Pazartesi=0
  const daysInMonth = lastDay.getDate()
  const todayStr = today.toISOString().split('T')[0]

  const planMap = Object.fromEntries(plans.map(p=>[p.date,p]))

  const MONTH_NAMES = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']
  const DAY_NAMES   = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz']

  const prevMonth = () => { if(month===0){setMonth(11);setYear(y=>y-1)}else setMonth(m=>m-1) }
  const nextMonth = () => { if(month===11){setMonth(0);setYear(y=>y+1)}else setMonth(m=>m+1) }

  // Haftalık görünüm için bu haftanın günleri
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - (today.getDay()+6)%7)
  const weekDays = Array.from({length:7},(_,i)=>{
    const d = new Date(weekStart); d.setDate(weekStart.getDate()+i)
    return d.toISOString().split('T')[0]
  })

  const selPlan = selDate ? planMap[selDate] : undefined

  // Durum renkleri
  const getDayStatus = (dateStr: string) => {
    const p = planMap[dateStr]
    if (!p)            return 'empty'
    if (p.waSentAt)    return 'sent'
    if (p.published)   return 'published'
    return 'draft'
  }

  const STATUS_DOT: Record<string,string> = {
    empty:     '',
    draft:     'bg-gray-400',
    published: 'bg-blue-500',
    sent:      'bg-green-500',
  }

  // İstatistikler
  const thisMonthPlans = plans.filter(p=>p.date.startsWith(`${year}-${String(month+1).padStart(2,'0')}`))
  const sentCount      = thisMonthPlans.filter(p=>p.waSentAt).length
  const avgParticipant = thisMonthPlans.filter(p=>p.participantCount).length
    ? Math.round(thisMonthPlans.reduce((a,p)=>a+(p.participantCount||0),0)/thisMonthPlans.filter(p=>p.participantCount).length)
    : 0

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Üst bar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 rounded-xl p-1">
              {([['ay','📅 Aylık'],['hafta','📋 Haftalık']] as const).map(([v,l])=>(
                <button key={v} onClick={()=>setView(v)}
                  className={cn('px-3 py-1.5 text-xs font-semibold rounded-lg transition-all',
                    view===v?'bg-white text-gray-900 shadow-sm':'text-gray-400')}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <a href={`/oyun/${slug}`} target="_blank" rel="noreferrer"
              className="px-3 py-2 bg-green-50 border border-green-200 text-green-700 text-xs font-bold rounded-lg hover:bg-green-100">
              🎮 Oyun Sayfası ↗
            </a>
            <a href={`/skor/${slug}`} target="_blank" rel="noreferrer"
              className="px-3 py-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold rounded-lg hover:bg-amber-100">
              🏆 Skor Tablosu ↗
            </a>
          </div>
        </div>

        {/* İstatistik kartları */}
        <div className="grid grid-cols-4 gap-3">
          {[
            {l:'Bu Ay Yayın',    v:sentCount,      c:'text-green-600'},
            {l:'Ort. Katılımcı', v:avgParticipant, c:'text-blue-600'},
            {l:'Toplam Veli',    v:DEMO_PARENTS.length, c:'text-gray-700'},
            {l:'Kalan Günler',   v:daysInMonth - today.getDate(), c:'text-amber-600'},
          ].map(s=>(
            <div key={s.l} className="bg-white rounded-xl shadow-sm p-3 text-center">
              <div className={`text-xl font-extrabold ${s.c}`}>{s.v}</div>
              <div className="text-[10px] text-gray-400 font-semibold mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        {/* ── AY TAKVİMİ ── */}
        {view==='ay' && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Ay navigasyon */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <button onClick={prevMonth}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 font-bold transition-colors">
                ‹
              </button>
              <div className="text-base font-extrabold text-gray-900">
                {MONTH_NAMES[month]} {year}
              </div>
              <button onClick={nextMonth}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 font-bold transition-colors">
                ›
              </button>
            </div>

            {/* Gün başlıkları */}
            <div className="grid grid-cols-7 border-b border-gray-100">
              {DAY_NAMES.map(d=>(
                <div key={d} className="py-2 text-center text-[10px] font-bold text-gray-400 uppercase">
                  {d}
                </div>
              ))}
            </div>

            {/* Günler */}
            <div className="grid grid-cols-7">
              {/* Boş hücreler (ay başı) */}
              {Array.from({length:startDow}).map((_,i)=>(
                <div key={`empty-${i}`} className="min-h-16 border-r border-b border-gray-50"/>
              ))}

              {Array.from({length:daysInMonth}).map((_,i)=>{
                const day = i+1
                const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
                const plan = planMap[dateStr]
                const status = getDayStatus(dateStr)
                const isTd = dateStr===todayStr
                const isPst = dateStr<todayStr
                const col = (startDow+i)%7

                return (
                  <div key={day}
                    onClick={()=>setSelDate(dateStr)}
                    className={cn(
                      'min-h-16 p-1.5 border-r border-b border-gray-50 cursor-pointer transition-all hover:bg-green-50/50 relative',
                      isTd ? 'bg-green-50' : '',
                      col===6 ? 'border-r-0' : ''
                    )}>
                    {/* Gün sayısı */}
                    <div className={cn(
                      'w-7 h-7 flex items-center justify-center text-sm font-bold rounded-full mb-1 transition-all',
                      isTd ? 'bg-[#1B4332] text-white' : isPst ? 'text-gray-400' : 'text-gray-700 hover:bg-gray-100'
                    )}>
                      {day}
                    </div>

                    {/* Durum göstergesi */}
                    {status!=='empty' && (
                      <div className="space-y-0.5">
                        <div className={cn('flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold',
                          status==='sent'?'bg-green-100 text-green-700':
                          status==='published'?'bg-blue-100 text-blue-700':
                          'bg-gray-100 text-gray-500')}>
                          <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', STATUS_DOT[status])}/>
                          {status==='sent'?'WA Gönderildi':status==='published'?'Yayında':'Taslak'}
                        </div>
                        {plan?.participantCount ? (
                          <div className="text-[9px] text-gray-400 px-1">👥 {plan.participantCount}</div>
                        ) : null}
                      </div>
                    )}

                    {/* Bugün işareti */}
                    {isTd && !plan && (
                      <div className="text-[9px] text-green-600 font-bold px-1">Bugün</div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div className="px-5 py-3 border-t border-gray-100 flex gap-4 flex-wrap">
              {[
                ['bg-green-400','WA Gönderildi'],
                ['bg-blue-400','Yayında'],
                ['bg-gray-300','Taslak'],
                ['bg-[#1B4332]','Bugün'],
              ].map(([c,l])=>(
                <div key={l} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <div className={`w-3 h-3 rounded-full ${c}`}/>
                  {l}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── HAFTALIK ── */}
        {view==='hafta' && (
          <div className="space-y-2">
            <div className="text-xs font-bold text-gray-500 uppercase px-1 mb-3">
              Bu Hafta — {new Date(weekDays[0]).toLocaleDateString('tr-TR',{day:'numeric',month:'long'})} – {new Date(weekDays[6]).toLocaleDateString('tr-TR',{day:'numeric',month:'long'})}
            </div>
            {weekDays.map(dateStr=>{
              const plan = planMap[dateStr]
              const status = getDayStatus(dateStr)
              const isTd = dateStr===todayStr
              const isPst = dateStr<todayStr
              const d = new Date(dateStr)
              return (
                <div key={dateStr}
                  onClick={()=>setSelDate(dateStr)}
                  className={cn(
                    'bg-white rounded-xl shadow-sm p-4 cursor-pointer hover:shadow-md transition-all border-2',
                    isTd ? 'border-[#1B4332]' :
                    status==='sent' ? 'border-green-300' :
                    status==='published' ? 'border-blue-300' :
                    'border-gray-100'
                  )}>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0',
                      isTd ? 'bg-[#1B4332] text-white' : isPst ? 'bg-gray-100 text-gray-400' : 'bg-gray-50 text-gray-700'
                    )}>
                      <div className="text-[10px] font-bold uppercase">{DAY_NAMES[(d.getDay()+6)%7]}</div>
                      <div className="text-xl font-extrabold leading-tight">{d.getDate()}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      {plan ? (
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full',
                              status==='sent'?'bg-green-100 text-green-700':
                              status==='published'?'bg-blue-100 text-blue-700':
                              'bg-gray-100 text-gray-500')}>
                              {status==='sent'?'✅ WA Gönderildi':status==='published'?'📅 Yayında':'✏️ Taslak'}
                            </span>
                            {plan.password && <span className="text-[10px] text-gray-400">🔑 {plan.password}</span>}
                            {plan.waSentAt && <span className="text-[10px] text-gray-400">⏰ {plan.waSentAt}</span>}
                          </div>
                          <div className="text-xs text-gray-500">
                            {plan.questionIds.length} soru seçili
                            {plan.participantCount ? ` · ${plan.participantCount} katılımcı` : ''}
                            {plan.topFamily ? ` · 🏆 ${plan.topFamily}` : ''}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-sm font-semibold text-gray-400">
                            {isPst ? 'Oyun oynamadı' : 'Henüz planlanmadı'}
                          </div>
                          {!isPst && <div className="text-xs text-green-600 mt-0.5">+ Tıkla, günü planla</div>}
                        </div>
                      )}
                    </div>
                    <div className="text-gray-300 text-lg flex-shrink-0">›</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Alt bilgi */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-500 space-y-1">
          <div>💡 <strong>Güne tıkla</strong> → şifre gir → 3 soru seç → Yayınla</div>
          <div>📱 <strong>WA Gönder</strong> sekmesinden tüm velilere link gönder</div>
          <div>⏰ Saat 20:00'de otomatik hatırlatma — 23:00'te kapanış</div>
        </div>
      </div>

      {/* Gün Detay Modal */}
      {selDate && (
        <DayModal
          date={selDate}
          plan={planMap[selDate]}
          questions={DEMO_QUESTIONS}
          parentQuestions={DEMO_PARENT_QUESTIONS}
          slug={slug}
          onClose={()=>setSelDate(null)}
          onSave={(plan)=>{ savePlan(plan); setSelDate(null) }}
        />
      )}
    </AdminLayout>
  )
}
