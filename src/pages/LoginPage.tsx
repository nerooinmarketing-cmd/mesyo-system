import { useState } from 'react'

export default function LoginPage() {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!phone || !password) { setError('Telefon ve şifre girin'); return }
    setLoading(true); setError('')
    try {
      const { authApi } = await import('@/lib/api')
      const res = await authApi.login(phone, password)
      localStorage.setItem('mesyo_token', res.token)
      localStorage.setItem('mesyo_user', JSON.stringify(res.user))
      if (res.user.role === 'superadmin') window.location.href = '/superadmin'
      else if (res.user.role === 'institution_admin') window.location.href = '/admin/dashboard'
      else window.location.href = '/teacher/yoklama'
    } catch (e: any) { setError(e.message || 'Giriş başarısız') }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 50%, #1B4332 100%)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3 border border-white/15">📚</div>
          <div className="text-white text-2xl font-bold tracking-widest">Mesyo Soft</div>
          <div className="text-white/50 text-xs mt-1">Eğitim Yönetim Sistemi</div>
        </div>

        <div className="bg-white rounded-2xl p-7 shadow-2xl">
          <h1 className="text-lg font-bold text-gray-900 mb-1">Giriş Yap</h1>
          <p className="text-sm text-gray-400 mb-5">Hesabınıza erişin</p>

          {error && <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg mb-3">{error}</div>}

          <div className="mb-3">
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Telefon</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="05XX XXX XX XX"
              className="w-full px-3 py-2.5 border-[1.5px] border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
          </div>
          <div className="mb-5">
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Şifre</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className="w-full px-3 py-2.5 border-[1.5px] border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
          </div>

          <button onClick={handleLogin} disabled={loading}
            className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors disabled:opacity-50">
            {loading ? '⏳ Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </div>

        {/* Yeni Kurum Kaydı */}
        <a href="/kayit/kurum"
          className="mt-4 flex items-center justify-center gap-2 w-full py-3.5 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold rounded-2xl text-sm transition-colors backdrop-blur-sm">
          🏛️ Kurumum İçin Kayıt Oluştur
        </a>

        <p className="text-center text-white/30 text-xs mt-5">Mesyo Soft © 2025</p>
      </div>
    </div>
  )
}
