import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { cn, waLink, absenceMessage, todayISO } from '@/lib/utils'
import { DEMO_STUDENTS, DEMO_CLASSROOMS } from '@/lib/demo-data'
import { useToast } from '@/components/ui'

type Tab = 'yoklama' | 'odev' | 'sinifim' | 'profil'

const DEMO_ATT: Record<string, Record<string, 'present'|'absent'>> = {
  [todayISO()]: {},
  '2026-06-13': { s1:'absent', s3:'absent' },
  '2026-06-12': { s2:'absent' },
}

export default function YoklamaPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [tab, setTab] = useState<Tab>('yoklama')

  // Öğretmenin sınıfı
  const myClass = DEMO_CLASSROOMS.find(c => c.teacher_name === user?.full_name) || DEMO_CLASSROOMS[0]
  const myStudents = DEMO_STUDENTS.filter(s => s.classroom_id === myClass?.id)

  // Yoklama state
  const [selDate, setSelDate] = useState(todayISO())
  const [attendance, setAttendance] = useState<Record<string,'present'|'absent'>>({})
  const [saved, setSaved] = useState(false)

  // WA state
  const [waPhone, setWaPhone] = useState<string>(() => localStorage.getItem('teacher_wa_' + (user?.id||'')) || '')
  const [waInput, setWaInput] = useState('')
  const [waStep, setWaStep] = useState<'idle'|'input'|'connected'>(() =>
    localStorage.getItem('teacher_wa_' + (user?.id||'')) ? 'connected' : 'idle'
  )

  // Ödev state
  const [odevText, setOdevText] = useState('')
  const [selStudents, setSelStudents] = useState<string[]>([])
  const [odevAll, setOdevAll] = useState(true)

  useEffect(() => {
    const saved = DEMO_ATT[selDate] || {}
    const filtered = Object.fromEntries(
      Object.entries(saved).filter(([k]) => myStudents.some(s => s.id === k))
    )
    setAttendance(filtered as Record<string,'present'|'absent'>)
    setSaved(false)
  }, [selDate])

  const mark = (id: string, status: 'present'|'absent') => {
    setAttendance(p => {
      const n = { ...p }
      n[id] === status ? delete n[id] : (n[id] = status)
      return n
    })
    setSaved(false)
  }

  const saveAtt = () => {
    setSaved(true)
    toast('Yoklama kaydedildi ✅', 'success')
  }

  const absents = myStudents.filter(s => attendance[s.id] === 'absent')
  const presents = myStudents.filter(s => attendance[s.id] === 'present')

  const notifyAbsents = () => {
    if (!waPhone) { toast('Önce WhatsApp numaranızı bağlayın', 'error'); return }
    absents.forEach((s, i) => {
      setTimeout(() => {
        window.open(waLink(s.parent_phone, absenceMessage((s.first_name + ' ' + s.last_name), (s.parent_first_name + ' ' + s.parent_last_name), myClass?.name || '', selDate)), '_blank')
      }, i * 700)
    })
  }

  const connectWA = () => {
    const phone = waStep === 'input' ? waInput : waPhone
    if (!phone.trim()) { toast('Numara girin', 'error'); return }
    const cleaned = phone.replace(/\s/g, '').replace(/^0/, '90')
    localStorage.setItem('teacher_wa_' + (user?.id || ''), cleaned)
    setWaPhone(cleaned)
    setWaStep('connected')
    toast('WhatsApp bağlandı ✅', 'success')
  }

  const disconnectWA = () => {
    localStorage.removeItem('teacher_wa_' + (user?.id || ''))
    setWaPhone('')
    setWaStep('idle')
    toast('Bağlantı kesildi', 'info')
  }

  const sendOdev = (student: typeof myStudents[0]) => {
    if (!waPhone) { toast('Önce WhatsApp numaranızı bağlayın', 'error'); return }
    if (!odevText.trim()) { toast('Ödev açıklaması yazın', 'error'); return }
    const msg = `Sayın ${(student.parent_first_name + ' ' + student.parent_last_name)} 👋\n\n${(student.first_name + ' ' + student.last_name)} için ${myClass?.name} dersinden yeni bir ödevimiz var:\n\n📚 ${odevText}\n\nDesteğiniz için teşekkür ederiz 🌿\nMesyo Eğitim`
    window.open(waLink(student.parent_phone, msg), '_blank')
  }

  const sendAllOdev = () => {
    const targets = odevAll ? myStudents : myStudents.filter(s => selStudents.includes(s.id))
    if (!waPhone) { toast('Önce WhatsApp numaranızı bağlayın', 'error'); return }
    if (!odevText.trim()) { toast('Ödev açıklaması yazın', 'error'); return }
    targets.forEach((s, i) => setTimeout(() => sendOdev(s), i * 700))
    toast(`${targets.length} veliye ödev gönderildi 📱`, 'success')
  }

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Topbar */}
      <header className="bg-[#1B4332] px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-base">📚</div>
          <div>
            <div className="text-white font-bold text-sm">Mesyo Soft</div>
            <div className="text-white/40 text-[10px]">Öğretmen Paneli</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {waStep === 'connected' && (
            <span className="text-[10px] bg-green-500/20 text-green-300 border border-green-500/30 px-2 py-1 rounded-full font-bold">
              ✅ WA Bağlı
            </span>
          )}
          <button onClick={() => setTab('profil')}
            className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {(user?.full_name || 'Ö').charAt(0)}
          </button>
        </div>
      </header>

      {/* İçerik */}
      <main className="flex-1 overflow-y-auto p-4">

        {/* YOKLAMA */}
        {tab === 'yoklama' && (
          <div className="space-y-3">
            <div className="flex gap-2 flex-wrap items-center">
              <div className="bg-white rounded-xl shadow-sm px-3 py-2 flex items-center gap-2 flex-1">
                <span className="text-sm font-bold text-gray-700 truncate">{myClass?.name || 'Sınıf'}</span>
                <span className="text-xs text-gray-400">• {myStudents.length} öğrenci</span>
              </div>
              <input type="date" value={selDate} onChange={e => setSelDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500 bg-white" />
            </div>

            {/* Özet */}
            <div className="grid grid-cols-3 gap-2">
              {[
                ['✅ Geldi', presents.length, 'text-green-600'],
                ['❌ Gelmedi', absents.length, 'text-red-500'],
                ['⏳ Bekliyor', myStudents.length - presents.length - absents.length, 'text-amber-500'],
              ].map(([l, v, c]) => (
                <div key={l as string} className="bg-white rounded-xl shadow-sm p-3 text-center">
                  <div className={`text-2xl font-extrabold ${c}`}>{v}</div>
                  <div className="text-[10px] text-gray-400 font-semibold mt-0.5">{l}</div>
                </div>
              ))}
            </div>

            {/* Öğrenci listesi */}
            {myStudents.map(s => {
              const status = attendance[s.id]
              return (
                <div key={s.id} className={cn('bg-white rounded-xl shadow-sm border-2 overflow-hidden transition-all',
                  status === 'present' ? 'border-green-300' : status === 'absent' ? 'border-red-300' : 'border-gray-100')}>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className={cn('w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0',
                      s.gender === 'erkek' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700')}>
                      {(s.first_name + ' ' + s.last_name).charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-gray-900 truncate">{(s.first_name + ' ' + s.last_name)}</div>
                      <div className="text-xs text-gray-400">{(s.parent_first_name + ' ' + s.parent_last_name)}</div>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button onClick={() => mark(s.id, 'present')}
                        className={cn('px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all',
                          status === 'present' ? 'bg-green-500 text-white border-green-500' : 'border-green-400 text-green-600 bg-white')}>
                        ✓ Geldi
                      </button>
                      <button onClick={() => mark(s.id, 'absent')}
                        className={cn('px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all',
                          status === 'absent' ? 'bg-red-500 text-white border-red-500' : 'border-red-400 text-red-500 bg-white')}>
                        ✗ Gelmedi
                      </button>
                    </div>
                  </div>
                  {status === 'absent' && waStep === 'connected' && (
                    <div className="px-4 pb-3">
                      <a href={waLink(s.parent_phone, absenceMessage((s.first_name + ' ' + s.last_name), (s.parent_first_name + ' ' + s.parent_last_name), myClass?.name || '', selDate))}
                        target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] text-white text-xs font-semibold rounded-lg">
                        📱 Veliye Bildir
                      </a>
                    </div>
                  )}
                </div>
              )
            })}

            {myStudents.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <div className="text-3xl mb-2">👥</div>
                <p className="text-sm">Sınıfınızda öğrenci yok</p>
              </div>
            )}

            {/* Kaydet + toplu bildir */}
            {myStudents.length > 0 && (
              <div className="flex gap-2">
                <button onClick={saveAtt}
                  className={cn('flex-1 py-3 font-bold rounded-xl text-sm transition-colors',
                    saved ? 'bg-green-50 border border-green-300 text-green-700' : 'bg-[#1B4332] text-white hover:bg-green-800')}>
                  {saved ? '✅ Kaydedildi' : '💾 Kaydet'}
                </button>
                {absents.length > 0 && waStep === 'connected' && (
                  <button onClick={notifyAbsents}
                    className="flex-1 py-3 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold rounded-xl text-sm transition-colors">
                    📱 {absents.length} Devamsıza Bildir
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ÖDEV */}
        {tab === 'odev' && (
          <div className="space-y-3">
            {waStep !== 'connected' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                ⚠️ Ödev göndermek için önce WhatsApp numaranızı bağlayın (Profil sekmesi).
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="text-sm font-bold text-gray-900 mb-3">📚 Ödev Metni</div>
              <textarea value={odevText} onChange={e => setOdevText(e.target.value)}
                rows={4} placeholder="Ödev açıklamasını yazın..."
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500 resize-none" />
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="text-sm font-bold text-gray-900 mb-3">Kime Gönderilecek?</div>
              <div className="flex gap-2 mb-3">
                <button onClick={() => setOdevAll(true)}
                  className={cn('flex-1 py-2 rounded-xl border-2 text-xs font-bold transition-all',
                    odevAll ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500')}>
                  👥 Tüm Sınıf ({myStudents.length})
                </button>
                <button onClick={() => setOdevAll(false)}
                  className={cn('flex-1 py-2 rounded-xl border-2 text-xs font-bold transition-all',
                    !odevAll ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500')}>
                  🎯 Seç
                </button>
              </div>

              {!odevAll && (
                <div className="space-y-1.5 mb-3">
                  {myStudents.map(s => (
                    <label key={s.id} className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all',
                      selStudents.includes(s.id) ? 'border-green-400 bg-green-50' : 'border-gray-200')}>
                      <input type="checkbox" checked={selStudents.includes(s.id)}
                        onChange={() => setSelStudents(p => p.includes(s.id) ? p.filter(x => x !== s.id) : [...p, s.id])}
                        className="w-4 h-4 accent-green-500" />
                      <span className="text-sm font-semibold text-gray-800">{(s.first_name + ' ' + s.last_name)}</span>
                      <span className="text-xs text-gray-400 ml-auto">{(s.parent_first_name + ' ' + s.parent_last_name)}</span>
                    </label>
                  ))}
                </div>
              )}

              <button onClick={sendAllOdev} disabled={waStep !== 'connected'}
                className="w-full py-3 bg-[#25D366] hover:bg-[#128C7E] disabled:opacity-40 text-white font-bold rounded-xl text-sm transition-colors">
                📱 {odevAll ? `Tüm Sınıfa Gönder (${myStudents.length})` : `Seçilenlere Gönder (${selStudents.length})`}
              </button>
            </div>

            {/* Tek tek gönder */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 text-sm font-bold text-gray-900">Tek Tek Gönder</div>
              {myStudents.map(s => (
                <div key={s.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900">{(s.first_name + ' ' + s.last_name)}</div>
                    <div className="text-xs text-gray-400">{(s.parent_first_name + ' ' + s.parent_last_name)}</div>
                  </div>
                  <button onClick={() => sendOdev(s)} disabled={waStep !== 'connected'}
                    className="px-3 py-1.5 bg-[#25D366] disabled:opacity-40 text-white text-xs font-semibold rounded-lg">
                    📱 Gönder
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SINIFIM */}
        {tab === 'sinifim' && (
          <div className="space-y-3">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="text-sm font-bold text-gray-900 mb-3">{myClass?.name || 'Sınıfım'}</div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                {[
                  ['Öğrenci', myStudents.length, 'text-gray-900'],
                  ['Erkek', myStudents.filter(s=>s.gender==='erkek').length, 'text-blue-600'],
                  ['Kız', myStudents.filter(s=>s.gender==='kiz').length, 'text-pink-600'],
                ].map(([l,v,c])=>(
                  <div key={l as string} className="bg-gray-50 rounded-xl p-3 text-center">
                    <div className={`text-xl font-extrabold ${c}`}>{v}</div>
                    <div className="text-xs text-gray-400">{l}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 text-sm font-bold text-gray-900">Öğrenci Listesi</div>
              {myStudents.map(s => (
                <div key={s.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
                  <div className={cn('w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0',
                    s.gender === 'erkek' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700')}>
                    {(s.first_name + ' ' + s.last_name).charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900">{(s.first_name + ' ' + s.last_name)}</div>
                    <div className="text-xs text-gray-400">{s.mahalle || '—'} • Veli: {(s.parent_first_name + ' ' + s.parent_last_name)}</div>
                  </div>
                  <a href={`tel:${s.parent_phone}`}
                    className="px-2.5 py-1.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50">
                    📞
                  </a>
                  <a href={waLink(s.parent_phone, `Sayın ${(s.parent_first_name + ' ' + s.parent_last_name)}, ${(s.first_name + ' ' + s.last_name)} ile ilgili görüşmek istiyorum.`)}
                    target="_blank" rel="noreferrer"
                    className="px-2.5 py-1.5 bg-[#25D366] text-white text-xs font-semibold rounded-lg">
                    💬
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PROFİL */}
        {tab === 'profil' && (
          <div className="space-y-3">
            {/* Kullanıcı kartı */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-white font-extrabold text-xl">
                  {(user?.full_name || 'Ö').charAt(0)}
                </div>
                <div>
                  <div className="text-base font-bold text-gray-900">{user?.full_name || 'Öğretmen'}</div>
                  <div className="text-sm text-gray-500">{myClass?.name || 'Sınıf atanmamış'}</div>
                  <div className="text-xs text-gray-400 mt-0.5">Öğretmen</div>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  ['Sınıf', myClass?.name || '—'],
                  ['Öğrenci Sayısı', myStudents.length + ' öğrenci'],
                ].map(([l,v])=>(
                  <div key={l} className="flex items-center py-2 border-b border-gray-50 last:border-0">
                    <span className="text-xs font-semibold text-gray-400 w-28">{l}</span>
                    <span className="text-sm text-gray-700">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* WhatsApp bağlantısı */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="text-sm font-bold text-gray-900 mb-3">📱 WhatsApp Bağlantısı</div>

              {waStep === 'idle' && (
                <>
                  <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                    Yoklama ve ödev bildirimlerini gönderebilmek için kendi WhatsApp numaranızı bağlayın.
                  </p>
                  <input type="tel" value={waInput} onChange={e => setWaInput(e.target.value)}
                    placeholder="05XX XXX XX XX" onKeyDown={e => e.key === 'Enter' && connectWA()}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-center text-base font-mono outline-none focus:border-green-500 mb-3" />
                  <button onClick={connectWA}
                    className="w-full py-3 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold rounded-xl text-sm transition-colors">
                    ✅ Kaydet ve Bağla
                  </button>
                </>
              )}

              {waStep === 'connected' && (
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-300 rounded-xl px-4 py-3 flex items-center gap-3">
                    <div className="text-2xl">✅</div>
                    <div>
                      <div className="text-sm font-bold text-green-800">WhatsApp Bağlı</div>
                      <div className="text-xs text-green-600 font-mono">{waPhone}</div>
                    </div>
                  </div>
                  <button onClick={() => { setWaStep('input'); setWaInput(waPhone) }}
                    className="w-full py-2.5 border border-gray-200 text-gray-700 font-semibold rounded-xl text-sm hover:bg-gray-50 transition-colors">
                    ✏️ Numarayı Değiştir
                  </button>
                  <button onClick={disconnectWA}
                    className="w-full py-2.5 border border-red-200 text-red-500 font-semibold rounded-xl text-sm hover:bg-red-50 transition-colors">
                    🔌 Bağlantıyı Kes
                  </button>
                </div>
              )}

              {waStep === 'input' && (
                <div className="space-y-3">
                  <input type="tel" value={waInput} onChange={e => setWaInput(e.target.value)}
                    placeholder="Yeni numara"
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-center text-base font-mono outline-none focus:border-green-500" />
                  <div className="flex gap-2">
                    <button onClick={() => setWaStep('connected')}
                      className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-xl text-sm">İptal</button>
                    <button onClick={connectWA}
                      className="flex-1 py-2.5 bg-[#25D366] text-white font-bold rounded-xl text-sm">Kaydet</button>
                  </div>
                </div>
              )}
            </div>

            {/* Nasıl çalışır */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="text-sm font-bold text-gray-900 mb-3">ℹ️ Nasıl Çalışır?</div>
              <div className="space-y-2.5">
                {[
                  ['1', 'Telefonunuzun numarasını girin ve kaydedin'],
                  ['2', 'Yoklamada devamsız öğrencileri "✗ Gelmedi" ile işaretleyin'],
                  ['3', '"Devamsızları Bildir" butonuna tıklayın'],
                  ['4', 'Her veli için WhatsApp açılır, mesaj hazır gelir'],
                  ['5', 'Telefonunuzdan "Gönder"e basın — hepsi bu!'],
                ].map(([n, t]) => (
                  <div key={n} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{n}</div>
                    <div className="text-sm text-gray-600">{t}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Çıkış */}
            <button onClick={handleLogout}
              className="w-full py-3 border-2 border-red-200 text-red-500 font-bold rounded-xl text-sm hover:bg-red-50 transition-colors">
              🚪 Çıkış Yap
            </button>
          </div>
        )}
      </main>

      {/* Alt menü */}
      <nav className="flex bg-white border-t border-gray-200 flex-shrink-0">
        {([
          ['yoklama', '✅', 'Yoklama'],
          ['odev', '📚', 'Ödev'],
          ['sinifim', '🏫', 'Sınıfım'],
          ['profil', '👤', 'Profil'],
        ] as const).map(([t, icon, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('flex-1 flex flex-col items-center py-3 gap-0.5 text-[10px] font-semibold transition-colors',
              tab === t ? 'text-green-600' : 'text-gray-400')}>
            <span className="text-xl">{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
