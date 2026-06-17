import { useState } from 'react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Button, Modal, useToast } from '@/components/ui'
import { DEMO_QUESTIONS, DEMO_LEADERBOARD } from '@/lib/game'
import type { Question } from '@/lib/game'
import * as XLSX from 'xlsx'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

type Tab = 'bugun' | 'banka' | 'sonuclar'

const CAT_LABELS: Record<string,string> = { dini:'Dini Bilgi', kultur:'Genel Kültür', zeka:'Zeka Sorusu', sinerji:'Aile Sinerjisi' }
const CAT_COLORS: Record<string,string> = { dini:'bg-green-100 text-green-700', kultur:'bg-blue-100 text-blue-700', zeka:'bg-purple-100 text-purple-700', sinerji:'bg-amber-100 text-amber-700' }

export default function GameAdminPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const slug = user?.institution_slug || 'kurum'

  const [tab, setTab] = useState<Tab>('bugun')
  const [questions, setQuestions] = useState<Question[]>(DEMO_QUESTIONS)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [password, setPassword] = useState('')
  const [published, setPublished] = useState(false)
  const [publishedAt, setPublishedAt] = useState('')
  const [speedBonus, setSpeedBonus] = useState(true)
  const [uploadModal, setUploadModal] = useState(false)
  const [addModal, setAddModal] = useState(false)
  const [newQ, setNewQ] = useState<Partial<Question>>({ category:'dini', difficulty:1, timeSeconds:20, options:{A:'',B:'',C:'',D:''}, correct:'A' })

  const toggleSel = (id: number) => setSelectedIds(p => p.includes(id) ? p.filter(x=>x!==id) : p.length < 3 ? [...p,id] : p)

  const publish = () => {
    if (!password) { toast('Günün şifresini girin','error'); return }
    if (selectedIds.length !== 3) { toast('Tam olarak 3 soru seçin','error'); return }
    // Şifreyi ve soruları localStorage'a kaydet — oyun sayfası buradan okur
    const todayGame = {
      password: password.toUpperCase().trim(),
      questionIds: selectedIds,
      questions: questions.filter(q => selectedIds.includes(q.id)),
      speedBonus,
      publishedAt: new Date().toISOString(),
      slug,
    }
    localStorage.setItem('mesyo_daily_game_' + slug, JSON.stringify(todayGame))
    localStorage.setItem('mesyo_daily_game_global', JSON.stringify(todayGame))
    setPublished(true)
    setPublishedAt(new Date().toLocaleTimeString('tr-TR',{hour:'2-digit',minute:'2-digit'}))
    toast('Yarışma yayınlandı! Şifre: ' + password + ' ✅','success')
  }

  const downloadTemplate = () => {
    const template = [
      ['Soru_ID','Kategori','Zorluk','Soru_Metni','Secenek_A','Secenek_B','Secenek_C','Secenek_D','Dogru_Cevap','Sure_Saniye','Ipucu','Aciklama'],
      [101,'Dini Bilgi',1,'Fatiha suresi kaç ayettir?','5','6','7','8','C',20,'7 rakamı...','Fatiha 7 ayet ve 29 kelimedir.'],
      [102,'Genel Kültür',2,'Türkiye\'nin başkenti neresidir?','İstanbul','Ankara','İzmir','Bursa','B',15,'','Ankara 1923\'ten bu yana başkenttir.'],
      [103,'Aile Sinerjisi',1,'Ailemizde en çok kim çay içer?','Anne','Baba','Ben','Hepsi Eşit','A',25,'','Aile Sinerjisi: ikisi aynı şık seçerse +50 bonus!'],
    ]
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(template)
    ws['!cols'] = [{wch:10},{wch:15},{wch:8},{wch:40},{wch:15},{wch:15},{wch:15},{wch:15},{wch:12},{wch:10},{wch:20},{wch:40}]
    XLSX.utils.book_append_sheet(wb,ws,'Sorular')
    XLSX.writeFile(wb,'kubbeler-soru-sablonu.xlsx')
    toast('Şablon indirildi ⬇','success')
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type:'binary' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows: any[] = XLSX.utils.sheet_to_json(ws)
        const loaded: Question[] = rows.map((r,i) => ({
          id: r['Soru_ID'] || (Date.now() + i),
          category: (r['Kategori']==='Dini Bilgi'?'dini':r['Kategori']==='Genel Kültür'?'kultur':r['Kategori']==='Zeka Sorusu'?'zeka':'sinerji') as Question['category'],
          difficulty: (parseInt(r['Zorluk'])||1) as 1|2|3,
          text: r['Soru_Metni'] || '',
          options: { A:String(r['Secenek_A']||''), B:String(r['Secenek_B']||''), C:String(r['Secenek_C']||''), D:String(r['Secenek_D']||'') },
          correct: (r['Dogru_Cevap']||'A').toUpperCase() as 'A'|'B'|'C'|'D',
          timeSeconds: parseInt(r['Sure_Saniye'])||20,
          hint: r['Ipucu']||undefined,
          explanation: r['Aciklama']||undefined,
        })).filter(q => q.text)
        setQuestions(p => {
          const existing = p.filter(q => !loaded.find(l => l.id === q.id))
          return [...existing, ...loaded]
        })
        toast(`${loaded.length} soru yüklendi ✅`,'success')
        setUploadModal(false)
      } catch { toast('Dosya okunamadı. Şablonu kullandığınızdan emin olun.','error') }
    }
    reader.readAsBinaryString(file)
  }

  const addQuestion = () => {
    if (!newQ.text || !newQ.options?.A || !newQ.options?.B || !newQ.options?.C || !newQ.options?.D) {
      toast('Tüm alanları doldurun','error'); return
    }
    setQuestions(p => [...p, { ...newQ, id: Date.now() } as Question])
    toast('Soru eklendi ✅','success'); setAddModal(false)
    setNewQ({ category:'dini', difficulty:1, timeSeconds:20, options:{A:'',B:'',C:'',D:''}, correct:'A' })
  }

  const leaderboard = DEMO_LEADERBOARD

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🕌</span>
            <div>
              <div className="text-base font-bold text-gray-900">Kubbeler Yarışıyor</div>
              <div className="text-xs text-gray-400">Oyun yönetim paneli</div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <a href={`/oyun/${slug}`} target="_blank" rel="noreferrer"
              className="px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-bold rounded-lg hover:bg-green-100">
              🎮 Oyun Sayfası ↗
            </a>
            <a href={`/skor/${slug}`} target="_blank" rel="noreferrer"
              className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold rounded-lg hover:bg-amber-100">
              🏆 Skor Sayfası ↗
            </a>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1">
          {([['bugun','📅 Bugünkü Görev'],['banka','📚 Soru Bankası'],['sonuclar','📊 Sonuçlar']] as const).map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)}
              className={cn('flex-1 py-2 text-xs font-semibold rounded-lg transition-all', tab===t?'bg-white text-gray-900 shadow-sm':'text-gray-400')}>
              {l}
            </button>
          ))}
        </div>

        {/* BUGÜNKÜ GÖREV */}
        {tab === 'bugun' && (
          <div className="space-y-3">
            {published && (
              <div className="bg-green-50 border border-green-300 rounded-xl px-4 py-3 flex items-center gap-3">
                <span className="text-xl">✅</span>
                <div>
                  <div className="text-sm font-bold text-green-800">Yarışma Yayında!</div>
                  <div className="text-xs text-green-600">{publishedAt}'de yayınlandı · Saat 20:00'de açılacak · 23:00'te kapanacak</div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Şifre */}
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="text-sm font-bold text-gray-900 mb-3">🔑 Günün Şifresi</div>
                <input value={password} onChange={e=>setPassword(e.target.value.toUpperCase())}
                  placeholder="TEBESSÜM, SABIR, BEREKET..."
                  className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-center text-base font-bold tracking-widest outline-none focus:border-green-500 uppercase mb-2"/>
                <p className="text-xs text-gray-400 leading-relaxed">Bu kelimeyi dersin sonunda çocuklara söyleyin. WhatsApp grubuna yazmayın!</p>
              </div>

              {/* Ayarlar */}
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="text-sm font-bold text-gray-900 mb-3">⚙️ Oyun Ayarları</div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-700">Hız Bonusu (+10)</span>
                  <button onClick={()=>setSpeedBonus(s=>!s)}
                    className={cn('relative w-10 h-5 rounded-full transition-colors', speedBonus?'bg-green-500':'bg-gray-200')}>
                    <span className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow', speedBonus?'translate-x-5':'translate-x-0.5')}/>
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">Açılış: 20:00 · Kapanış: 23:00 · Değiştirilemez</p>
              </div>
            </div>

            {/* Soru Seçimi */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-gray-900">Soru Seç (tam 3 tane)</div>
                  <div className="text-xs text-gray-400 mt-0.5">{selectedIds.length}/3 seçildi</div>
                </div>
                <div className="flex gap-1.5">
                  {[0,1,2].map(i => (
                    <div key={i} className={cn('w-3 h-3 rounded-full', i < selectedIds.length ? 'bg-green-500' : 'bg-gray-200')} />
                  ))}
                </div>
              </div>
              {questions.map(q => {
                const isSel = selectedIds.includes(q.id)
                const selIdx = selectedIds.indexOf(q.id)
                const disabled = !isSel && selectedIds.length >= 3
                return (
                  <div key={q.id} onClick={() => !disabled && toggleSel(q.id)}
                    className={cn('flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0 cursor-pointer transition-colors',
                      isSel ? 'bg-green-50' : disabled ? 'opacity-40' : 'hover:bg-gray-50')}>
                    <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 border-2',
                      isSel ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 text-gray-400')}>
                      {isSel ? selIdx + 1 : ''}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CAT_COLORS[q.category]}`}>{CAT_LABELS[q.category]}</span>
                        <span className="text-[10px] text-gray-400">{'★'.repeat(q.difficulty)} · {q.timeSeconds}sn</span>
                      </div>
                      <p className="text-sm text-gray-800 leading-relaxed">{q.text}</p>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {(['A','B','C','D'] as const).map(opt => (
                          <span key={opt} className={cn('text-[10px] px-1.5 py-0.5 rounded font-mono', opt===q.correct?'bg-green-100 text-green-700 font-bold':'text-gray-400')}>
                            {opt}: {q.options[opt]}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Yayınla */}
            <button onClick={publish}
              className={cn('w-full py-4 font-bold rounded-2xl text-base transition-colors',
                selectedIds.length === 3 && password
                  ? 'bg-[#1B4332] hover:bg-green-800 text-white'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed')}>
              {published ? '✅ Yeniden Yayınla' : '🚀 Akşam Görevini Yayınla'}
            </button>

            {published && (
              <div className="grid grid-cols-2 gap-2">
                <a href={`/oyun/${slug}`} target="_blank" rel="noreferrer"
                  className="py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl text-center hover:bg-gray-50">
                  🎮 Oyun Sayfasını Test Et
                </a>
                <a href={`/skor/${slug}`} target="_blank" rel="noreferrer"
                  className="py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl text-center hover:bg-gray-50">
                  🏆 Skor Sayfasına Git
                </a>
              </div>
            )}
          </div>
        )}

        {/* SORU BANKASI */}
        {tab === 'banka' && (
          <div className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              <button onClick={downloadTemplate}
                className="px-3 py-2 border border-gray-200 bg-white text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50">
                ⬇ Şablon İndir
              </button>
              <button onClick={()=>setUploadModal(true)}
                className="px-3 py-2 border border-blue-200 bg-blue-50 text-blue-700 text-sm font-semibold rounded-lg hover:bg-blue-100">
                ⬆ Excel Yükle
              </button>
              <Button onClick={()=>setAddModal(true)}>+ Soru Ekle</Button>
              <span className="ml-auto text-xs text-gray-400 self-center">{questions.length} soru</span>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {questions.map(q => (
                <div key={q.id} className="px-4 py-3 border-b border-gray-50 last:border-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CAT_COLORS[q.category]}`}>{CAT_LABELS[q.category]}</span>
                        <span className="text-[10px] text-gray-400">{'★'.repeat(q.difficulty)} · ⏱{q.timeSeconds}sn · #{q.id}</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800 mb-1">{q.text}</p>
                      <div className="flex gap-2 flex-wrap">
                        {(['A','B','C','D'] as const).map(opt => (
                          <span key={opt} className={cn('text-[10px] px-1.5 py-0.5 rounded font-mono', opt===q.correct?'bg-green-100 text-green-700 font-bold':'text-gray-400 bg-gray-50')}>
                            {opt}: {q.options[opt]}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button onClick={()=>setQuestions(p=>p.filter(x=>x.id!==q.id))}
                      className="text-gray-300 hover:text-red-400 text-xl leading-none flex-shrink-0">×</button>
                  </div>
                </div>
              ))}
              {questions.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-3xl mb-2">📚</div>
                  <p className="text-sm">Soru bankası boş. Excel yükleyin veya manuel ekleyin.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SONUÇLAR */}
        {tab === 'sonuclar' && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {[
                {l:'Bugün Oynayan',v:`${leaderboard.filter(e=>e.playedToday).length}/${leaderboard.length}`,c:'text-green-600'},
                {l:'En Yüksek',v:Math.max(...leaderboard.map(e=>e.todayScore)),c:'text-amber-600'},
                {l:'Ortalama',v:Math.round(leaderboard.reduce((a,e)=>a+e.todayScore,0)/leaderboard.length),c:'text-blue-600'},
              ].map(s=>(
                <div key={s.l} className="bg-white rounded-xl shadow-sm p-3 text-center">
                  <div className={`text-xl font-extrabold ${s.c}`}>{s.v}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{s.l}</div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div className="text-sm font-bold text-gray-900">Bugünün Sonuçları</div>
                <a href={`/skor/${slug}`} target="_blank" rel="noreferrer"
                  className="text-xs text-green-600 font-semibold hover:underline">Herkese Açık Sayfa ↗</a>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {['#','Öğrenci','Veli','Sınıf','Bugün','Haftalık'].map(h=>(
                        <th key={h} className="text-left px-3 py-2 text-xs font-bold text-gray-400 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((e,i) => (
                      <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                        <td className="px-3 py-2.5 font-bold text-gray-500">{i+1}</td>
                        <td className="px-3 py-2.5 font-semibold">{e.studentName}</td>
                        <td className="px-3 py-2.5 text-gray-500">{e.parentName}</td>
                        <td className="px-3 py-2.5 text-xs text-gray-400">{e.className}</td>
                        <td className="px-3 py-2.5 font-bold text-green-600">+{e.todayScore}</td>
                        <td className="px-3 py-2.5 font-bold text-gray-700">{e.weeklyScore.toLocaleString('tr-TR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* WA paylaş */}
            <button onClick={() => {
              const msg = `🏆 *Kubbeler Yarışıyor — Bugünün Sonuçları*\n\n🥇 ${leaderboard[0].studentName} — ${leaderboard[0].todayScore} puan\n🥈 ${leaderboard[1].studentName} — ${leaderboard[1].todayScore} puan\n🥉 ${leaderboard[2].studentName} — ${leaderboard[2].todayScore} puan\n\nTam sıralama: mesyosoft.com/skor/${slug}`
              window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
            }} className="w-full py-3 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold rounded-xl text-sm transition-colors">
              📱 Sonuçları WhatsApp Grubuna Paylaş
            </button>
          </div>
        )}
      </div>

      {/* EXCEL YÜKLEME */}
      <Modal open={uploadModal} onClose={()=>setUploadModal(false)} title="⬆ Excel'den Soru Yükle">
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-800">
            <p className="font-semibold mb-1">Yüklemeden önce:</p>
            <ul className="space-y-1 text-xs">
              <li>• Şablonu indirip doldurun (⬇ Şablon İndir butonu)</li>
              <li>• Dogru_Cevap sütununa sadece A, B, C veya D yazın</li>
              <li>• Sure_Saniye sütununu doldurun (min: 10, max: 120)</li>
              <li>• Aynı Soru_ID tekrar yüklenirse üzerine yazılır</li>
            </ul>
          </div>
          <label className="block">
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-green-400 transition-colors">
              <div className="text-3xl mb-2">📂</div>
              <div className="text-sm font-semibold text-gray-700">Excel dosyası seçin</div>
              <div className="text-xs text-gray-400 mt-1">.xlsx formatında</div>
              <input type="file" accept=".xlsx" onChange={handleUpload} className="hidden" />
            </div>
          </label>
        </div>
      </Modal>

      {/* SORU EKLE */}
      <Modal open={addModal} onClose={()=>setAddModal(false)} title="+ Soru Ekle"
        footer={<><Button variant="outline" onClick={()=>setAddModal(false)}>İptal</Button><Button onClick={addQuestion}>Ekle</Button></>}>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Kategori</label>
            <select value={newQ.category} onChange={e=>setNewQ(p=>({...p,category:e.target.value as any}))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500">
              {Object.entries(CAT_LABELS).map(([v,l])=><option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Zorluk</label>
              <select value={newQ.difficulty} onChange={e=>setNewQ(p=>({...p,difficulty:parseInt(e.target.value) as any}))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500">
                <option value={1}>★ Kolay</option><option value={2}>★★ Orta</option><option value={3}>★★★ Zor</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Süre (sn)</label>
              <input type="number" value={newQ.timeSeconds} onChange={e=>setNewQ(p=>({...p,timeSeconds:parseInt(e.target.value)||20}))}
                min={10} max={120}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"/>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Soru Metni *</label>
            <textarea value={newQ.text||''} onChange={e=>setNewQ(p=>({...p,text:e.target.value}))} rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500 resize-none"/>
          </div>
          {(['A','B','C','D'] as const).map(opt=>(
            <div key={opt} className="flex items-center gap-2">
              <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{opt}</span>
              <input value={newQ.options?.[opt]||''} onChange={e=>setNewQ(p=>({...p,options:{...p.options!,[opt]:e.target.value}}))}
                placeholder={`${opt} şıkkı...`}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"/>
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Doğru Cevap</label>
            <div className="flex gap-2">
              {(['A','B','C','D'] as const).map(opt=>(
                <button key={opt} onClick={()=>setNewQ(p=>({...p,correct:opt}))}
                  className={cn('flex-1 py-2 rounded-lg border-2 text-sm font-bold transition-all', newQ.correct===opt?'border-green-500 bg-green-50 text-green-700':'border-gray-200 text-gray-500')}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  )
}
