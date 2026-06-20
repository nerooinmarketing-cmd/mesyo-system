import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { SuperadminLayout } from '@/components/layout/SuperadminLayout'
import { Alert, useToast } from '@/components/ui'
import { cn } from '@/lib/utils'
import type { Institution } from '@/types'
import { superadminApi, paymentsApi } from '@/lib/api'

type Tab = 'genel' | 'abonelik' | 'moduller' | 'ogrenciler' | 'ogretmenler' | 'ayarlar'

const PAKET_FIYATLARI = {
  giris: { tutar: 3000, kdv: 600, toplam: 3600, label: '🎉 Giriş Bedeli — 3.000 + KDV = 3.600 ₺' },
  yillik: { tutar: 1000, kdv: 200, toplam: 1200, label: '📅 Yıllık Yenileme — 1.000 + KDV = 1.200 ₺' },
}

export default function InstitutionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [inst, setInst] = useState<Institution | null>(null)
  const [students, setStudents] = useState<any[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [studentsLoaded, setStudentsLoaded] = useState(false)
  const [teachersLoaded, setTeachersLoaded] = useState(false)

  const [tab, setTab] = useState<Tab>('genel')
  const [isActive, setIsActive] = useState(false)
  const [subStatus, setSubStatus] = useState('trial')
  const [subExpiry, setSubExpiry] = useState('')
  const [studentLimit, setStudentLimit] = useState(0)
  const [payments, setPayments] = useState<any[]>([])
  const [paymentsLoaded, setPaymentsLoaded] = useState(false)
  const [payModal, setPayModal] = useState(false)
  const [payForm, setPayForm] = useState({ paket: 'giris', tutar: 3600, not: '', markPaid: true })
  const [paying, setPaying] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [cityInput, setCityInput] = useState('')
  const [districtInput, setDistrictInput] = useState('')
  const [respNameInput, setRespNameInput] = useState('')
  const [respPhoneInput, setRespPhoneInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!id) return
    const institutionId = id
    let cancelled = false
    async function load() {
      setLoading(true)
      setLoadError('')
      try {
        const data = await superadminApi.institution(institutionId)
        if (cancelled) return
        setInst(data)
        setIsActive(data.is_active)
        setSubStatus(data.subscription_status)
        setSubExpiry(data.subscription_expires_at || '')
        setStudentLimit(data.student_limit)
        setNameInput(data.name)
        setCityInput(data.city)
        setDistrictInput(data.district)
        setRespNameInput(data.responsible_name)
        setRespPhoneInput(data.responsible_phone)
      } catch (e: any) {
        if (!cancelled) setLoadError(e.message || 'Kurum bilgisi yüklenirken bir hata oluştu')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  // Sekme ilk açıldığında ilgili listeyi çek (gereksiz erken yükleme yapmamak için tembel)
  useEffect(() => {
    if (!id) return
    if (tab === 'ogrenciler' && !studentsLoaded) {
      superadminApi.institutionStudents(id).then(d => { setStudents(d); setStudentsLoaded(true) }).catch(() => setStudentsLoaded(true))
    }
    if (tab === 'ogretmenler' && !teachersLoaded) {
      superadminApi.institutionTeachers(id).then(d => { setTeachers(d); setTeachersLoaded(true) }).catch(() => setTeachersLoaded(true))
    }
    if (tab === 'abonelik' && !paymentsLoaded) {
      paymentsApi.institutionPayments(id).then(d => { setPayments(d); setPaymentsLoaded(true) }).catch(() => setPaymentsLoaded(true))
    }
  }, [tab, id, studentsLoaded, teachersLoaded, paymentsLoaded])

  const saveSubscription = async () => {
    if (!id) return
    setSaving(true)
    try {
      await superadminApi.setSubscription(id, { status: subStatus, expires_at: subExpiry || undefined })
      await superadminApi.updateInstitution(id, { student_limit: studentLimit })
      setInst(p => p ? { ...p, subscription_status: subStatus as any, subscription_expires_at: subExpiry, student_limit: studentLimit } : p)
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } catch (e: any) {
      toast(e.message || 'Kaydetme başarısız oldu', 'error')
    } finally {
      setSaving(false)
    }
  }

  const saveSettings = async () => {
    if (!id) return
    setSaving(true)
    try {
      const updated = await superadminApi.updateInstitution(id, {
        name: nameInput, city: cityInput, district: districtInput,
        responsible_name: respNameInput, responsible_phone: respPhoneInput,
      })
      setInst(updated)
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } catch (e: any) {
      toast(e.message || 'Kaydetme başarısız oldu', 'error')
    } finally {
      setSaving(false)
    }
  }

  const toggleActiveState = async () => {
    if (!id || !inst) return
    const next = !isActive
    setIsActive(next)
    try {
      await superadminApi.toggleActive(id, next)
    } catch (e: any) {
      setIsActive(!next)
      toast(e.message || 'İşlem başarısız oldu', 'error')
    }
  }

  if (loading) return (
    <SuperadminLayout>
      <div className="flex items-center justify-center py-24 text-gray-400">
        <div className="text-center">
          <div className="text-3xl mb-2 animate-pulse">⏳</div>
          <p className="text-sm">Yükleniyor...</p>
        </div>
      </div>
    </SuperadminLayout>
  )

  if (loadError || !inst) return (
    <SuperadminLayout>
      <Alert variant="warn">{loadError || 'Kurum bulunamadı'}</Alert>
      <button onClick={() => navigate('/superadmin')}
        className="mt-3 px-4 py-2 bg-green-500 text-white text-sm font-bold rounded-lg">
        Kurum Listesine Dön
      </button>
    </SuperadminLayout>
  )

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
          <button onClick={() => { setIsActive(a => !a); toggleActiveState() }}
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
          </div>
        </div>
      )}

      {/* ABONELİK */}
      {tab === 'abonelik' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Durum yönetimi */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="text-sm font-bold text-gray-900 mb-4">💳 Abonelik Durumu</div>

              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Durum</label>
                <select value={subStatus} onChange={e => setSubStatus(e.target.value)}
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

              <button onClick={saveSubscription} disabled={saving}
                className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg text-sm disabled:opacity-50 transition-colors">
                {saving ? '⏳ Kaydediliyor...' : saved ? '✅ Kaydedildi!' : 'Kaydet'}
              </button>
            </div>

            {/* Ödeme al */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="text-sm font-bold text-gray-900 mb-4">💰 Ödeme Al</div>

              <div className="space-y-2 mb-4">
                {Object.entries(PAKET_FIYATLARI).map(([key, p]) => (
                  <button key={key}
                    onClick={() => setPayForm(f => ({ ...f, paket: key, tutar: p.toplam }))}
                    className={`w-full py-3 px-4 rounded-xl border-2 text-sm font-semibold text-left transition-all ${payForm.paket === key ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-700 hover:border-green-300'}`}>
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="mb-3">
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Tutar (₺)</label>
                <input type="number" value={payForm.tutar} onChange={e => setPayForm(f => ({ ...f, tutar: parseFloat(e.target.value) }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
              </div>

              <div className="mb-3">
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Not (opsiyonel)</label>
                <input value={payForm.not} onChange={e => setPayForm(f => ({ ...f, not: e.target.value }))}
                  placeholder="Havale, EFT, nakit..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
              </div>

              <label className="flex items-center gap-2 mb-4 cursor-pointer">
                <input type="checkbox" checked={payForm.markPaid}
                  onChange={e => setPayForm(f => ({ ...f, markPaid: e.target.checked }))}
                  className="w-4 h-4 accent-green-500" />
                <span className="text-sm text-gray-700">Ödendi olarak işaretle + aboneliği 1 yıl uzat</span>
              </label>

              <button onClick={async () => {
                setPaying(true)
                try {
                  await paymentsApi.create({
                    institution_id: id!,
                    amount: payForm.tutar,
                    due_date: new Date().toISOString().split('T')[0],
                    note: payForm.not || undefined,
                    mark_paid_now: payForm.markPaid,
                  })
                  if (payForm.markPaid) {
                    setSubStatus('active')
                    const newExpiry = new Date()
                    newExpiry.setFullYear(newExpiry.getFullYear() + 1)
                    setSubExpiry(newExpiry.toISOString().split('T')[0])
                  }
                  const updated = await paymentsApi.institutionPayments(id!)
                  setPayments(updated)
                  toast('Ödeme kaydedildi ✅', 'success')
                  setPayForm(f => ({ ...f, not: '' }))
                } catch (e: any) {
                  toast(e.message || 'Kayıt başarısız', 'error')
                } finally {
                  setPaying(false)
                }
              }} disabled={paying}
                className="w-full py-3 bg-[#1B4332] hover:bg-green-800 text-white font-bold rounded-xl text-sm disabled:opacity-50 transition-colors">
                {paying ? '⏳ Kaydediliyor...' : '💰 Ödemeyi Kaydet'}
              </button>
            </div>
          </div>

          {/* Ödeme Geçmişi */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 text-sm font-bold text-gray-900">📋 Ödeme Geçmişi</div>
            {!paymentsLoaded ? (
              <div className="text-center py-8 text-gray-400 text-sm">⏳ Yükleniyor...</div>
            ) : payments.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">Henüz ödeme kaydı yok</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Tarih', 'Tutar', 'Durum', 'Ödeme Tarihi', 'Not'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-bold text-gray-400 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-xs text-gray-500">{p.due_date}</td>
                      <td className="px-4 py-2.5 font-bold text-gray-900">{Number(p.amount).toLocaleString('tr-TR')} ₺</td>
                      <td className="px-4 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'paid' ? 'bg-green-100 text-green-700' :
                          p.status === 'overdue' ? 'bg-red-100 text-red-600' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {p.status === 'paid' ? '✅ Ödendi' : p.status === 'overdue' ? '⚠️ Gecikmiş' : '⏳ Bekliyor'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-500">{p.paid_at || '—'}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-500">{p.note || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ÖĞRENCİLER */}
      {tab === 'ogrenciler' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="text-sm font-bold text-gray-900">Öğrenciler</div>
            <span className="text-xs text-gray-400">{students.length} kayıt</span>
          </div>
          {!studentsLoaded ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-3xl mb-2 animate-pulse">⏳</div>
              <p className="text-sm">Yükleniyor...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-3xl mb-2">👥</div>
              <p className="text-sm">Bu kurumda öğrenci yok</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Ad Soyad', 'Veli', 'Telefon', 'Durum'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-bold text-gray-400 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map((s: any) => (
                    <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-semibold text-gray-900">{s.first_name} {s.last_name}</td>
                      <td className="px-4 py-2.5 text-gray-600">{s.parent_first_name} {s.parent_last_name}</td>
                      <td className="px-4 py-2.5 text-gray-500">{s.parent_phone}</td>
                      <td className="px-4 py-2.5 text-gray-500">{s.status === 'approved' ? 'Onaylı' : s.status === 'pending' ? 'Beklemede' : s.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ÖĞRETMENLER */}
      {tab === 'ogretmenler' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="text-sm font-bold text-gray-900">Öğretmenler</div>
            <span className="text-xs text-gray-400">{teachers.length} öğretmen</span>
          </div>
          {!teachersLoaded ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-3xl mb-2 animate-pulse">⏳</div>
              <p className="text-sm">Yükleniyor...</p>
            </div>
          ) : teachers.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-3xl mb-2">👨‍🏫</div>
              <p className="text-sm">Bu kurumda öğretmen yok</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Ad Soyad', 'Telefon'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-bold text-gray-400 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((t: any) => (
                    <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-semibold text-gray-900">{t.full_name}</td>
                      <td className="px-4 py-2.5 text-gray-500">{t.phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
              <input value={nameInput} onChange={e=>setNameInput(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Şehir</label>
                <input value={cityInput} onChange={e=>setCityInput(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">İlçe</label>
                <input value={districtInput} onChange={e=>setDistrictInput(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Sorumlu Adı</label>
              <input value={respNameInput} onChange={e=>setRespNameInput(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Sorumlu Telefon</label>
              <input value={respPhoneInput} onChange={e=>setRespPhoneInput(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
            </div>
            <button onClick={saveSettings} disabled={saving}
              className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg text-sm disabled:opacity-50 transition-colors">
              {saving ? '⏳ Kaydediliyor...' : saved ? '✅ Kaydedildi!' : 'Kaydet'}
            </button>
          </div>
        </div>
      )}
    </SuperadminLayout>
  )
}
