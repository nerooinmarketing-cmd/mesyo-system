import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { DEMO_LEADERBOARD } from '@/lib/game'
import type { LeaderboardEntry } from '@/lib/game'
import { cn } from '@/lib/utils'

type View = 'bireysel' | 'sinif' | 'kahraman'

export default function ScorePage() {
  const { slug } = useParams<{ slug: string }>()
  const [view, setView] = useState<View>('bireysel')
  const board = DEMO_LEADERBOARD
  const today = new Date().toLocaleDateString('tr-TR', { day:'numeric', month:'long', year:'numeric' })

  // Sınıf ligi hesapla
  const classMap: Record<string, { name: string; total: number; count: number }> = {}
  board.forEach((e: LeaderboardEntry) => {
    if (!classMap[e.className]) classMap[e.className] = { name: e.className, total: 0, count: 0 }
    classMap[e.className].total += e.weeklyScore
    classMap[e.className].count++
  })
  const classRanks = Object.values(classMap)
    .map(c => ({ ...c, avg: Math.round(c.total / c.count) }))
    .sort((a, b) => b.avg - a.avg)

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#1B4332] px-4 pt-6 pb-5">
        <div className="max-w-lg mx-auto text-center">
          <div className="text-2xl mb-1">🏆</div>
          <div className="text-white font-bold text-lg">Kubbeler Yarışıyor</div>
          <div className="text-white/50 text-xs mt-0.5">Canlı Puan Tablosu · {today}</div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Tabs */}
        <div className="flex bg-white rounded-xl shadow-sm p-1 mb-4 gap-0.5">
          {([['bireysel','👨‍👩‍👧 Aileler'],['sinif','🏫 Sınıflar'],['kahraman','⭐ Kahraman']] as const).map(([v,l])=>(
            <button key={v} onClick={() => setView(v)}
              className={cn('flex-1 py-2 text-xs font-semibold rounded-lg transition-all', view===v?'bg-[#1B4332] text-white shadow-sm':'text-gray-400')}>
              {l}
            </button>
          ))}
        </div>

        {/* BİREYSEL LİG */}
        {view === 'bireysel' && (
          <div className="space-y-2.5">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 px-1">Haftalık Puan Sıralaması</div>
            {board.map((e, i) => (
              <div key={i} className={cn('bg-white rounded-xl shadow-sm p-4 flex items-center gap-3',
                i === 0 ? 'border-2 border-amber-300' : 'border border-gray-100')}>
                <div className={cn('w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-base flex-shrink-0',
                  i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-400')}>
                  {i < 3 ? medals[i] : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-gray-900">{e.studentName}</span>
                    {e.badge && <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold">{e.badge}</span>}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{e.parentName} · {e.className}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-extrabold text-gray-900">{e.weeklyScore.toLocaleString('tr-TR')}</div>
                  <div className="text-[10px] text-gray-400">Bu hafta</div>
                  {e.playedToday && (
                    <div className="text-[10px] text-green-600 font-semibold">+{e.todayScore} bugün</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SINIF LİGİ */}
        {view === 'sinif' && (
          <div className="space-y-2.5">
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 mb-3">
              <p className="text-xs text-blue-700">Sınıf puanı = Toplam puan ÷ Sınıf mevcudu. Küçük sınıflar dezavantajda kalmaz.</p>
            </div>
            {classRanks.map((c, i) => (
              <div key={c.name} className={cn('bg-white rounded-xl shadow-sm p-4 flex items-center gap-3',
                i === 0 ? 'border-2 border-amber-300' : 'border border-gray-100')}>
                <div className={cn('w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-base flex-shrink-0',
                  i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-100 text-gray-600' : 'bg-orange-100 text-orange-700')}>
                  {i < 3 ? medals[i] : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-gray-900">{c.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{c.count} aile katılıyor</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-extrabold text-gray-900">{c.avg.toLocaleString('tr-TR')}</div>
                  <div className="text-[10px] text-gray-400">Ortalama puan</div>
                  <div className="text-[10px] text-gray-400">{c.total.toLocaleString('tr-TR')} toplam</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* GÜNÜN KAHRAMANI */}
        {view === 'kahraman' && (
          <div className="space-y-3">
            {/* Bugünün birincisi */}
            <div className="bg-white rounded-2xl shadow-sm p-5 text-center border-2 border-amber-300">
              <div className="text-4xl mb-2">⭐</div>
              <div className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-2">Günün Kaşifi</div>
              <div className="text-xl font-extrabold text-gray-900 mb-0.5">{board[0].studentName}</div>
              <div className="text-sm text-gray-500 mb-2">{board[0].parentName} · {board[0].className}</div>
              <div className="text-3xl font-extrabold text-amber-500">{board[0].todayScore}</div>
              <div className="text-xs text-gray-400 mt-0.5">Bugünkü puan</div>
              <div className="mt-3 flex justify-center">
                <span className="bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-full text-xs font-bold">🥇 Günün Kaşifi Rozeti</span>
              </div>
            </div>

            {/* Günlük top 5 */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 text-sm font-bold text-gray-900">Bugünün Sıralaması</div>
              {board.filter(e => e.playedToday).slice(0,5).map((e,i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 last:border-0">
                  <span className="text-base w-6 flex-shrink-0">{i < 3 ? medals[i] : (i+1)+'.'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{e.studentName}</div>
                    <div className="text-xs text-gray-400">{e.className}</div>
                  </div>
                  <div className="text-base font-extrabold text-green-600">+{e.todayScore}</div>
                </div>
              ))}
            </div>

            {/* Yarın mesajı */}
            <div className="bg-[#1B4332] rounded-xl p-4 text-center">
              <p className="text-white font-bold mb-1">Yarın sen birinci olabilirsin!</p>
              <p className="text-white/60 text-xs">Camiye gel, şifreyi öğren, akşam ailenle oyna.</p>
            </div>
          </div>
        )}

        {/* Oyun linki */}
        <div className="mt-5 text-center">
          <a href={`/oyun/${slug}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl text-sm hover:bg-gray-50 transition-colors shadow-sm">
            🎮 Yarışmaya Katıl
          </a>
        </div>
        <p className="text-center text-xs text-gray-400 mt-4">Mesyo Soft · Kubbeler Yarışıyor · {today}</p>
      </div>
    </div>
  )
}
