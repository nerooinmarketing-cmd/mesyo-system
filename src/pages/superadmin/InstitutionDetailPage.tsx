import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { SuperadminLayout } from '@/components/layout/SuperadminLayout'
import { cn } from '@/lib/utils'
import type { Institution } from '@/types'

const DEMO_INSTS: Record<string, Institution> = {
  i1: { id:'i1', slug:'karacihan', name:'Karacihan Mescidi', city:'Konya', district:'Karatay', responsible_name:'Ahmet Yıldız', responsible_phone:'05321111111', email:'ahmet@gmail.com', is_active:true, subscription_status:'active', subscription_expires_at:'2027-01-01', student_limit:150, created_at:'2025-09-01', student_count:47, teacher_count:3 },
  i2: { id:'i2', slug:'fatih', name:'Fatih Camii', city:'Konya', district:'Selçuklu', responsible_name:'Mehmet Kaya', responsible_phone:'05322222222', is_active:true, subscription_status:'trial', trial_ends_at:'2026-07-01', student_limit:100, created_at:'2026-04-01', student_count:23, teacher_count:2 },
  i3: { id:'i3', slug:'merkez', name:'Merkez Camii', city:'Konya', district:'Meram', responsible_name:'Ali Demir', responsible_phone:'05323333333', is_active:false, subscription_status:'expired', student_limit:200, created_at:'2025-01-01', student_count:0, teacher_count:0 },
}

type Tab = 'genel' | 'abonelik' | 'moduller' | 'ogrenciler' | 'ogretmenler' | 'ayarlar'

const SUB_PLANS = [
  { id:'trial', label:'Deneme (Ücretsiz)', days:30 },
  { id:'basic', label:'Temel — Yıllık 1.500₺', months:12 },
  { id:'pro', label:'Pro — Yıllık 3.000₺', months:12 },
]

