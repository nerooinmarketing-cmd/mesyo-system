import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SuperadminLayout } from '@/components/layout/SuperadminLayout'
import { superadminApi } from '@/lib/api'

export default function NewInstitutionPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', slug: '', city: 'Konya', district: '',
    address: '', responsible_name: '', responsible_phone: '',
    email: '', student_limit: '150',
    admin_phone: '', admin_password: '',
    subscription_status: 'trial',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  // Kurum adından otomatik slug üret
  const autoSlug = (name: string) => name.toLowerCase()
    .replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s').replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c')
    .replace(/[^a-z0-9]/g,'').slice(0, 20)

  const submit = async () => {
    if (!form.name || !form.slug || !form.responsible_name || !form.responsible_phone || !form.admin_phone || !form.admin_password) {
      setError('Zorunlu alanları doldurun'); return
    }
    if (form.admin_password.length < 4) {
      setError('Şifre en az 4 karakter olmalı'); return
    }
    setLoading(true); setError('')
    try {
      await superadminApi.createInstitution({
        name: form.name,
        slug: form.slug,
        city: form.city,
        district: form.district,
        address: form.address || undefined,
        responsible_name: form.responsible_name,
        responsible_phone: form.responsible_phone,
        email: form.email || undefined,
        student_limit: parseInt(form.student_limit) || 150,
        admin_phone: form.admin_phone,
        admin_password: form.admin_password,
        subscription_status: form.subscription_status as any,
      })
      navigate('/superadmin')
    } catch (e: any) {
      setError(e.message || 'Kurum oluşturulamadı')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SuperadminLayout>
      <div className="flex items-center gap-2 mb-4 text-sm">
        <button onClick={() => navigate('/superadmin')} className="text-gray-400 hover:text-gray-600">Kurumlar</button>
        <span className="text-gray-300">/</span>
        <span className="font-semibold text-gray-900">Yeni Kurum</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
        {/* Kurum bilgileri */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="text-sm font-bold text-gray-900 mb-4">🏛️ Kurum Bilgileri</div>

          {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg mb-3">{error}</div>}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Kurum Adı *</label>
              <input value={form.name} onChange={e => { f('name', e.target.value); f('slug', autoSlug(e.target.value)) }}
                placeholder="örn: Karacihan Mescidi"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Subdomain (Slug) *</label>
              <div className="flex items-center gap-0">
                <input value={form.slug} onChange={e => f('slug', e.target.value.toLowerCase().replace(/[^a-z0-9]/g,''))}
                  placeholder="karacihanmescidi"
                  className="flex-1 px-3 py-2.5 border border-gray-200 rounded-l-lg text-sm outline-none focus:border-green-500 font-mono" />
                <span className="px-3 py-2.5 bg-gray-50 border border-l-0 border-gray-200 rounded-r-lg text-xs text-gray-400 whitespace-nowrap">.mesyosoft.com.tr</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Şehir</label>
                <input value={form.city} onChange={e => f('city', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">İlçe</label>
                <input value={form.district} onChange={e => f('district', e.target.value)} placeholder="Karatay"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Sorumlu Adı *</label>
              <input value={form.responsible_name} onChange={e => f('responsible_name', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Sorumlu Telefon *</label>
              <input type="tel" value={form.responsible_phone} onChange={e => f('responsible_phone', e.target.value)}
                placeholder="05XX..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Öğrenci Limiti</label>
              <input type="number" value={form.student_limit} onChange={e => f('student_limit', e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
            </div>
          </div>
        </div>

        {/* Admin hesabı + abonelik */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-sm font-bold text-gray-900 mb-4">👤 Yönetici Hesabı</div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Telefon (giriş için) *</label>
                <input type="tel" value={form.admin_phone} onChange={e => f('admin_phone', e.target.value)}
                  placeholder="05XX..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Şifre *</label>
                <input type="password" value={form.admin_password} onChange={e => f('admin_password', e.target.value)}
                  placeholder="En az 8 karakter"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-sm font-bold text-gray-900 mb-4">💳 Abonelik</div>
            <select value={form.subscription_status} onChange={e => f('subscription_status', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500 mb-3">
              <option value="trial">🔵 Deneme (30 gün ücretsiz)</option>
              <option value="active">✅ Aktif Abonelik</option>
            </select>
          </div>

          {/* Özet */}
          {form.slug && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="text-xs font-bold text-green-700 uppercase mb-2">Oluşturulacak Panel</div>
              <div className="font-mono text-sm text-green-800 font-semibold">{form.slug}.mesyosoft.com.tr</div>
              <div className="text-xs text-green-600 mt-1">Giriş: {form.admin_phone || '—'}</div>
            </div>
          )}

          <button onClick={submit} disabled={loading}
            className="w-full py-3.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl text-sm disabled:opacity-50 transition-colors">
            {loading ? '⏳ Oluşturuluyor...' : '🏛️ Kurumu Oluştur'}
          </button>
        </div>
      </div>
    </SuperadminLayout>
  )
}
