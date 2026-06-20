import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { waLink } from '@/lib/utils'
import { institutionSettingsApi } from '@/lib/api'

type LogType = 'attendance' | 'assignment' | 'approval' | 'rejection' | 'announcement' | 'invite'

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  attendance:   { label:'Devamsızlık',   color:'bg-red-100 text-red-600',      icon:'❌' },
  assignment:   { label:'Ödev',          color:'bg-amber-100 text-amber-700',   icon:'📚' },
  approval:     { label:'Onay',          color:'bg-green-100 text-green-700',   icon:'✅' },
  rejection:    { label:'Ret',           color:'bg-gray-100 text-gray-600',     icon:'🚫' },
  announcement: { label:'Duyuru',        color:'bg-blue-100 text-blue-700',     icon:'📢' },
  invite:       { label:'Sezon Daveti',  color:'bg-purple-100 text-purple-700', icon:'🌿' },
  devamsizlik:  { label:'Devamsızlık',   color:'bg-red-100 text-red-600',      icon:'❌' },
  odev:         { label:'Ödev',          color:'bg-amber-100 text-amber-700',   icon:'📚' },
  duyuru:       { label:'Duyuru',        color:'bg-blue-100 text-blue-700',     icon:'📢' },
  gelisim_raporu: { label:'Gelişim',     color:'bg-teal-100 text-teal-700',    icon:'📊' },
  oyun_sonuc:   { label:'Oyun',          color:'bg-indigo-100 text-indigo-700', icon:'🎮' },
}

const DEFAULT_CONF = { label: 'Bildirim', color: 'bg-gray-100 text-gray-600', icon: '📬' }

export default function NotificationsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [detail, setDetail] = useState<any|null>(null)

  useEffect(() => {
    institutionSettingsApi.getNotificationLogs()
      .then(setLogs)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = logs.filter(l => {
    const mf = filter === 'all' || l.notification_type === filter
    const q = search.toLowerCase()
    const mq = !q ||
      (l.recipient_name || '').toLowerCase().includes(q) ||
      (l.student_name || '').toLowerCase().includes(q) ||
      (l.sender_name || '').toLowerCase().includes(q) ||
      (l.message_text || '').toLowerCase().includes(q)
    return mf && mq
  })

  const types = [...new Set(logs.map(l => l.notification_type))]

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Özet */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
          {types.map(type => {
            const conf = TYPE_CONFIG[type] || DEFAULT_CONF
            return (
              <button key={type} onClick={() => setFilter(filter === type ? 'all' : type)}
                className={`bg-white rounded-xl shadow-sm p-3 text-center transition-all border-2 ${filter === type ? 'border-green-400' : 'border-transparent hover:border-gray-200'}`}>
                <div className="text-xl mb-1">{conf.icon}</div>
                <div className="text-lg font-extrabold text-gray-900">{logs.filter(l => l.notification_type === type).length}</div>
                <div className="text-[10px] font-semibold text-gray-400">{conf.label}</div>
              </button>
            )
          })}
        </div>

        {/* Filtre + arama */}
        <div className="flex gap-2 flex-wrap items-center">
          <input type="text" placeholder="🔍 Veli, öğrenci, gönderen, mesaj ara..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-40 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500 bg-white" />
          <button onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${filter === 'all' ? 'bg-green-500 text-white border-green-500' : 'border-gray-200 text-gray-500'}`}>
            Tümü ({logs.length})
          </button>
        </div>

        {/* Log listesi */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="text-sm font-bold text-gray-900">Bildirim Geçmişi</div>
            <div className="text-xs text-gray-400">{filtered.length} kayıt</div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-3xl mb-2 animate-pulse">⏳</div>
              <p className="text-sm">Yükleniyor...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              {logs.length === 0 ? 'Henüz bildirim gönderilmedi' : 'Kayıt bulunamadı'}
            </div>
          ) : filtered.map(log => {
            const conf = TYPE_CONFIG[log.notification_type] || DEFAULT_CONF
            const sentAt = log.sent_at ? new Date(log.sent_at).toLocaleString('tr-TR', { day:'2-digit', month:'2-digit', year:'2-digit', hour:'2-digit', minute:'2-digit' }) : '—'
            return (
              <div key={log.id}
                className="flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setDetail(detail?.id === log.id ? null : log)}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${conf.color}`}>{conf.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">{log.recipient_name || '—'}</span>
                    {log.student_name && log.student_name !== '—' && (
                      <span className="text-xs text-gray-400">({log.student_name})</span>
                    )}
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${conf.color}`}>{conf.label}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    👤 {log.sender_name || 'Sistem'} • 🕐 {sentAt}
                  </div>
                  {detail?.id === log.id && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-600 whitespace-pre-line font-mono">{log.message_text}</div>
                      {log.recipient_phone && (
                        <a href={waLink(log.recipient_phone, log.message_text)} target="_blank" rel="noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-[#25D366] text-white text-xs font-semibold rounded-lg">
                          📱 Tekrar Gönder
                        </a>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex-shrink-0">
                  ✓ Gönderildi
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AdminLayout>
  )
}
