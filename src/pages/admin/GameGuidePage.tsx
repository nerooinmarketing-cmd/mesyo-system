import { useState } from 'react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { cn } from '@/lib/utils'

type Tab = 'hoca' | 'veli' | 'excel' | 'puanlama' | 'sss'

const TABS: [Tab, string, string][] = [
  ['hoca',     '📋 Hoca Rehberi',   'Günlük panel kullanımı'],
  ['veli',     '👨‍👩‍👧 Veli Rehberi', 'Oyun akışı ve kurallar'],
  ['excel',    '📊 Excel Şablonu',  'Soru yükleme rehberi'],
  ['puanlama', '⭐ Puanlama',       'Nasıl puan kazanılır?'],
  ['sss',      '❓ Sık Sorulan',    'Soru ve cevaplar'],
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-base font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">{title}</h2>
      {children}
    </div>
  )
}

function Step({ n, color, title, desc, tip, warn, info }: {
  n: string; color: string; title: string; desc: string
  tip?: string; warn?: string; info?: string
}) {
  return (
    <div className="flex gap-3 mb-4">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5 ${color}`}>{n}</div>
      <div className="flex-1">
        <div className="text-sm font-bold text-gray-900 mb-1">{title}</div>
        <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
        {tip  && <div className="mt-2 px-3 py-2 bg-green-50  border border-green-200  rounded-lg text-xs text-green-800">{tip}</div>}
        {warn && <div className="mt-2 px-3 py-2 bg-amber-50  border border-amber-200  rounded-lg text-xs text-amber-800">{warn}</div>}
        {info && <div className="mt-2 px-3 py-2 bg-blue-50   border border-blue-200   rounded-lg text-xs text-blue-800">{info}</div>}
      </div>
    </div>
  )
}

function Card({ icon, title, desc, color = 'border-gray-200' }: { icon: string; title: string; desc: string; color?: string }) {
  return (
    <div className={`bg-white rounded-xl border-2 ${color} p-4`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-sm font-bold text-gray-900 mb-1">{title}</div>
      <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
    </div>
  )
}

function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-3 text-left gap-3 hover:bg-gray-50 px-1 rounded-lg transition-colors">
        <span className="text-sm font-semibold text-gray-900">{q}</span>
        <span className="text-gray-400 flex-shrink-0 text-lg leading-none">{open ? '−' : '+'}</span>
      </button>
      {open && <p className="text-sm text-gray-600 leading-relaxed pb-3 px-1">{a}</p>}
    </div>
  )
}

function PhoneMockup({ title, badge, badgeColor, children }: { title: string; badge: string; badgeColor: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center">
      <span className={`text-xs font-bold px-2.5 py-1 rounded-full mb-2 ${badgeColor}`}>{badge}</span>
      <div className="w-44 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 text-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{title}</span>
        </div>
        <div className="p-3">{children}</div>
      </div>
    </div>
  )
}

export default function GameGuidePage() {
  const [tab, setTab] = useState<Tab>('hoca')

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border-l-4 border-green-500">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🕌</div>
            <div>
              <h1 className="text-lg font-extrabold text-gray-900">Kubbeler Yarışıyor — Aile Macera Ligi</h1>
              <p className="text-sm text-gray-500 mt-1">Yaz Kuran Kursları için aile oyunlaştırma modülü. Bu sayfayı okuyarak oyunu velilere ve çocuklara anlatabilirsiniz.</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {[['🎯 Her akşam 20:00–23:00','bg-green-50 text-green-700'],['👨‍👩‍👧 Aile birlikte oynar','bg-blue-50 text-blue-700'],['🔑 Şifre camide verilir','bg-amber-50 text-amber-700'],['⏱ Günde ~30 dakika','bg-purple-50 text-purple-700']].map(([l,c])=>(
                  <span key={l} className={`text-xs font-semibold px-2.5 py-1 rounded-full ${c}`}>{l}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto gap-1 bg-gray-100 p-1 rounded-xl">
          {TABS.map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className={cn('flex-shrink-0 px-3 py-2 text-xs font-semibold rounded-lg transition-all', tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600')}>
              {label}
            </button>
          ))}
        </div>

        {/* ─── HOCA REHBERİ ─── */}
        {tab === 'hoca' && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <Section title="Oyunun amacı nedir?">
              <p className="text-sm text-gray-600 leading-relaxed">
                Çocuklar camide öğrendikleri bilgileri akşam evde anne veya babayla birlikte bir yarışmada kullanır.
                Önce çocuk 3 soruyu cevaplar, sonra aynı sorular (karıştırılmış şıklarla) veliye sorulur.
                Her ikisinin cevabı birlikte değerlendirilerek aile puanı hesaplanır.
                Amaç, camiye devamı ödüllendirmek ve aile içinde eğitici vakit geçirmektir.
              </p>
            </Section>

            <Section title="Günlük panel kullanımı — adım adım">
              <Step n="1" color="bg-green-100 text-green-700" title="Soru bankasını hazırlayın (haftada bir kez yeterli)"
                desc="Sol menüden 'Oyun Yönetimi → Soru Bankası' sayfasına gidin. 'Şablon İndir' butonuyla Excel dosyasını indirin, soruları doldurun ve 'Excel Yükle' ile sisteme aktarın. Yüklenen sorular birikir, her gün tekrar yüklemenize gerek yoktur."
                tip="İpucu: Her hafta 10–15 soru ekleyin. Kategori karışımını dengeleyin: 40% dini bilgi, 30% genel kültür, 20% zeka, 10% aile sinerjisi soruları iyi bir oran."
              />
              <Step n="2" color="bg-amber-100 text-amber-700" title="Günün şifresini belirleyin"
                desc="Her gün ders bitmeden önce 'Oyun Yönetimi → Günlük Görev' sayfasından şifreyi girin. Sonra aynı kelimeyi çocuklara söyleyin. Şifresiz sisteme girilemiyor — bu, camiye fiziksel katılımı doğrular."
                warn="⚠️ Şifreyi WhatsApp grubuna kesinlikle yazmayın! Sadece camide sözlü söyleyin. Yazan çocuk camiye gelmeden katılabilir, amacınız bozulur."
              />
              <Step n="3" color="bg-blue-100 text-blue-700" title="3 soru seçin"
                desc="Soru bankasından filtreleyerek 3 soruyu seçin. Her sorunun Excel'den gelen süresi otomatik gelir, isterseniz o günün sorularına özel süre girin. Dengeli karışım: 1 dini bilgi + 1 genel kültür veya zeka + 1 aile sinerjisi."
                info="Soru seçiminde zorluk dengesine dikkat edin. İlk hafta kolay başlayın, heyecan artsın. İkinci haftadan itibaren zorluk artırılabilir."
              />
              <Step n="4" color="bg-purple-100 text-purple-700" title="'Akşam Görevini Yayınla' butonuna basın"
                desc="Saat 20:00'de yarışma otomatik açılır, 23:00'te kapanır. Bu saatleri değiştiremezsiniz — tutarlılık önemli, aileler alışsın. Yayınlamayı unutmayın; hoca yayınlamadan yarışma başlamaz."
                warn="⚠️ Yayınlamayı en geç saat 19:30'da yapın. İkindi ile akşam namazı arasında 5 dakikanızı ayırın."
              />
              <Step n="5" color="bg-teal-100 text-teal-700" title="Sabah sonuçları paylaşın"
                desc="Her sabah 07:00'de önceki günün sıralaması hazırlanır. Paneldeki 'Günün Kaşifini Paylaş' butonuyla birinci aileyi veli WhatsApp grubuna otomatik gönderebilirsiniz. Bu, çocukların o gün camiye koşmasını sağlayan en önemli adımdır."
                tip="Örnek mesaj: 'Dünün Kaşifi: Yılmaz Ailesi 280 puan! Tebrikler! Bugün sen birinci olabilirsin, camiye gel!' — kısa, samimi, motive edici."
              />
            </Section>

            <Section title="Günlük kontrol listesi">
              <div className="bg-gray-50 rounded-xl p-4 space-y-2.5">
                {[
                  ['Ders öncesi', 'Soru bankasında bu hafta yeni soru var mı? Gerekiyorsa Excel\'den ekle.'],
                  ['Ders sonunda', 'Günün şifresini çocuklara söyle. Panele gir, şifreyi kaydet.'],
                  ['Öğleden sonra (17:00–19:30)', 'Panelde 3 soru seç → süreleri kontrol et → "Yayınla" butonuna bas.'],
                  ['Sabah 07:00–08:00', 'Sıralamayı kontrol et → "Günün Kaşifi"ni WhatsApp grubuna paylaş.'],
                  ['Hafta sonu', 'Haftalık şampiyon ailesini duyur. Sınıf ligini kontrol et.'],
                ].map(([zaman, islem]) => (
                  <div key={zaman} className="flex items-start gap-3">
                    <div className="w-5 h-5 border-2 border-gray-300 rounded flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">{zaman}</div>
                      <div className="text-sm text-gray-700 mt-0.5">{islem}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Katılım raporunu kullanın">
              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                Panelin "Katılım Raporu" sayfasında her günün oynayan/oynamayan listesini görebilirsiniz.
                Oynamayan aileler için panelden doğrudan WhatsApp mesajı gönderebilirsiniz.
                3 gün üst üste oynamayan aileye özel hatırlatma mesajı atılmasını tavsiye ederiz.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Card icon="📊" title="Katılım oranı" desc="Kaç ailenin oynadığını yüzde olarak görir. Hedef: günlük %70 üzeri." color="border-green-200" />
                <Card icon="🏆" title="Liderlik tablosu" desc="Haftanın en iyi 10 ailesini ve sınıflar arası sıralamayı gösterir." color="border-blue-200" />
                <Card icon="⚠️" title="Pasif aileler" desc="3 gün üst üste oynamayan aileleri listeler, toplu WA gönderebilirsiniz." color="border-amber-200" />
              </div>
            </Section>
          </div>
        )}

        {/* ─── VELİ REHBERİ ─── */}
        {tab === 'veli' && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <Section title="Bu oyun ne, nasıl çalışır?">
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Kubbeler Yarışıyor, her akşam ailenizle birlikte oynadığınız 30 dakikalık bir bilgi yarışmasıdır.
                Çocuğunuz camiden getirdiği şifreyi sisteme girer. Önce kendi 3 sorusunu cevaplar.
                Sonra telefonu size verir, siz de aynı 3 soruyu (şıklar karışmış halde) cevaplarsınız.
                Birlikte puan kazanır, diğer ailelerle yarışırsınız.
              </p>
            </Section>

            <Section title="Oyun akışı — adım adım">
              <div className="flex flex-wrap justify-center gap-4 mb-6">
                <PhoneMockup title="Adım 1" badge="Şifre ekranı" badgeColor="bg-amber-50 text-amber-700">
                  <p className="text-[11px] text-gray-500 text-center mb-2 leading-relaxed">Bugünün şifresi nedir?</p>
                  <div className="border border-gray-200 rounded-lg px-2 py-1.5 text-[11px] text-gray-400 mb-2">TEBE _ _ _ _</div>
                  <div className="text-[10px] text-gray-400 leading-relaxed">Çocuk camide hocadan duyduğu kelimeyi yazar. Yanlışsa giremez.</div>
                </PhoneMockup>

                <PhoneMockup title="Adım 2" badge="Çocuk turu" badgeColor="bg-green-50 text-green-700">
                  <div className="text-[10px] font-bold text-gray-500 mb-1">Soru 1/3 — ⏱ 20 sn</div>
                  <div className="h-1.5 bg-gray-100 rounded-full mb-2 overflow-hidden">
                    <div className="h-full bg-green-400 rounded-full" style={{width:'60%'}} />
                  </div>
                  <p className="text-[11px] font-semibold text-gray-800 mb-2">Fatiha suresi kaç ayettir?</p>
                  {['A) 5','B) 6','C) 7','D) 8'].map((opt, i) => (
                    <div key={opt} className={`text-[11px] px-2 py-1 rounded mb-1 border ${i === 2 ? 'bg-green-50 border-green-400 text-green-700 font-semibold' : 'border-gray-200 text-gray-500'}`}>{opt}</div>
                  ))}
                </PhoneMockup>

                <PhoneMockup title="Adım 3" badge="Geçiş ekranı" badgeColor="bg-purple-50 text-purple-700">
                  <div className="text-center py-2">
                    <div className="text-3xl mb-2">🎉</div>
                    <p className="text-[11px] font-bold text-gray-800 mb-1">Tebrikler kahraman!</p>
                    <p className="text-[10px] text-gray-500 leading-relaxed mb-3">3 soruyu tamamladın. Şimdi telefonu annene ya da babana ver!</p>
                    <div className="bg-amber-50 border border-amber-300 rounded-lg px-2 py-2 text-[11px] text-amber-700 font-bold">Hazır mısın? Başla →</div>
                  </div>
                </PhoneMockup>

                <PhoneMockup title="Adım 4" badge="Veli turu" badgeColor="bg-blue-50 text-blue-700">
                  <div className="text-[10px] font-bold text-gray-500 mb-1">Soru 2/3 — ⏱ 5 sn kaldı</div>
                  <div className="h-1.5 bg-gray-100 rounded-full mb-2 overflow-hidden">
                    <div className="h-full bg-red-400 rounded-full" style={{width:'15%'}} />
                  </div>
                  <p className="text-[11px] font-semibold text-gray-800 mb-2">Fatiha suresi kaç ayettir?</p>
                  {['A) 8','B) 5','C) 6','D) 7'].map((opt, i) => (
                    <div key={opt} className={`text-[11px] px-2 py-1 rounded mb-1 border ${i === 2 ? 'bg-red-50 border-red-400 text-red-600 font-semibold' : 'border-gray-200 text-gray-500'}`}>{opt}{i===2?' ✗':''}</div>
                  ))}
                </PhoneMockup>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
                <strong>Önemli:</strong> Geçiş ekranında "Hazır mısın? Başla" butonuna veli kendisi basmalıdır.
                Çocuk basamaz. Bu sayede çocuk "D'yi seç!" diyerek ipucu veremez. Her ikisi de kendi başına düşünmek zorundadır.
              </div>
            </Section>

            <Section title="Oyun kuralları">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Card icon="⏱" title="Süre kuralı" desc="Her sorunun kendine özel bir süresi var (15–45 saniye). Süre dolmadan cevap verilmezse o soru boş/yanlış sayılır ve +10 katılım puanı verilir." color="border-gray-200" />
                <Card icon="🔀" title="Şıklar karışık" desc="Veliye çocukla aynı sorular gelir ama A, B, C, D'nin yerleri değişiktir. Çocuk 'C'yi seç' dese de bir işe yaramaz." color="border-gray-200" />
                <Card icon="🔑" title="Şifre zorunlu" desc="Camide hocadan duyulmayan şifre ile sisteme girilemiyor. Şifreler WhatsApp'ta paylaşılmaz." color="border-amber-200" />
                <Card icon="1️⃣" title="Günde bir kez" desc="Her aile günde bir kez oynayabilir. İkinci giriş denemesinde o günün sonuçları gösterilir, tekrar oynamak mümkün değil." color="border-gray-200" />
              </div>
            </Section>

            <Section title="Dikkat edilmesi gerekenler">
              <div className="space-y-2">
                {[
                  {icon:'📵', text:'Oyun sırasında çocuk ve veli birbirinin ekranına bakmamalıdır. Gerçek aile yarışması bu şekilde olur.'},
                  {icon:'🕗', text:'Yarışma her gün 20:00\'de açılır, 23:00\'te kapanır. Bu saatler dışında oynama imkânı yoktur.'},
                  {icon:'👶', text:'Çocuk 3 sorusunu bitirmeden veli soruları açılmaz. Sıra değiştirilemez.'},
                  {icon:'📱', text:'Tek bir telefon yeterlidir. Çocuk cevapladıktan sonra telefon veliye geçer.'},
                  {icon:'🏠', text:'Birden fazla çocuğunuz kursda ise her biri kendi hesabıyla ayrı ayrı oynar.'},
                ].map(item => (
                  <div key={item.icon} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                    <span className="text-lg flex-shrink-0">{item.icon}</span>
                    <p className="text-sm text-gray-600 leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        )}

        {/* ─── EXCEL ŞABLONU ─── */}
        {tab === 'excel' && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <Section title="Excel şablonu nasıl doldurulur?">
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Her soru bir satırdır. Aşağıdaki sütunları doldurun. Yıldız (*) işaretli sütunlar zorunludur.
              </p>

              <div className="space-y-3">
                {[
                  {col:'Soru_ID *', tip:'Sayı', desc:'Her soruya benzersiz bir numara verin: 101, 102, 103... Aynı ID iki kez kullanılırsa sistem uyarır.', ex:'101'},
                  {col:'Kategori *', tip:'Metin', desc:'4 kategori kullanabilirsiniz: "Dini Bilgi", "Genel Kültür", "Zeka Sorusu", "Aile Sinerjisi"', ex:'Dini Bilgi'},
                  {col:'Zorluk', tip:'1–3', desc:'1 = Kolay, 2 = Orta, 3 = Zor. İlk haftalarda 1–2 kullanın.', ex:'2'},
                  {col:'Soru_Metni *', tip:'Metin', desc:'Sorunun kendisi. Kısa ve net yazın. Mobil ekranda 2–3 satırı geçmesin.', ex:'Fatiha suresi kaç ayettir?'},
                  {col:'Secenek_A *', tip:'Metin', desc:'A şıkkının metni. Dört şıkkın hepsi dolu olmalıdır.', ex:'5'},
                  {col:'Secenek_B *', tip:'Metin', desc:'B şıkkının metni.', ex:'6'},
                  {col:'Secenek_C *', tip:'Metin', desc:'C şıkkının metni.', ex:'7'},
                  {col:'Secenek_D *', tip:'Metin', desc:'D şıkkının metni.', ex:'8'},
                  {col:'Dogru_Cevap *', tip:'A/B/C/D', desc:'Sadece büyük harf: A, B, C veya D. Başka bir şey yazılamaz.', ex:'C'},
                  {col:'Sure_Saniye *', tip:'Sayı', desc:'O soruya özel geri sayım süresi. Kısa sorular: 15–20 sn. Uzun/zor sorular: 30–45 sn. Aile Sinerjisi: 20–30 sn.', ex:'20'},
                  {col:'Ipucu', tip:'Metin (opsiyonel)', desc:'Süre yarıya inince ekranda görünür. Çok kolay ipucu vermeyin, sadece yönlendirin.', ex:'7 rakamını düşünün...'},
                  {col:'Aciklama', tip:'Metin (opsiyonel)', desc:'Cevap verildikten sonra gösterilecek bilgi notu. Öğretici, kısa tutun.', ex:'Fatiha suresi 7 ayet ve 29 kelimeden oluşur.'},
                ].map(s => (
                  <div key={s.col} className="flex gap-3 py-3 border-b border-gray-50 last:border-0">
                    <div className="w-36 flex-shrink-0">
                      <div className="text-xs font-bold text-gray-900 font-mono">{s.col}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{s.tip}</div>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-600 leading-relaxed">{s.desc}</p>
                      <div className="mt-1 text-[10px] text-green-700 font-mono bg-green-50 px-2 py-0.5 rounded inline-block">Örnek: {s.ex}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Kategori önerileri ve süre rehberi">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Card icon="🕌" title="Dini Bilgi (öneri: 20 sn)" desc="Ayet sayıları, sure isimleri, namaz vakitleri, fıkhi bilgiler. Çocukların camide öğrendiklerini ölçer." color="border-green-200" />
                <Card icon="🌍" title="Genel Kültür (öneri: 25 sn)" desc="Türkiye ve dünya hakkında genel sorular. Hem çocuk hem veli bilebilmeli." color="border-blue-200" />
                <Card icon="🧩" title="Zeka Sorusu (öneri: 35 sn)" desc="Mantık bulmacaları, kısa matematik. Daha uzun süre verin. Herkes birlikte düşünsün." color="border-purple-200" />
                <Card icon="❤️" title="Aile Sinerjisi (öneri: 25 sn)" desc={`İkisi aynı şıkkı seçerse +50 bonus! Örnek: "Babanın favori rengi nedir?" — yanlış da olsa aynı cevap bonus kazandırır.`} color="border-amber-200" />
              </div>
            </Section>

            <Section title="Yükleme kuralları ve hatalar">
              <div className="space-y-2">
                {[
                  {icon:'✅', text:'Dosya .xlsx formatında olmalıdır (.xls veya .csv kabul edilmez).'},
                  {icon:'✅', text:'Sütun başlıkları değiştirilmemelidir. Şablondaki haliyle kalmalıdır.'},
                  {icon:'✅', text:'Dogru_Cevap sütununa sadece A, B, C veya D yazılabilir. "c", "Ç", "7" gibi değerler hata verir.'},
                  {icon:'✅', text:'Aynı Soru_ID\'li bir soru tekrar yüklenirse üzerine yazılır. Güncelleme bu şekilde yapılır.'},
                  {icon:'⚠️', text:'Boş bırakılan zorunlu sütunlar hata listesinde gösterilir. O satır sisteme eklenmez.'},
                  {icon:'⚠️', text:'Sure_Saniye 0 veya boş bırakılamaz. En az 10, en fazla 120 olabilir.'},
                ].map(r => (
                  <div key={r.text} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="flex-shrink-0">{r.icon}</span>
                    <p className="leading-relaxed">{r.text}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
                Hata alırsanız: "Hatalı Satırları İndir" butonu ile hangi satırların sorunlu olduğunu Excel olarak indirebilirsiniz. Düzeltip tekrar yükleyin.
              </div>
            </Section>
          </div>
        )}

        {/* ─── PUANLAMA ─── */}
        {tab === 'puanlama' && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <Section title="Temel puanlama — soru başına">
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Her soru için çocuk ve velinin cevabı ayrı ayrı değerlendirilir, sonra birlikte hesaplanır.
                Hiçbir aile 0 puan kazanmaz — en kötü ihtimalle katılım puanı verilir. Önemli olan birlikte oynamak.
              </p>
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-500 uppercase">Çocuk</th>
                      <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-500 uppercase">Veli</th>
                      <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-500 uppercase">Sonuç</th>
                      <th className="text-right px-4 py-2.5 text-xs font-bold text-gray-500 uppercase">Puan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['✅ Doğru','✅ Doğru','Tam Sinerji','bg-green-50 text-green-700','+100'],
                      ['✅ Doğru','❌ Yanlış','Boynuz kulağı geçti','bg-blue-50 text-blue-700','+60'],
                      ['❌ Yanlış','✅ Doğru','Babadan bilgelik','bg-purple-50 text-purple-700','+40'],
                      ['❌ Yanlış','❌ Yanlış','Katılım desteği','bg-gray-50 text-gray-600','+10'],
                    ].map(([c,v,ad,cls,p])=>(
                      <tr key={ad} className="border-t border-gray-100">
                        <td className="px-4 py-3 text-sm">{c}</td>
                        <td className="px-4 py-3 text-sm">{v}</td>
                        <td className="px-4 py-3"><span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cls}`}>{ad}</span></td>
                        <td className="px-4 py-3 text-right font-extrabold text-green-600 text-base">{p}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-400 mt-2">3 soruluk bir günde maksimum 300 temel puan kazanılabilir (3 × 100).</p>
            </Section>

            <Section title="Bonus puanlar">
              <div className="space-y-3">
                <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-xl p-4">
                  <div className="text-sm font-bold text-amber-800 mb-1">⚡ Hız Bonusu — +10 puan</div>
                  <p className="text-sm text-amber-700 leading-relaxed">
                    Soruya verilen sürenin ilk yarısında doğru cevap verilirse +10 ekstra puan. Hem çocuk hem veli için bağımsız hesaplanır.
                    20 saniyelik soruda ilk 10 saniyede cevaplarsan bonus kazanırsın. Bu bonus hoca panelinden kapatılabilir.
                  </p>
                </div>
                <div className="bg-purple-50 border-l-4 border-purple-400 rounded-r-xl p-4">
                  <div className="text-sm font-bold text-purple-800 mb-1">❤️ Aile Sinerjisi Bonusu — +50 puan</div>
                  <p className="text-sm text-purple-700 leading-relaxed">
                    Kategori "Aile Sinerjisi" olan sorularda (örnek: "Babanın en sevdiği yemek nedir?") çocuk ve velinin seçtiği şık aynı olursa +50 bonus.
                    İkisi de yanlış seçse bile aynı şıkta buluşurlarsa bonus kazanılır. Aile uyumu ödüllendirilir.
                  </p>
                </div>
              </div>
            </Section>

            <Section title="Örnek bir gün — hesaplama">
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-3 py-2.5 text-xs font-bold text-gray-500 uppercase">Soru</th>
                      <th className="text-left px-3 py-2.5 text-xs font-bold text-gray-500 uppercase">Çocuk</th>
                      <th className="text-left px-3 py-2.5 text-xs font-bold text-gray-500 uppercase">Veli</th>
                      <th className="text-left px-3 py-2.5 text-xs font-bold text-gray-500 uppercase">Bonus</th>
                      <th className="text-right px-3 py-2.5 text-xs font-bold text-gray-500 uppercase">Toplam</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-gray-100">
                      <td className="px-3 py-3 text-xs text-gray-500">1 — Dini Bilgi</td>
                      <td className="px-3 py-3">✅ Hızlı</td>
                      <td className="px-3 py-3">✅ Normal</td>
                      <td className="px-3 py-3 text-xs text-amber-600">+10 hız</td>
                      <td className="px-3 py-3 text-right font-bold text-green-600">110</td>
                    </tr>
                    <tr className="border-t border-gray-100">
                      <td className="px-3 py-3 text-xs text-gray-500">2 — Zeka</td>
                      <td className="px-3 py-3">✅ Normal</td>
                      <td className="px-3 py-3">❌</td>
                      <td className="px-3 py-3 text-xs text-gray-400">—</td>
                      <td className="px-3 py-3 text-right font-bold text-green-600">60</td>
                    </tr>
                    <tr className="border-t border-gray-100">
                      <td className="px-3 py-3 text-xs text-gray-500">3 — Aile Sinerjisi</td>
                      <td className="px-3 py-3">❌ (B)</td>
                      <td className="px-3 py-3">❌ (B)</td>
                      <td className="px-3 py-3 text-xs text-purple-600">+50 sinerji</td>
                      <td className="px-3 py-3 text-right font-bold text-green-600">60</td>
                    </tr>
                    <tr className="border-t-2 border-gray-200 bg-gray-50">
                      <td colSpan={4} className="px-3 py-2.5 text-sm font-bold text-gray-700 text-right">Günlük Toplam</td>
                      <td className="px-3 py-2.5 text-right text-lg font-extrabold text-green-600">230</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="Liderlik tabloları">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Card icon="🏆" title="Haftanın Aileleri" desc="Haftalık kümülatif puana göre sıralanan bireysel lig. İlk 10 aile listelenir. Her pazar gece sıfırlanır." color="border-amber-200" />
                <Card icon="🏫" title="Sınıflar Yarışıyor" desc="Sınıf puanı = Toplam puan ÷ Mevcudu. Az kişilik sınıflar dezavantajda kalmaz." color="border-blue-200" />
                <Card icon="⭐" title="Günün Kaşifi" desc="Her gece 23:00'te en yüksek puanı en kısa sürede alan aile rozet kazanır, sabah gruba duyurulur." color="border-purple-200" />
                <Card icon="🥇" title="Sezon Şampiyonu" desc="Yaz kursu boyunca en fazla Günün Kaşifi rozetini kazanan aile sezon şampiyonu olur." color="border-green-200" />
              </div>
            </Section>
          </div>
        )}

        {/* ─── SSS ─── */}
        {tab === 'sss' && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <Section title="Hocalar için sık sorulan sorular">
              <div>
                {[
                  ['Kaç soru hazırlamalıyım?','Haftada 15–20 soru yeterli. Her gün 3 soru seçildiğinde 5 günlük malzeme olur. Soru bankasını hafta başında bir seferde hazırlayıp yükleyebilirsiniz.'],
                  ['Şifreyi unutursam ne olur?','Paneldeki "Günlük Görev" sayfasından şifreyi her zaman görebilirsiniz. Ama çocuklara söylemeyi unutursanız sisteme giremezler — günlük sıfırlama yapabilirsiniz.'],
                  ['Bazı çocukların velisi oynamamak isterse?','Veli katılımı zorunlu değil ama puanlar düşük kalır. Oynayan aileleri öne çıkararak motivasyon yaratın. Birkaç gün sonra veliler de merak eder.'],
                  ['Soruları güncelleyebilir miyim?','Evet. Aynı Soru_ID ile yeni bir Excel yüklerseniz eski soru üzerine yazılır. Aktif bir günde kullanılan soruyu değiştirmeyin.'],
                  ['Katılım düşükse ne yapmalıyım?','Günün Kaşifini WhatsApp grubunda duyurun. "Bugün kim oynamadı?" listesini panelden görüp o ailelere özel WA mesajı gönderin. İlk haftada katılım düşük olabilir, ikinci haftada artar.'],
                  ['Teknik sorun olursa?','Mesyo Soft destek hattına yazın. Panel üzerinden de destek talebi açabilirsiniz.'],
                ].map(([q,a])=><FAQ key={q} q={q} a={a}/>)}
              </div>
            </Section>

            <Section title="Veliler için sık sorulan sorular">
              <div>
                {[
                  ['Şifreyi bilmiyoruz, oynayamıyoruz.','Şifre yalnızca camide söyleniyor. Çocuğunuzun o gün camiye gelmesi gerekiyor. Şifreler WhatsApp\'ta paylaşılmıyor — bu kuralın amacı camiye katılımı ödüllendirmek.'],
                  ['Veli olmadan çocuk tek başına oynayabilir mi?','Hayır. Çocuk turu bittikten sonra "Hazır mısın? Başla" butonu açılır ve veli kendisi basmak zorundadır. Bu aşama atlanamaz.'],
                  ['Süre çok kısa, yetiştiremedik.','Süre soruya göre değişiyor (15–45 saniye). Cevap yetişmezse +10 katılım puanı yine de verilir. Hiç puan almadan çıkmıyorsunuz.'],
                  ['İkinci çocuğumuz da kursda, nasıl oynayacak?','Her çocuk kendi hesabıyla (öğrenci numarası veya veli telefonu + çocuk seçimi) ayrı giriş yapabilir. Telefonu sırayla kullanabilirsiniz.'],
                  ['Cevapladıktan sonra doğru cevabı görebilir miyiz?','Evet. Her sorudan sonra doğru cevap ekranda görünür. Hoca açıklama eklemişse kısa bilgi notu da çıkar. Bu anlar çok kıymetli öğrenme fırsatlarıdır.'],
                  ['Puan tablosunda isim yerine kod mu çıkıyor?','Gizlilik için liderlik tablosunda öğrenci adının ilk harfi ve soyad gösterilir. Hoca tam isimleri panelinden görebilir.'],
                  ['Yarışma hangi saatlerde açık?','Her gün 20:00\'de açılır, 23:00\'te kapanır. Bu saatler değişmez. Geç kalırsanız o günü kaçırırsınız.'],
                ].map(([q,a])=><FAQ key={q} q={q} a={a}/>)}
              </div>
            </Section>

            <Section title="Teknik sorular">
              <div>
                {[
                  ['İnternet bağlantısı kesilirse ne olur?','Soru ekranındaki seçimler kaybolabilir. Bağlantı geri gelince sisteme yeniden girebilirsiniz ama o gün yalnızca bir oynama hakkınız var — kaldığı yerden devam eder.'],
                  ['Hangi cihazlardan oynanabilir?','Telefon, tablet veya bilgisayar tarayıcısından oynanabilir. Uygulama indirmeye gerek yoktur, internet tarayıcısı yeterlidir.'],
                  ['Veri güvenliği nasıl sağlanıyor?','Sistemde yalnızca oyun puanları ve öğrenci adı kayıtlıdır. Telefon numaranız sadece hesap girişinde kullanılır, üçüncü kişilerle paylaşılmaz.'],
                ].map(([q,a])=><FAQ key={q} q={q} a={a}/>)}
              </div>
            </Section>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
