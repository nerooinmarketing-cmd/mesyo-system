import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { calcAge } from '@/lib/utils'

// Demo veri
const DEMO_CHILD = {
  id:'s1', first_name:'Ahmet', last_name:'Yılmaz', birth_date:'2016-03-10', gender:'erkek',
  classroom:'Sabah Grubu', teacher:'Fatma Öğretmen',
  season:'2026 Yaz Kursu',
  attendance: {
    total: 20, present: 17, absent: 3,
    records: [
      {date:'2026-06-16',status:'present'},{date:'2026-06-13',status:'absent'},
      {date:'2026-06-12',status:'present'},{date:'2026-06-11',status:'present'},
      {date:'2026-06-10',status:'absent'},{date:'2026-06-09',status:'present'},
    ]
  },
  assignments: [
    {id:1, title:'Fatiha Suresi Tekrarı', desc:'Fatiha suresini akıcı okuma çalışması yapılacak', date:'2026-06-14', due:'2026-06-20'},
    {id:2, title:'Namaz Duaları', desc:'Sübhaneke ve Ettehiyyatü dualarını ezberle', date:'2026-06-10', due:'2026-06-16'},
  ],
  performance: [
    {skill:'Fatiha Suresi', level:'mukemmel', icon:'🟢'},
    {skill:'Felak Suresi', level:'iyi', icon:'🔵'},
    {skill:'Nas Suresi', level:'orta', icon:'🟡'},
    {skill:'Kuran Okuma', level:'iyi', icon:'🔵'},
    {skill:'Namaz Bilgisi', level:'baslangic', icon:'🔴'},
  ],
  announcements: [
    {id:1, title:'Yarıyıl Tatili', text:'17-18 Haziran tarihlerinde ders yapılmayacaktır.', date:'2026-06-15'},
    {id:2, title:'Veli Toplantısı', text:'20 Haziran Cumartesi saat 14:00\'de veli toplantısı yapılacaktır.', date:'2026-06-12'},
  ]
}

type Tab = 'ozet' | 'devam' | 'odevler' | 'performans' | 'duyurular'

