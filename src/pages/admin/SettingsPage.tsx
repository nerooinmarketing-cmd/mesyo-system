import { useState } from 'react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Button, useToast } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const { toast } = useToast()

  const [info, setInfo] = useState({
    name:              'Karacihan Mescidi',
    city:              'Konya',
    district:          'Karatay',
    address:           'Karacihan Mah. Çiçek Sok. No:5',
    responsible_name:  user?.full_name || 'Ahmet Yıldız',
    responsible_phone: user?.phone || '05321111111',
    email:             'karacihan@gmail.com',
    wa_group_link:     'https://chat.whatsapp.com/...',
    about:             '',
  })

  const [pw, setPw] = useState({ old:'', new1:'', new2:'' })
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'kurum'|'hesap'|'bildirim'>('kurum')

  const [notifSettings, setNotifSettings] = useState({
    absence_notify:    true,
    payment_reminder:  true,
    game_result:       true,
    maintenance_alert: true,
  })

  const saveInfo = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))
    setSaving(false)
    toast('Kurum bilgileri kaydedildi ✅', 'success')
  }

  const changePassword = async () => {
    if (!pw.old || !pw.new1 || !pw.new2) { toast('Tüm alanları doldurun', 'error'); return }
    if (pw.new1 !== pw.new2) { toast('Yeni şifreler eşleşmiyor', 'error'); return }
    if (pw.new1.length < 6) { toast('Şifre en az 6 karakter', 'error'); return }
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))
    setSaving(false)
    toast('Şifre değiştirildi ✅', 'success')
    setPw({ old:'', new1:'', new2:'' })
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl space-y-4">

        {/* Tab */}
        <div className="flex bg-gray-100 rounded-xl p-1">
          {([
            ['kurum','🏛️ Kurum Bilgileri'],
            ['hesap','🔑 Hesap & Şifre'],
            ['bildirim','🔔 Bildirimler'],
          ] as const).map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${tab===t?'bg-white text-gray-900 shadow-sm':'text-gray-400'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* KURUM BİLGİLERİ */}
        {tab==='kurum' && (
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">🏛️ Kurum Bilgileri</div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Kurum Adı</label>
                <input value={info.name} onChange={e=>setInfo(p=>({...p,name:e.target.value}))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Şehir</label>
                  <input value={info.city} onChange={e=>setInfo(p=>({...p,city:e.target.value}))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">İlçe</label>
                  <input value={info.district} onChange={e=>setInfo(p=>({...p,district:e.target.value}))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"/>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Açık Adres</label>
                <input value={info.address} onChange={e=>setInfo(p=>({...p,address:e.target.value}))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Sorumlu Adı</label>
                <input value={info.responsible_name} onChange={e=>setInfo(p=>({...p,responsible_name:e.target.value}))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Sorumlu Telefon</label>
                <input type="tel" value={info.responsible_phone} onChange={e=>setInfo(p=>({...p,responsible_phone:e.target.value}))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">E-posta</label>
                <input type="email" value={info.email} onChange={e=>setInfo(p=>({...p,email:e.target.value}))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Veli WhatsApp Grup Linki</label>
                <input value={info.wa_group_link} onChange={e=>setInfo(p=>({...p,wa_group_link:e.target.value}))}
                  placeholder="https://chat.whatsapp.com/..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"/>
              </div>

              {/* Kayıt linki */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                <div className="text-xs font-bold text-green-700 mb-1">📋 Veli Kayıt Formu Linki</div>
                <div className="font-mono text-xs text-green-800 break-all">
                  {window.location.origin}/kayit/{user?.institution_slug || 'kurum-slug'}
                </div>
                <p className="text-xs text-green-600 mt-1.5">Bu linki velilerinize WhatsApp, kapıdaki QR kod veya cami panosundan paylaşabilirsiniz.</p>
                <button onClick={()=>{navigator.clipboard.writeText(`${window.location.origin}/kayit/${user?.institution_slug || ''}`);toast('Kopyalandı','success')}}
                  className="mt-2 text-xs text-green-600 font-semibold hover:underline">📋 Kopyala</button>
              </div>

              <Button onClick={saveInfo} loading={saving} className="w-full justify-center">💾 Kaydet</Button>
            </div>
          </div>
        )}

        {/* HESAP & ŞİFRE */}
        {tab==='hesap' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-extrabold text-lg">
                  {(user?.full_name || 'Y').charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-gray-900">{user?.full_name}</div>
                  <div className="text-sm text-gray-500">{user?.phone}</div>
                  <div className="text-xs text-green-600 font-semibold mt-0.5">Kurum Yöneticisi</div>
                </div>
              </div>

              <div className="text-sm font-bold text-gray-900 mb-3">🔑 Şifre Değiştir</div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Mevcut Şifre</label>
                  <input type="password" value={pw.old} onChange={e=>setPw(p=>({...p,old:e.target.value}))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Yeni Şifre</label>
                  <input type="password" value={pw.new1} onChange={e=>setPw(p=>({...p,new1:e.target.value}))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Yeni Şifre (Tekrar)</label>
                  <input type="password" value={pw.new2} onChange={e=>setPw(p=>({...p,new2:e.target.value}))}
                    onKeyDown={e=>e.key==='Enter'&&changePassword()}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"/>
                </div>
                <Button onClick={changePassword} loading={saving} className="w-full justify-center">Şifreyi Güncelle</Button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-5 border-2 border-red-100">
              <div className="text-sm font-bold text-red-600 mb-3">⚠️ Tehlikeli Bölge</div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-gray-900">Oturumu Kapat</div>
                  <div className="text-xs text-gray-400">Panelden güvenli çıkış</div>
                </div>
                <button onClick={()=>{logout();window.location.href='/login'}}
                  className="px-4 py-2 border-2 border-red-300 text-red-500 text-sm font-bold rounded-lg hover:bg-red-50">
                  🚪 Çıkış Yap
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BİLDİRİMLER */}
        {tab==='bildirim' && (
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">🔔 Bildirim Ayarları</div>
            <div className="space-y-0">
              {[
                {k:'absence_notify',    l:'Devamsızlık Bildirimi',          d:'Öğrenci gelmediğinde veliye WA'},
                {k:'payment_reminder',  l:'Ödeme Hatırlatması',             d:'Abonelik süresine yakın uyarı'},
                {k:'game_result',       l:'Oyun Sonuçları',                 d:'Kubbeler Yarışıyor günlük özet'},
                {k:'maintenance_alert', l:'Demirbaş Bakım Hatırlatması',    d:'Bakım tarihi yaklaşan eşyalar'},
              ].map(s=>(
                <div key={s.k} className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{s.l}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{s.d}</div>
                  </div>
                  <button
                    onClick={()=>setNotifSettings(p=>({...p,[s.k]:!p[s.k as keyof typeof p]}))}
                    className={`relative w-11 h-6 rounded-full transition-colors ${notifSettings[s.k as keyof typeof notifSettings]?'bg-green-500':'bg-gray-200'}`}>
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${notifSettings[s.k as keyof typeof notifSettings]?'translate-x-6':'translate-x-1'}`}/>
                  </button>
                </div>
              ))}
            </div>
            <Button onClick={()=>toast('Bildirim ayarları kaydedildi ✅','success')} className="mt-4 w-full justify-center">
              💾 Kaydet
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
