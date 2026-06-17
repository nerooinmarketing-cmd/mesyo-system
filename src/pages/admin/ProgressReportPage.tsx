import { useState } from 'react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Button, useToast } from '@/components/ui'
import { DEMO_STUDENTS, DEMO_CLASSROOMS } from '@/lib/demo-data'
import { calcAge, waLink } from '@/lib/utils'

const PERF_LEVELS: Record<string, {label:string;icon:string;score:number}> = {
  mukemmel:  {label:'Mükemmel', icon:'🟢', score:100},
  iyi:       {label:'İyi',      icon:'🔵', score:75},
  orta:      {label:'Orta',     icon:'🟡', score:50},
  baslangic: {label:'Başlangıç',icon:'🔴', score:25},
  baslamadi: {label:'Başlamadı',icon:'⬜', score:0},
}

const DEMO_ATT: Record<string,{present:number;absent:number}> = {
  s1:{present:17,absent:3},s2:{present:20,absent:0},s3:{present:12,absent:5},
  s4:{present:18,absent:2},s5:{present:15,absent:3},s6:{present:19,absent:1},
  s7:{present:10,absent:7},s8:{present:16,absent:4},s9:{present:20,absent:0},
}

const DEMO_PERF: Record<string,string[]> = {
  s1:['mukemmel','iyi','orta','iyi','baslangic'],
  s2:['mukemmel','mukemmel','iyi','iyi','orta'],
  s3:['orta','baslangic','baslamadi','baslangic','baslamadi'],
}

function generateReport(student: any, cls: any, period: string): string {
  const att = DEMO_ATT[student.id] || {present:15,absent:2}
  const total = att.present + att.absent
  const rate = Math.round(att.present / total * 100)
  const perf = DEMO_PERF[student.id] || ['iyi','orta','baslangic','baslangic','baslamadi']
  const avgScore = Math.round(perf.map(p=>PERF_LEVELS[p]?.score||0).reduce((a,b)=>a+b,0)/perf.length)
  
  const attEmoji = rate>=90?'🌟':rate>=75?'✅':rate>=60?'⚠️':'❌'
  const perfEmoji = avgScore>=75?'🌟':avgScore>=50?'✅':avgScore>=25?'⚠️':'❌'
  
  const attComment = rate>=90?'Devam oranı mükemmel, her derste yanımızda!':rate>=75?'Devam oranı iyi, birkaç eksik var.':rate>=60?'Devam oranı orta, daha düzenli olmasını ümit ediyoruz.':'Devam oranı düşük, desteklenmeye ihtiyacı var.'
  const perfComment = avgScore>=75?'Öğrenme performansı çok iyi, sürekli gelişim gösteriyor.':avgScore>=50?'Performans orta düzeyde, çalışmaları artırılabilir.':'Performans henüz gelişim aşamasında, sabır ve destek gerekiyor.'

  return `📚 *${(student.first_name + ' ' + student.last_name)} — Aylık Gelişim Raporu*
📅 ${period} | ${cls?.name || '—'} Sınıfı

━━━━━━━━━━━━━━━━━━━━
✅ *DEVAM DURUMU*
${attEmoji} ${att.present}/${total} gün katıldı (%${rate})
${attComment}

━━━━━━━━━━━━━━━━━━━━
⭐ *ÖĞRENME PERFORMANSI*
${perfEmoji} Genel puan: ${avgScore}/100
🟢 Fatiha Suresi: ${PERF_LEVELS[perf[0]]?.label||'—'}
🔵 Felak Suresi: ${PERF_LEVELS[perf[1]]?.label||'—'}
🟡 Nas Suresi: ${PERF_LEVELS[perf[2]]?.label||'—'}
📖 Kuran Okuma: ${PERF_LEVELS[perf[3]]?.label||'—'}
🤲 Namaz Bilgisi: ${PERF_LEVELS[perf[4]]?.label||'—'}
${perfComment}

━━━━━━━━━━━━━━━━━━━━
💚 Desteğiniz için teşekkür ederiz.

Sevgi ve saygılarımızla 🌿
Mesyo Eğitim`
}