export default function ParentPortalPage() {
  const { studentId } = useParams<{ studentId: string }>()
  const [tab, setTab] = useState<Tab>('ozet')
  const child = DEMO_CHILD
  const rate = Math.round(child.attendance.present / child.attendance.total * 100)

  const TABS: [Tab, string, string][] = [
    ['ozet','📊 Özet',''],
    ['devam','✅ Devam',''],
    ['odevler','📚 Ödevler',''],
    ['performans','⭐ Gelişim',''],
    ['duyurular','📢 Duyurular',''],
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1B4332] px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto">
          <div className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">📚 Mesyo Soft — Veli Portalı</div>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl flex-shrink-0 ${child.gender==='erkek'?'bg-blue-400/30 text-white':'bg-pink-400/30 text-white'}`}>
              {(child.first_name + ' ' + child.last_name).charAt(0)}
            </div>
            <div>
              <div className="text-white text-xl font-extrabold">{(child.first_name + ' ' + child.last_name)}</div>
              <div className="text-white/60 text-sm mt-0.5">{child.classroom} • {child.teacher}</div>
              <div className="text-white/40 text-xs mt-0.5">{child.season}</div>
            </div>
          </div>
          {/* Özet istatistikler */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              {l:'Devam Oranı', v:`%${rate}`, c:rate>=80?'text-green-300':rate>=60?'text-amber-300':'text-red-300'},
              {l:'Geldi', v:child.attendance.present, c:'text-white'},
              {l:'Gelmedi', v:child.attendance.absent, c:'text-red-300'},
            ].map(s=>(
              <div key={s.l} className="bg-white/10 rounded-xl p-3 text-center">
                <div className={`text-xl font-extrabold ${s.c}`}>{s.v}</div>
                <div className="text-white/50 text-[10px] font-semibold mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-lg mx-auto px-3 -mt-3">
        <div className="flex bg-white rounded-xl shadow-sm p-1 mb-4 overflow-x-auto gap-0.5">
          {TABS.map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)}
              className={`flex-1 py-2 text-[11px] font-semibold rounded-lg transition-all whitespace-nowrap px-1 ${tab===t?'bg-green-500 text-white shadow-sm':'text-gray-400 hover:text-gray-600'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* ÖZET */}
        {tab==='ozet' && (
          <div className="space-y-3">
            {/* Devam özeti */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="text-sm font-bold text-gray-900 mb-3">✅ Bu Haftanın Devamı</div>
              <div className="flex gap-2 flex-wrap">
                {child.attendance.records.slice(0,5).map(r=>(
                  <div key={r.date} className={`flex flex-col items-center px-3 py-2 rounded-xl text-xs font-semibold ${r.status==='present'?'bg-green-50 text-green-700':'bg-red-50 text-red-500'}`}>
                    <span className="text-lg">{r.status==='present'?'✅':'❌'}</span>
                    <span>{new Date(r.date).toLocaleDateString('tr-TR',{weekday:'short'})}</span>
                    <span className="text-[10px] opacity-70">{r.date.slice(5)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Son ödev */}
            {child.assignments[0] && (
              <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-amber-400">
                <div className="text-xs font-bold text-amber-600 uppercase mb-1">📚 Son Ödev</div>
                <div className="text-sm font-bold text-gray-900">{child.assignments[0].title}</div>
                <div className="text-xs text-gray-500 mt-0.5">{child.assignments[0].desc}</div>
                <div className="text-xs text-amber-500 mt-1 font-semibold">
                  ⏰ Teslim: {new Date(child.assignments[0].due).toLocaleDateString('tr-TR')}
                </div>
              </div>
            )}

            {/* Son duyuru */}
            {child.announcements[0] && (
              <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-400">
                <div className="text-xs font-bold text-blue-600 uppercase mb-1">📢 Son Duyuru</div>
                <div className="text-sm font-bold text-gray-900">{child.announcements[0].title}</div>
                <div className="text-xs text-gray-500 mt-0.5">{child.announcements[0].text}</div>
              </div>
            )}

            {/* Performans özeti */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="text-sm font-bold text-gray-900 mb-3">⭐ Öğrenme Durumu</div>
              <div className="space-y-2">
                {child.performance.slice(0,3).map(p=>(
                  <div key={p.skill} className="flex items-center gap-3">
                    <span className="text-base">{p.icon}</span>
                    <span className="text-sm text-gray-700 flex-1">{p.skill}</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      p.level==='mukemmel'?'bg-green-100 text-green-700':
                      p.level==='iyi'?'bg-blue-100 text-blue-700':
                      p.level==='orta'?'bg-amber-100 text-amber-700':'bg-red-100 text-red-600'
                    }`}>{p.level==='mukemmel'?'Mükemmel':p.level==='iyi'?'İyi':p.level==='orta'?'Orta':'Başlangıç'}</span>
                  </div>
                ))}
              </div>
              <button onClick={()=>setTab('performans')} className="text-xs text-green-600 font-semibold mt-3 hover:underline">Tümünü Gör →</button>
            </div>
          </div>
        )}

        {/* DEVAM */}
        {tab==='devam' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="text-sm font-bold text-gray-900">Devam Geçmişi</div>
              <div className="text-xs text-gray-400 mt-0.5">{child.attendance.present} geldi, {child.attendance.absent} gelmedi (Toplam {child.attendance.total} gün)</div>
            </div>
            {/* Progress bar */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex justify-between text-xs text-gray-500 mb-1"><span>Devam Oranı</span><span>%{rate}</span></div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${rate>=80?'bg-green-500':rate>=60?'bg-amber-500':'bg-red-500'}`} style={{width:`${rate}%`}} />
              </div>
            </div>
            {child.attendance.records.map(r=>(
              <div key={r.date} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 last:border-0">
                <span className="text-lg">{r.status==='present'?'✅':'❌'}</span>
                <span className="text-sm text-gray-700 flex-1">{new Date(r.date).toLocaleDateString('tr-TR',{weekday:'long',day:'numeric',month:'long'})}</span>
                <span className={`text-xs font-semibold ${r.status==='present'?'text-green-600':'text-red-500'}`}>
                  {r.status==='present'?'Katıldı':'Katılmadı'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ÖDEVLER */}
        {tab==='odevler' && (
          <div className="space-y-3">
            {child.assignments.map(a=>(
              <div key={a.id} className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-amber-400">
                <div className="text-sm font-bold text-gray-900">{a.title}</div>
                <div className="text-xs text-gray-500 mt-1">{a.desc}</div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-gray-400">Verildi: {new Date(a.date).toLocaleDateString('tr-TR')}</span>
                  <span className="text-xs font-semibold text-amber-600">⏰ Teslim: {new Date(a.due).toLocaleDateString('tr-TR')}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PERFORMANS */}
        {tab==='performans' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 text-sm font-bold text-gray-900">Öğrenme Durumu</div>
            {child.performance.map(p=>(
              <div key={p.skill} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
                <span className="text-xl">{p.icon}</span>
                <span className="text-sm text-gray-700 flex-1">{p.skill}</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  p.level==='mukemmel'?'bg-green-100 text-green-700':
                  p.level==='iyi'?'bg-blue-100 text-blue-700':
                  p.level==='orta'?'bg-amber-100 text-amber-700':'bg-red-100 text-red-600'
                }`}>
                  {p.level==='mukemmel'?'Mükemmel':p.level==='iyi'?'İyi':p.level==='orta'?'Orta':'Başlangıç'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* DUYURULAR */}
        {tab==='duyurular' && (
          <div className="space-y-3">
            {child.announcements.map(a=>(
              <div key={a.id} className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-400">
                <div className="text-sm font-bold text-gray-900">{a.title}</div>
                <div className="text-xs text-gray-500 mt-1">{a.text}</div>
                <div className="text-xs text-gray-400 mt-2">{new Date(a.date).toLocaleDateString('tr-TR')}</div>
              </div>
            ))}
          </div>
        )}

        <div className="py-6 text-center text-xs text-gray-300">Mesyo Soft © 2025</div>
      </div>
    </div>
  )
}
