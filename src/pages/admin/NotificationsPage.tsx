import { useState } from 'react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Badge } from '@/components/ui'
import { waLink } from '@/lib/utils'

type LogType = 'attendance' | 'assignment' | 'approval' | 'rejection' | 'announcement' | 'invite'

interface NotifLog {
  id: number
  type: LogType
  sender: string     // öğretmen / yönetici
  recipient: string  // veli adı
  student: string
  phone: string
  message: string
  sent_at: string
  status: 'sent' | 'pending' | 'failed'
}

const TYPE_CONFIG: Record<LogType, { label: string; color: string; icon: string }> = {
  attendance:   { label:'Devamsızlık',   color:'bg-red-100 text-red-600',     icon:'❌' },
  assignment:   { label:'Ödev',          color:'bg-amber-100 text-amber-700',  icon:'📚' },
  approval:     { label:'Onay',          color:'bg-green-100 text-green-700',  icon:'✅' },
  rejection:    { label:'Ret',           color:'bg-gray-100 text-gray-600',    icon:'🚫' },
  announcement: { label:'Duyuru',        color:'bg-blue-100 text-blue-700',    icon:'📢' },
  invite:       { label:'Sezon Daveti',  color:'bg-purple-100 text-purple-700',icon:'🌿' },
}

const DEMO_LOGS: NotifLog[] = [
  { id:1, type:'attendance', sender:'Fatma Öğretmen', recipient:'Mehmet Yılmaz', student:'Ahmet Yılmaz', phone:'05321234567', message:'Sayın Mehmet Yılmaz 👋\n\nAhmet Yılmaz bugün eğitim programına katılamadığını fark ettik...', sent_at:'2026-06-16 09:15', status:'sent' },
  { id:2, type:'assignment', sender:'Fatma Öğretmen', recipient:'Ali Kaya', student:'Zeynep Kaya', phone:'05331234567', message:'Sayın Ali Kaya 👋\n\nZeynep Kaya için yeni bir çalışmamız var...', sent_at:'2026-06-16 09:30', status:'sent' },
  { id:3, type:'approval', sender:'Hoca Efendi (Yönetici)', recipient:'Hasan Demir', student:'Mehmet Demir', phone:'05341234567', message:'Sayın Hasan Demir 👋\n\nMehmet Demir için yaptığınız başvuru onaylandı! 🎉', sent_at:'2026-06-15 14:20', status:'sent' },
  { id:4, type:'announcement', sender:'Hoca Efendi (Yönetici)', recipient:'Tüm Veliler', student:'—', phone:'—', message:'Sayın velimiz, 17-18 Haziran tarihlerinde ders yapılmayacaktır.', sent_at:'2026-06-15 11:00', status:'sent' },
  { id:5, type:'attendance', sender:'Fatma Öğretmen', recipient:'Ramazan Koç', student:'Ömer Koç', phone:'05381234567', message:'Sayın Ramazan Koç 👋\n\nÖmer Koç bugün eğitim programına katılamadığını fark ettik...', sent_at:'2026-06-13 09:45', status:'sent' },
  { id:6, type:'rejection', sender:'Hoca Efendi (Yönetici)', recipient:'Veli X', student:'Öğrenci X', phone:'05391234567', message:'Sayın velimiz, başvurunuz maalesef kabul edilememiştir.', sent_at:'2026-06-12 16:00', status:'sent' },
]

export default function NotificationsPage() {
  const [logs] = useState<NotifLog[]>(DEMO_LOGS)
  const [filter, setFilter] = useState<LogType|'all'>('all')
  const [search, setSearch] = useState('')
  const [detail, setDetail] = useState<NotifLog|null>(null)

  const filtered = logs.filter(l => {
    const mf = filter==='all' || l.type===filter
    const q = search.toLowerCase()
    const mq = !q || l.recipient.toLowerCase().includes(q) || l.student.toLowerCase().includes(q) || l.sender.toLowerCase().includes(q)
    return mf && mq
  })

  const counts = Object.fromEntries(
    Object.keys(TYPE_CONFIG).map(t => [t, logs.filter(l=>l.type===t).length])
  )

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Özet */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
          {(Object.entries(TYPE_CONFIG) as [LogType, typeof TYPE_CONFIG[LogType]][]).map(([type, conf]) => (
            <button key={type} onClick={() => setFilter(filter===type?'all':type)}
              className={`bg-white rounded-xl shadow-sm p-3 text-center transition-all border-2 ${filter===type?'border-green-400':'border-transparent hover:border-gray-200'}`}>
              <div className="text-xl mb-1">{conf.icon}</div>
              <div className="text-lg font-extrabold text-gray-900">{counts[type]||0}</div>
              <div className="text-[10px] font-semibold text-gray-400">{conf.label}</div>
            </button>
          ))}
        </div>

        {/* Filtre + arama */}
        <div className="flex gap-2 flex-wrap items-center">
          <input type="text" placeholder="🔍 Veli, öğrenci, gönderen ara..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-40 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500 bg-white" />
          <button onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${filter==='all'?'bg-green-500 text-white border-green-500':'border-gray-200 text-gray-500'}`}>
            Tümü ({logs.length})
          </button>
        </div>

        {/* Log listesi */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="text-sm font-bold text-gray-900">Bildirim Geçmişi</div>
            <div className="text-xs text-gray-400">{filtered.length} kayıt</div>
          </div>
          {filtered.length === 0
            ? <div className="text-center py-12 text-gray-400 text-sm">Kayıt bulunamadı</div>
            : filtered.map(log => {
                const conf = TYPE_CONFIG[log.type]
                return (
                  <div key={log.id}
                    className="flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setDetail(detail?.id===log.id?null:log)}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${conf.color}`}>{conf.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900">{log.recipient}</span>
                        {log.student !== '—' && <span className="text-xs text-gray-400">({log.student})</span>}
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${conf.color}`}>{conf.label}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        👤 {log.sender} • 🕐 {log.sent_at}
                      </div>
                      {detail?.id === log.id && (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                          <div className="text-xs text-gray-600 whitespace-pre-line font-mono">{log.message}</div>
                          {log.phone !== '—' && (
                            <a href={waLink(log.phone, log.message)} target="_blank" rel="noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-[#25D366] text-white text-xs font-semibold rounded-lg">
                              📱 Tekrar Gönder
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${log.status==='sent'?'bg-green-100 text-green-700':'bg-red-100 text-red-500'}`}>
                        {log.status==='sent'?'✓ Gönderildi':'✗ Hata'}
                      </span>
                    </div>
                  </div>
                )
              })
          }
        </div>
      </div>
    </AdminLayout>
  )
}