export default function InstitutionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const inst = DEMO_INSTS[id || ''] || Object.values(DEMO_INSTS)[0]
  const [tab, setTab] = useState<Tab>('genel')
  const [isActive, setIsActive] = useState(inst.is_active)
  const [subStatus, setSubStatus] = useState(inst.subscription_status)
  const [subExpiry, setSubExpiry] = useState(inst.subscription_expires_at || '')
  const [studentLimit, setStudentLimit] = useState(inst.student_limit)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const save = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const TABS: [Tab, string][] = [['genel','Genel'], ['abonelik','Abonelik'], ['moduller','🔧 Modüller'], ['ogrenciler','Öğrenciler'], ['ogretmenler','Öğretmenler'], ['ayarlar','Ayarlar']]

  return (
    <SuperadminLayout>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4 text-sm">
        <button onClick={() => navigate('/superadmin')} className="text-gray-400 hover:text-gray-600">Kurumlar</button>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900 font-semibold">{inst.name}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-4 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xl font-extrabold text-gray-900">{inst.name}</div>
          <div className="text-sm text-gray-400 font-mono mt-0.5">{inst.slug}.mesyosoft.com.tr</div>
          <div className="flex gap-2 mt-2 flex-wrap">
            <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${isActive?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>
              {isActive ? '✅ Aktif' : '⛔ Pasif'}
            </span>
            <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${subStatus==='active'?'bg-green-100 text-green-700':subStatus==='trial'?'bg-blue-100 text-blue-700':'bg-red-100 text-red-500'}`}>
              {subStatus==='active'?'Abonelik Aktif':subStatus==='trial'?'Deneme Sürümü':'Süresi Doldu'}
            </span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => window.open(`https://${inst.slug}.mesyosoft.com.tr`, '_blank')}
            className="px-4 py-2 bg-green-50 border border-green-200 text-green-700 text-sm font-bold rounded-lg hover:bg-green-100">
            Paneli Aç ↗
          </button>
          <button onClick={() => {/* impersonate */}}
            className="px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-bold rounded-lg hover:bg-amber-100">
            👤 Yönetici Olarak Gir
          </button>
          <button onClick={() => { setIsActive(a => !a) }}
            className={`px-4 py-2 text-white text-sm font-bold rounded-lg ${isActive?'bg-red-500 hover:bg-red-600':'bg-green-500 hover:bg-green-600'}`}>
            {isActive ? '⛔ Pasif Yap' : '✅ Aktif Et'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-4 overflow-x-auto">
        {TABS.map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('flex-1 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap px-2', tab===t?'bg-white text-gray-900 shadow-sm':'text-gray-400')}>
            {l}
          </button>
        ))}
      </div>

      {/* GENEL */}
      {tab === 'genel' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-sm font-bold text-gray-900 mb-4">📋 Kurum Bilgileri</div>
            <div className="space-y-0">
              {[
                ['Kurum Adı', inst.name],
                ['Subdomain', `${inst.slug}.mesyosoft.com.tr`],
                ['Şehir', `${inst.city} / ${inst.district}`],
                ['Adres', inst.address || '—'],
                ['Sorumlu', inst.responsible_name],
                ['Telefon', inst.responsible_phone],
                ['E-posta', inst.email || '—'],
                ['Kayıt Tarihi', inst.created_at],
              ].map(([l,v]) => (
                <div key={l} className="flex py-2 border-b border-gray-50 last:border-0">
                  <span className="text-xs font-semibold text-gray-400 w-28 flex-shrink-0 pt-0.5">{l}</span>
                  <span className="text-sm text-gray-700 font-mono text-xs">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {/* İstatistikler */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="text-sm font-bold text-gray-900 mb-3">📊 İstatistikler</div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { l:'Öğrenci', v:inst.student_count||0, t:`/${inst.student_limit} limit` },
                  { l:'Öğretmen', v:inst.teacher_count||0 },
                ].map(s => (
                  <div key={s.l} className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-extrabold text-gray-900">{s.v}</div>
                    <div className="text-xs font-semibold text-gray-500 mt-0.5">{s.l}</div>
                    {s.t && <div className="text-[10px] text-gray-400">{s.t}</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Hızlı işlemler */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="text-sm font-bold text-gray-900 mb-3">⚡ Hızlı İşlemler</div>
              <div className="space-y-2">
                <button className="w-full py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 text-left px-3">
                  🔑 Admin Şifresini Sıfırla
                </button>
                <button className="w-full py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 text-left px-3">
                  📧 Aktivasyon Maili Gönder
                </button>
                <button className="w-full py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 text-left px-3">
                  📊 Excel Rapor İndir
                </button>
                <button className="w-full py-2.5 border border-red-100 text-red-500 text-sm font-semibold rounded-lg hover:bg-red-50 text-left px-3">
                  🗑️ Kurumu Sil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABONELİK */}
      {tab === 'abonelik' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-sm font-bold text-gray-900 mb-4">💳 Abonelik Yönetimi</div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Abonelik Durumu</label>
              <select value={subStatus} onChange={e => setSubStatus(e.target.value as any)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500">
                <option value="trial">🔵 Deneme</option>
                <option value="active">✅ Aktif</option>
                <option value="expired">⚠️ Süresi Doldu</option>
                <option value="cancelled">❌ İptal</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Bitiş Tarihi</label>
              <input type="date" value={subExpiry} onChange={e => setSubExpiry(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
            </div>

            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Öğrenci Limiti</label>
              <input type="number" value={studentLimit} onChange={e => setStudentLimit(+e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
            </div>

            <button onClick={save} disabled={saving}
              className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg text-sm disabled:opacity-50 transition-colors">
              {saving ? '⏳ Kaydediliyor...' : saved ? '✅ Kaydedildi!' : 'Değişiklikleri Kaydet'}
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-sm font-bold text-gray-900 mb-4">📦 Hızlı Paket Uygula</div>
            <div className="space-y-2">
              {SUB_PLANS.map(p => (
                <button key={p.id} onClick={() => {
                  setSubStatus(p.id === 'trial' ? 'trial' : 'active')
                  const d = new Date()
                  if (p.days) d.setDate(d.getDate() + p.days)
                  if (p.months) d.setMonth(d.getMonth() + p.months)
                  setSubExpiry(d.toISOString().split('T')[0])
                }}
                  className="w-full py-3 border-2 border-gray-200 hover:border-green-400 text-gray-700 text-sm font-semibold rounded-xl text-left px-4 transition-all hover:bg-green-50">
                  {p.label}
                </button>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="text-xs font-semibold text-gray-400 uppercase mb-2">Ödeme Notu</div>
              <textarea placeholder="Ödeme bilgisi, notlar..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500 resize-none min-h-16" />
            </div>
          </div>
        </div>
      )}

      {/* ÖĞRENCİLER */}
      {tab === 'ogrenciler' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="text-sm font-bold text-gray-900">Öğrenciler</div>
            <span className="text-xs text-gray-400">{inst.student_count || 0} kayıt</span>
          </div>
          <div className="text-center py-12 text-gray-400">
            <div className="text-3xl mb-2">👥</div>
            <p className="text-sm">API bağlantısı yapılınca öğrenciler burada görünecek</p>
          </div>
        </div>
      )}

      {/* ÖĞRETMENLer */}
      {tab === 'ogretmenler' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="text-sm font-bold text-gray-900">Öğretmenler</div>
            <span className="text-xs text-gray-400">{inst.teacher_count || 0} öğretmen</span>
          </div>
          <div className="text-center py-12 text-gray-400">
            <div className="text-3xl mb-2">👨‍🏫</div>
            <p className="text-sm">API bağlantısı yapılınca öğretmenler burada görünecek</p>
          </div>
        </div>
      )}


      {/* MODÜLLER */}
      {tab === 'moduller' && (
        <div className="bg-white rounded-xl shadow-sm p-6 text-center">
          <div className="text-4xl mb-3">🔧</div>
          <div className="text-lg font-bold text-gray-900 mb-2">Modül Yönetimi</div>
          <p className="text-sm text-gray-500 mb-5 max-w-md mx-auto">
            Bu kurum için hangi modüllerin aktif olacağını buradan ayarlayın.
            Aktif olmayan modüller kurumun panelinde görünmez.
          </p>
          <button onClick={() => navigate(`/superadmin/institutions/${inst.id}/modules`)}
            className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl text-sm transition-colors">
            🔧 Modülleri Yönet
          </button>
        </div>
      )}

      {/* AYARLAR */}
      {tab === 'ayarlar' && (
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="text-sm font-bold text-gray-900 mb-4">⚙️ Kurum Ayarları</div>
          <div className="space-y-3 max-w-lg">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Kurum Adı</label>
              <input defaultValue={inst.name} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Şehir</label>
                <input defaultValue={inst.city} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">İlçe</label>
                <input defaultValue={inst.district} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Sorumlu Adı</label>
              <input defaultValue={inst.responsible_name} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Sorumlu Telefon</label>
              <input defaultValue={inst.responsible_phone} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
            </div>
            <button onClick={save}
              className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg text-sm transition-colors">
              {saved ? '✅ Kaydedildi!' : 'Kaydet'}
            </button>
          </div>
        </div>
      )}
    </SuperadminLayout>
  )
}