export default function ProgressReportPage() {
  const { toast } = useToast()
  const [selCls, setSelCls] = useState('')
  const [period, setPeriod] = useState(() => {
    const d = new Date(); return `${d.toLocaleString('tr-TR',{month:'long'})} ${d.getFullYear()}`
  })
  const [previewing, setPreviewing] = useState<string|null>(null)
  const [sending, setSending] = useState(false)
  const [sentIdx, setSentIdx] = useState(0)

  const students = selCls ? DEMO_STUDENTS.filter(s=>s.classroom_id===selCls) : DEMO_STUDENTS
  const cls = DEMO_CLASSROOMS.find(c=>c.id===selCls)

  const sendAll = async () => {
    if (!students.length) { toast('Öğrenci bulunamadı','error'); return }
    setSending(true); setSentIdx(0)
    students.forEach((s, i) => {
      const msg = generateReport(s, DEMO_CLASSROOMS.find(c=>c.id===s.classroom_id), period)
      setTimeout(() => {
        window.open(waLink(s.parent_phone, msg), '_blank')
        setSentIdx(i + 1)
      }, i * 900)
    })
    await new Promise(r => setTimeout(r, students.length * 900 + 500))
    setSending(false)
    toast(`📱 ${students.length} veliye gelişim raporu gönderildi!`, 'success')
  }

  const sendOne = (s: any) => {
    const msg = generateReport(s, DEMO_CLASSROOMS.find(c=>c.id===s.classroom_id), period)
    window.open(waLink(s.parent_phone, msg), '_blank')
    toast(`${(s.first_name + ' ' + s.last_name)} için rapor gönderildi 📱`, 'success')
  }

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Ayarlar */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="text-sm font-bold text-gray-900 mb-4">📈 Aylık Gelişim Raporu Gönder</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Dönem</label>
              <input value={period} onChange={e=>setPeriod(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Sınıf</label>
              <select value={selCls} onChange={e=>setSelCls(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500">
                <option value="">Tüm Sınıflar</option>
                {DEMO_CLASSROOMS.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={sendAll} loading={sending} className="w-full justify-center">
                {sending?`📱 ${sentIdx}/${students.length} Gönderiliyor...`:`📱 Hepsine Gönder (${students.length} veli)`}
              </Button>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <p className="text-xs text-blue-700">
              ℹ️ Her veliye çocuğuna özel, kişiselleştirilmiş rapor WhatsApp'tan gönderilir. 
              Devam oranı, öğrenme performansı ve genel değerlendirme içerir.
            </p>
          </div>
        </div>

        {/* Öğrenci listesi */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="text-sm font-bold text-gray-900">Öğrenciler</div>
            <div className="text-xs text-gray-400">{students.length} öğrenci</div>
          </div>
          {students.map(s => {
            const att = DEMO_ATT[s.id] || {present:15,absent:2}
            const total = att.present + att.absent
            const rate = Math.round(att.present/total*100)
            const perf = DEMO_PERF[s.id]||['iyi','orta','baslangic','baslangic','baslamadi']
            const avgScore = Math.round(perf.map(p=>PERF_LEVELS[p]?.score||0).reduce((a,b)=>a+b,0)/perf.length)
            const clsName = DEMO_CLASSROOMS.find(c=>c.id===s.classroom_id)?.name

            return (
              <div key={s.id} className="border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${s.gender==='erkek'?'bg-blue-100 text-blue-700':'bg-pink-100 text-pink-700'}`}>
                    {(s.first_name + ' ' + s.last_name).charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900">{(s.first_name + ' ' + s.last_name)}</div>
                    <div className="text-xs text-gray-400">{clsName} • Veli: {(s.parent_first_name + ' ' + s.parent_last_name)}</div>
                  </div>
                  <div className="flex gap-3 items-center flex-shrink-0">
                    <div className="text-center hidden md:block">
                      <div className={`text-sm font-bold ${rate>=80?'text-green-600':rate>=60?'text-amber-500':'text-red-500'}`}>%{rate}</div>
                      <div className="text-[10px] text-gray-400">Devam</div>
                    </div>
                    <div className="text-center hidden md:block">
                      <div className={`text-sm font-bold ${avgScore>=75?'text-green-600':avgScore>=50?'text-blue-600':avgScore>=25?'text-amber-500':'text-red-500'}`}>{avgScore}</div>
                      <div className="text-[10px] text-gray-400">Perf.</div>
                    </div>
                    <button onClick={() => setPreviewing(previewing===s.id?null:s.id)}
                      className="px-2.5 py-1.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50">
                      👁 Önizle
                    </button>
                    <button onClick={() => sendOne(s)}
                      className="px-2.5 py-1.5 bg-[#25D366] text-white text-xs font-semibold rounded-lg hover:bg-[#128C7E]">
                      📱 Gönder
                    </button>
                  </div>
                </div>
                {/* Önizleme */}
                {previewing===s.id && (
                  <div className="px-4 pb-4">
                    <div className="bg-[#E8FDD8] rounded-xl p-4 text-xs text-gray-800 whitespace-pre-line font-mono">
                      {generateReport(s, DEMO_CLASSROOMS.find(c=>c.id===s.classroom_id), period)}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </AdminLayout>
  )
}
