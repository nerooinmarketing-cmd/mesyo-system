import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui'
import { DEMO_STUDENTS, DEMO_CLASSROOMS, DEMO_TEACHERS } from '@/lib/demo-data'
import { calcAge, waLink, todayISO } from '@/lib/utils'
import { cn } from '@/lib/utils'

// Demo devamsızlık verisi
const DEMO_ATT: Record<string, Record<string,'present'|'absent'>> = {
  [todayISO()]: { s1:'present', s2:'absent', s3:'present', s8:'absent' },
  '2026-06-13': { s1:'absent', s3:'absent', s5:'absent' },
  '2026-06-12': { s2:'absent', s7:'absent' },
  '2026-06-11': { s1:'present', s2:'present' },
  '2026-06-10': { s3:'absent', s4:'present' },
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const registrationLink = `${window.location.origin}/kayit/${user?.institution_slug || ''}`
  const today = todayISO()

  const approvedStudents = DEMO_STUDENTS.filter(s => s.status === 'approved')
  const pendingStudents  = DEMO_STUDENTS.filter(s => s.status === 'pending')
  const erkek = approvedStudents.filter(s => s.gender === 'erkek').length
  const kiz   = approvedStudents.filter(s => s.gender === 'kiz').length

  // Yaş dağılımı
  const ageDist: Record<number, number> = {}
  approvedStudents.forEach(s => {
    const a = calcAge(s.birth_date)
    ageDist[a] = (ageDist[a] || 0) + 1
  })

  // Bugün devamsızlar
  const todayAtt = DEMO_ATT[today] || {}
  const todayAbsents = approvedStudents.filter(s => todayAtt[s.id] === 'absent')
  const todayPresents = approvedStudents.filter(s => todayAtt[s.id] === 'present')
  const notMarked = approvedStudents.filter(s => !todayAtt[s.id])

  // Son 3 gün devamsızlık — 3+ gün üst üste
  const habitual = approvedStudents.filter(s => {
    const dates = Object.keys(DEMO_ATT).sort((a,b)=>b.localeCompare(a)).slice(0,5)
    const absCount = dates.filter(d => DEMO_ATT[d]?.[s.id] === 'absent').length
    return absCount >= 2
  })

  // Sınıf doluluk
  const classStats = DEMO_CLASSROOMS.map(c => {
    const sts = approvedStudents.filter(s => s.classroom_id === c.id)
    return { ...c, count: sts.length, fill: Math.round(sts.length / c.capacity * 100) }
  })

  // Yaklaşan bakım (assets)
  const maintenanceDue = 2 // demo

  return (
    <AdminLayout pendingCount={pendingStudents.length}>
      <div className="space-y-5">

        {/* Karşılama */}
        <div className="bg-[#1B4332] rounded-2xl p-5 flex items-center justify-between">
          <div>
            <div className="text-white/60 text-xs font-semibold uppercase tracking-widest">Hoş geldiniz</div>
            <div className="text-white font-bold text-xl mt-0.5">{user?.full_name || 'Yönetici'}</div>
            <div className="text-white/50 text-xs mt-1">{new Date().toLocaleDateString('tr-TR', {weekday:'long', day:'numeric', month:'long', year:'numeric'})}</div>
          </div>
          <div className="text-4xl">📚</div>
        </div>

        {/* Veli kayıt linki — hızlı kopyala */}
        <div className="bg-white rounded-xl shadow-sm px-4 py-3 flex items-center gap-3 flex-wrap">
          <span className="text-lg flex-shrink-0">📋</span>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-gray-500">Veli Kayıt Linki — velilere gönderin</div>
            <div className="text-xs font-mono text-gray-700 truncate">{registrationLink}</div>
          </div>
          <button onClick={()=>{navigator.clipboard.writeText(registrationLink);toast('Link kopyalandı 📋','success')}}
            className="px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-lg hover:bg-green-100 transition-colors flex-shrink-0">
            Kopyala
          </button>
        </div>

        {/* Ana istatistikler */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {label:'Toplam Öğrenci', value:approvedStudents.length, sub:`${erkek} erkek · ${kiz} kız`, color:'border-[#1B4332]',  icon:'👥', path:'/admin/students'},
            {label:'Bekleyen Başvuru', value:pendingStudents.length, sub:'Onay bekliyor',               color:'border-amber-400',  icon:'📋', path:'/admin/registrations'},
            {label:'Sınıf Sayısı',   value:DEMO_CLASSROOMS.length,  sub:`${DEMO_TEACHERS.length} öğretmen`, color:'border-blue-400', icon:'🏫', path:'/admin/classrooms'},
            {label:'Bugün Devamsız', value:todayAbsents.length,      sub:`${notMarked.length} işaretlenmedi`, color:'border-red-400', icon:'❌', path:'/admin/attendance'},
          ].map(s=>(
            <button key={s.label} onClick={()=>navigate(s.path)}
              className={`bg-white rounded-xl shadow-sm p-4 border-t-[3px] text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${s.color}`}>
              <div className="flex items-start justify-between mb-2">
                <span className="text-2xl">{s.icon}</span>
                <span className="text-2xl font-extrabold text-gray-900">{s.value}</span>
              </div>
              <div className="text-xs font-bold text-gray-600">{s.label}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{s.sub}</div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Bugünkü durum */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="text-sm font-bold text-gray-900">📅 Bugünkü Durum</div>
              <button onClick={()=>navigate('/admin/attendance')}
                className="text-xs text-green-600 font-semibold hover:underline">Yoklamaya Git →</button>
            </div>
            <div className="grid grid-cols-3 divide-x divide-gray-50">
              {[
                {l:'Geldi', v:todayPresents.length, c:'text-green-600', bg:'bg-green-50'},
                {l:'Gelmedi', v:todayAbsents.length, c:'text-red-500', bg:'bg-red-50'},
                {l:'Belirsiz', v:notMarked.length, c:'text-amber-500', bg:'bg-amber-50'},
              ].map(s=>(
                <div key={s.l} className={`p-4 text-center ${s.bg}`}>
                  <div className={`text-2xl font-extrabold ${s.c}`}>{s.v}</div>
                  <div className="text-xs text-gray-500 font-semibold mt-0.5">{s.l}</div>
                </div>
              ))}
            </div>
            {todayAbsents.length > 0 && (
              <div className="px-4 pb-3 pt-2">
                <div className="text-xs font-semibold text-gray-400 mb-2">Bugün gelmeyenler:</div>
                <div className="flex flex-wrap gap-1.5">
                  {todayAbsents.slice(0, 8).map(s => (
                    <span key={s.id} className="text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full font-semibold">
                      {(s.first_name + ' ' + s.last_name).split(' ')[0]}
                    </span>
                  ))}
                  {todayAbsents.length > 8 && (
                    <span className="text-xs text-gray-400">+{todayAbsents.length - 8} daha</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sınıf doluluk */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="text-sm font-bold text-gray-900">🏫 Sınıf Doluluk</div>
              <button onClick={()=>navigate('/admin/classrooms')}
                className="text-xs text-green-600 font-semibold hover:underline">Yönet →</button>
            </div>
            <div className="p-4 space-y-3">
              {classStats.map(c => (
                <div key={c.id}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-gray-700">{c.name}</span>
                    <span className={`font-bold ${c.fill > 80 ? 'text-red-500' : c.fill > 60 ? 'text-amber-500' : 'text-green-600'}`}>
                      {c.count}/{c.capacity}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all', c.fill > 80 ? 'bg-red-400' : c.fill > 60 ? 'bg-amber-400' : 'bg-green-400')}
                      style={{width: `${Math.min(c.fill, 100)}%`}}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Kronik devamsızlar */}
          {habitual.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div className="text-sm font-bold text-gray-900">⚠️ Dikkat — Devamsız Öğrenciler</div>
                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">{habitual.length} kişi</span>
              </div>
              {habitual.slice(0, 5).map(s => {
                const cls = DEMO_CLASSROOMS.find(c => c.id === s.classroom_id)
                const msg = `Sayın ${(s.parent_first_name + ' ' + s.parent_last_name)} 👋\n\n${(s.first_name + ' ' + s.last_name)} adlı öğrenciniz son günlerde derse devam etmemektedir.\n\nEndişelendiğimizi belirtmek istedik. Bir sıkıntı varsa bizimle paylaşabilirsiniz 🌿\nMesyo Eğitim`
                return (
                  <div key={s.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 last:border-0">
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0',
                      s.gender === 'erkek' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700')}>
                      {(s.first_name + ' ' + s.last_name).charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">{(s.first_name + ' ' + s.last_name)}</div>
                      <div className="text-xs text-gray-400">{cls?.name} · {(s.parent_first_name + ' ' + s.parent_last_name)}</div>
                    </div>
                    <a href={waLink(s.parent_phone, msg)} target="_blank" rel="noreferrer"
                      className="px-2.5 py-1.5 bg-[#25D366] text-white text-xs font-semibold rounded-lg flex-shrink-0">📱</a>
                  </div>
                )
              })}
            </div>
          )}

          {/* Hızlı işlemler */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-sm font-bold text-gray-900 mb-3">⚡ Hızlı İşlemler</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                {label:'Öğrenci Ekle',      icon:'👤', path:'/admin/students',      color:'bg-green-50 hover:bg-green-100 text-green-700 border-green-200'},
                {label:'Yoklama Al',         icon:'✅', path:'/admin/attendance',    color:'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'},
                {label:'Duyuru Gönder',      icon:'📢', path:'/admin/announcements', color:'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'},
                {label:'Gelişim Raporu',     icon:'📈', path:'/admin/progress',      color:'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'},
                {label:'Başvuruları Gör',    icon:'📋', path:'/admin/registrations', color:'bg-red-50 hover:bg-red-100 text-red-600 border-red-200'},
                {label:'Demirbaş Ekle',      icon:'📦', path:'/admin/assets',        color:'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'},
                {label:'Ön Muhasebe',        icon:'💰', path:'/admin/accounting',    color:'bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200'},
                {label:'Oyun Yönetimi',      icon:'🎮', path:'/admin/game',          color:'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'},
              ].map(item => (
                <button key={item.label} onClick={() => navigate(item.path)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all text-left ${item.color}`}>
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Yaş dağılımı */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 text-sm font-bold text-gray-900">📊 Yaş Dağılımı</div>
          <div className="p-4">
            <div className="flex items-end gap-2 h-24">
              {Array.from({length: 8}, (_, i) => i + 7).map(age => {
                const count = ageDist[age] || 0
                const max = Math.max(...Object.values(ageDist), 1)
                const pct = Math.round(count / max * 100)
                return (
                  <div key={age} className="flex-1 flex flex-col items-center gap-1">
                    <div className="text-[10px] font-bold text-gray-600">{count > 0 ? count : ''}</div>
                    <div className="w-full bg-gray-100 rounded-t-lg overflow-hidden flex items-end" style={{height: '60px'}}>
                      <div className={cn('w-full rounded-t-lg transition-all', count > 0 ? 'bg-[#1B4332]' : 'bg-transparent')}
                        style={{height: `${pct}%`}}/>
                    </div>
                    <div className="text-[10px] text-gray-400">{age}</div>
                  </div>
                )
              })}
            </div>
            <div className="text-center text-xs text-gray-400 mt-1">Yaş (yıl)</div>
          </div>
        </div>

      </div>
    </AdminLayout>
  )
}
