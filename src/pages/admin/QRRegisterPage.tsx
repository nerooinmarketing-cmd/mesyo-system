import { useState } from 'react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Button, useToast } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'

export default function QRRegisterPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const slug = user?.institution_slug || 'kurum'
  const registrationUrl = `https://mesyosoft.com.tr/kayit/${slug}`
  const [copied, setCopied] = useState(false)
  const [printing, setPrinting] = useState(false)

  const copyLink = () => {
    navigator.clipboard.writeText(registrationUrl)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
    toast('Link kopyalandı 📋', 'success')
  }

  const shareWA = () => {
    const msg = `📚 *${user?.institution_name || 'Kurumumuz'} Kayıt Formu*\n\nEğitim programımıza kayıt olmak için aşağıdaki linke tıklayın:\n\n${registrationUrl}\n\nHer zaman yanınızdayız 🌿`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  // QR kodu Google Charts API ile oluştur (ücretsiz, API key gerekmez)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(registrationUrl)}&bgcolor=ffffff&color=1B4332&margin=15`

  return (
    <AdminLayout>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-3xl">
        {/* QR Kod */}
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
          <div className="text-sm font-bold text-gray-900 mb-4">📱 Kayıt Formu QR Kodu</div>

          {/* QR */}
          <div className="inline-block p-4 bg-white border-4 border-[#1B4332] rounded-2xl mb-4 shadow-lg">
            <img src={qrUrl} alt="QR Kod" className="w-48 h-48 block" />
          </div>

          <div className="text-xs font-semibold text-gray-500 mb-1">Kayıt Linki</div>
          <div className="font-mono text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg mb-4 break-all">
            {registrationUrl}
          </div>

          <div className="space-y-2">
            <button onClick={copyLink}
              className={`w-full py-2.5 border-2 font-bold rounded-xl text-sm transition-all ${copied?'border-green-500 bg-green-50 text-green-700':'border-gray-200 text-gray-700 hover:border-gray-300'}`}>
              {copied ? '✅ Kopyalandı!' : '📋 Linki Kopyala'}
            </button>
            <button onClick={shareWA}
              className="w-full py-2.5 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold rounded-xl text-sm transition-colors">
              📱 WhatsApp ile Paylaş
            </button>
            <button onClick={() => window.open(qrUrl.replace('300x300','600x600'), '_blank')}
              className="w-full py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl text-sm hover:bg-gray-50">
              ⬇ QR Kodu İndir
            </button>
          </div>
        </div>

        {/* Kullanım */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-sm font-bold text-gray-900 mb-4">💡 Nasıl Kullanılır?</div>
            <div className="space-y-3">
              {[
                { n:'1', icon:'🖨️', title:'Yazdır', desc:'QR kodu yazdırıp caminin girişine, ilan panosuna veya kapısına asın.' },
                { n:'2', icon:'📱', title:'Veliler Tarar', desc:'Veliler kendi telefonlarıyla QR kodu tarar, kayıt formu açılır.' },
                { n:'3', icon:'✍️', title:'Form Doldurur', desc:'Veli çocuğunun bilgilerini girer ve başvuruyu gönderir.' },
                { n:'4', icon:'🔔', title:'Siz Onaylarsın', desc:'Başvurular Başvurular sayfasında belirir, siz onaylarsın — veliye WA gider.' },
              ].map(s=>(
                <div key={s.n} className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{s.n}</div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{s.icon} {s.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-sm font-bold text-gray-900 mb-3">📤 Paylaşım Yöntemleri</div>
            <div className="space-y-2">
              {[
                { icon:'🖨️', text:'Cami girişi A4 afiş' },
                { icon:'📋', text:'İlan panosu küçük kart' },
                { icon:'📱', text:'Veli WhatsApp grubuna linki at' },
                { icon:'🌐', text:'Caminin Facebook/Instagram sayfası' },
              ].map(s=>(
                <div key={s.text} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-lg">{s.icon}</span>{s.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
