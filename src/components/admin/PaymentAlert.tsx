import { useState } from 'react'
import { waLink } from '@/lib/utils'

interface PaymentAlertProps {
  dueDate: string
  amount?: number
  iban?: string
}

export function PaymentAlert({ dueDate, amount=1000, iban='TR12 3456 7890 1234 5678 9012 34' }: PaymentAlertProps) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  const days = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000)
  if (days > 10 || days < -60) return null  // 10 günden fazla varsa veya çok geçmişse gösterme

  const isOverdue = days < 0
  const isCritical = days <= 3

  return (
    <div className={`mx-4 mt-4 rounded-2xl border-2 p-4 flex items-start gap-3 ${
      isOverdue ? 'bg-red-50 border-red-400' :
      isCritical ? 'bg-red-50 border-red-300' :
      'bg-amber-50 border-amber-300'
    }`}>
      <div className="text-2xl flex-shrink-0">{isOverdue ? '🚨' : isCritical ? '🔴' : '⚠️'}</div>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-bold mb-1 ${isOverdue?'text-red-700':isCritical?'text-red-600':'text-amber-800'}`}>
          {isOverdue ? `Abonelik Ödemeniz ${Math.abs(days)} Gün Gecikmiş!` : `Abonelik Ödemenize ${days} Gün Kaldı`}
        </div>
        <p className={`text-xs leading-relaxed mb-2 ${isOverdue?'text-red-600':'text-amber-700'}`}>
          {amount.toLocaleString('tr-TR')} ₺ yıllık sistem bedelini lütfen aşağıdaki IBAN'a yatırın.<br/>
          <strong>IBAN:</strong> {iban}<br/>
          <strong>Açıklama:</strong> Kurum adınız + "Mesyo Soft ödeme"
        </p>
        <div className="flex gap-2 flex-wrap">
          <a href={waLink('905000000000',
              `Ödeme bildirimim:\n\nKurum: [Kurum Adınız]\nTutar: ${amount.toLocaleString('tr-TR')} ₺\nTarih: ${new Date().toLocaleDateString('tr-TR')}\nMakbuz ekte.`
            )} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] text-white text-xs font-bold rounded-lg">
            📱 Ödeme Dekontunu Gönder
          </a>
          <button onClick={()=>setDismissed(true)}
            className="px-3 py-1.5 border border-gray-200 text-gray-500 text-xs font-semibold rounded-lg hover:bg-gray-50">
            Kapat
          </button>
        </div>
      </div>
    </div>
  )
}
