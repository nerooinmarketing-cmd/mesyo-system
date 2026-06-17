import { useState } from 'react'
import { SuperadminLayout } from '@/components/layout/SuperadminLayout'
import { Button, useToast } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'

export default function SuperadminSettingsPage() {
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const [oldPw, setOldPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [newPw2, setNewPw2] = useState('')
  const [saving, setSaving] = useState(false)

  // Platform ayarları
  const [platform, setPlatform] = useState({
    name: 'Mesyo Soft',
    domain: 'mesyosoft.com.tr',
    supportPhone: '05300000000',
    supportEmail: 'destek@mesyosoft.com.tr',
    trialDays: '30',
    maxStudentsDefault: '100',
    gameOpenAt: '20:00',
    gameCloseAt: '23:00',
  })

  const changePassword = async () => {
    if (!oldPw || !newPw || !newPw2) { toast('Tüm alanları doldurun', 'error'); return }
    if (newPw !== newPw2) { toast('Yeni şifreler eşleşmiyor', 'error'); return }
    if (newPw.length < 6) { toast('Şifre en az 6 karakter olmalı', 'error'); return }
    setSaving(true)
    await new Promise(r=>setTimeout(r,600))
    setSaving(false)
    toast('Şifre değiştirildi ✅', 'success')
    setOldPw(''); setNewPw(''); setNewPw2('')
  }

  const savePlatform = async () => {
    setSaving(true)
    await new Promise(r=>setTimeout(r,600))
    setSaving(false)
    toast('Platform ayarları kaydedildi ✅', 'success')
  }

  return (
    <SuperadminLayout>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">

        {/* Profil */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="text-sm font-bold text-gray-900 mb-4">👤 Profil Bilgileri</div>
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-extrabold text-lg">
              {(user?.full_name||'S').charAt(0)}
            </div>
            <div>
              <div className="font-bold text-gray-900">{user?.full_name}</div>
              <div className="text-xs text-gray-400">{user?.phone}</div>
              <div className="text-xs font-bold text-purple-600 mt-0.5">🔐 Superadmin</div>
            </div>
          </div>
          <div className="space-y-3">
            {[
              ['Ad Soyad', user?.full_name || '—'],
              ['Telefon', user?.phone || '—'],
              ['Rol', 'Superadmin'],
            ].map(([l,v])=>(
              <div key={l} className="flex items-center py-2 border-b border-gray-50 last:border-0">
                <span className="text-xs font-semibold text-gray-400 w-24">{l}</span>
                <span className="text-sm text-gray-700">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Şifre Değiştir */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="text-sm font-bold text-gray-900 mb-4">🔑 Şifre Değiştir</div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Mevcut Şifre</label>
              <input type="password" value={oldPw} onChange={e=>setOldPw(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Yeni Şifre</label>
              <input type="password" value={newPw} onChange={e=>setNewPw(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Yeni Şifre (Tekrar)</label>
              <input type="password" value={newPw2} onChange={e=>setNewPw2(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&changePassword()}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"/>
            </div>
            <Button onClick={changePassword} loading={saving} className="w-full justify-center">
              Şifreyi Güncelle
            </Button>
          </div>
        </div>

        {/* Platform Ayarları */}
        <div className="bg-white rounded-xl shadow-sm p-5 md:col-span-2">
          <div className="text-sm font-bold text-gray-900 mb-4">⚙️ Platform Ayarları</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {[
              {k:'name', l:'Platform Adı'},
              {k:'domain', l:'Domain'},
              {k:'supportPhone', l:'Destek Telefonu'},
              {k:'supportEmail', l:'Destek E-posta'},
              {k:'trialDays', l:'Deneme Süresi (gün)'},
              {k:'maxStudentsDefault', l:'Varsayılan Öğrenci Limiti'},
              {k:'gameOpenAt', l:'Oyun Açılış Saati'},
              {k:'gameCloseAt', l:'Oyun Kapanış Saati'},
            ].map(({k,l})=>(
              <div key={k}>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">{l}</label>
                <input value={platform[k as keyof typeof platform]}
                  onChange={e=>setPlatform(p=>({...p,[k]:e.target.value}))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"/>
              </div>
            ))}
          </div>
          <Button onClick={savePlatform} loading={saving}>💾 Ayarları Kaydet</Button>
        </div>

        {/* Tehlikeli Bölge */}
        <div className="bg-white rounded-xl shadow-sm p-5 md:col-span-2 border-2 border-red-100">
          <div className="text-sm font-bold text-red-600 mb-3">⚠️ Tehlikeli Bölge</div>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="text-sm font-semibold text-gray-900">Oturumu Kapat</div>
              <div className="text-xs text-gray-400">Tüm cihazlardan çıkış yapılır</div>
            </div>
            <button onClick={()=>{logout();window.location.href='/login'}}
              className="px-4 py-2 border-2 border-red-300 text-red-500 text-sm font-bold rounded-lg hover:bg-red-50 transition-colors">
              🚪 Çıkış Yap
            </button>
          </div>
        </div>

      </div>
    </SuperadminLayout>
  )
}
