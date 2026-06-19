import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { cn, waLink, absenceMessage, todayISO } from '@/lib/utils'
import { classroomsApi, studentsApi, attendanceApi } from '@/lib/api'
import { useToast } from '@/components/ui'

type Tab = 'yoklama' | 'odev' | 'sinifim' | 'profil'

export default function YoklamaPage() {
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const [tab, setTab] = useState<Tab>('yoklama')

  // Veri state
  const [loading, setLoading] = useState(true)
  const [myClass, setMyClass] = useState<any>(null)
  const [myStudents, setMyStudents] = useState<any[]>([])

  // Yoklama state
  const [selDate, setSelDate] = useState(todayISO())
  const [attendance, setAttendance] = useState<Record<string,'present'|'absent'>>({})
  const [saving, setSaving] = useState(false)

  // WhatsApp — numara localStorage'da, numara gerekmeden wa.me/ çalışır
  const [waPhone, setWaPhone] = useState<string>(() => localStorage.getItem('teacher_wa_' + (user?.id||'')) || '')
  const [waInput, setWaInput] = useState('')
  const [waStep, setWaStep] = useState<'idle'|'input'|'connected'>(() =>
    localStorage.getItem('teacher_wa_' + (user?.id||'')) ? 'connected' : 'idle'
  )

  // Ödev state
  const [odevText, setOdevText] = useState('')
  const [selStudents, setSelStudents] = useState<string[]>([])
  const [odevAll, setOdevAll] = useState(true)

  // Veri yükle
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      try {
        const classes = await classroomsApi.list()
        // Öğretmenin atandığı sınıfı bul (teacher_id veya teacher_name ile)
        const cls = classes.find((c: any) =>
          c.teacher_id === user?.id ||
          c.teacher_name === user?.full_name
        ) || classes[0]

        if (!cls || cancelled) { setLoading(false); return }
        setMyClass(cls)

        const students = await studentsApi.list({ classroom_id: cls.id, status: 'approved' })
        if (!cancelled) setMyStudents(students)
      } catch (e: any) {
        if (!cancelled) toast(e.message || 'Veriler yüklenemedi', 'error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [user?.id])

  // Seçilen tarihin yoklamasını çek
  useEffect(() => {
    if (!myClass?.id) return
    let cancelled = false
    attendanceApi.getByDate(myClass.id, selDate).then((records: any[]) => {
      if (cancelled) return
      const map: Record<string,'present'|'absent'> = {}
      records.forEach((r: any) => { if (r.status === 'present' || r.status === 'absent') map[r.student_id] = r.status })
      setAttendance(map)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [selDate, myClass?.id])

  const mark = (id: string, status: 'present'|'absent') => {
    setAttendance(p => { const n = {...p}; n[id] === status ? delete n[id] : (n[id] = status); return n })
  }

  const saveAtt = async () => {
    if (!myClass?.id) return
    const entries = Object.entries(attendance).map(([student_id, status]) => ({ student_id, status }))
    if (!entries.length) { toast('İşaretleme yapın', 'error'); return }
    setSaving(true)
    try {
      await attendanceApi.save(myClass.id, selDate, entries)
      toast('Yoklama kaydedildi ✅', 'success')
    } catch (e: any) {
      toast(e.message || 'Kayıt başarısız', 'error')
    } finally {
      setSaving(false)
    }
  }

  const absents = myStudents.filter(s => attendance[s.id] === 'absent')
  const presents = myStudents.filter(s => attendance[s.id] === 'present')

  const notifyAbsents = () => {
    absents.forEach((s, i) => {
      setTimeout(() => {
        window.open(waLink(s.parent_phone, absenceMessage(
          `${s.first_name} ${s.last_name}`,
          `${s.parent_first_name} ${s.parent_last_name}`,
          myClass?.name || '', selDate
        )), '_blank')
      }, i * 700)
    })
  }

  const connectWA = () => {
    const phone = waInput.trim()
    if (!phone) { toast('Numara girin', 'error'); return }
    const cleaned = phone.replace(/\s/g, '').replace(/^0/, '90')
    localStorage.setItem('teacher_wa_' + (user?.id || ''), cleaned)
    setWaPhone(cleaned)
    setWaStep('connected')
    setWaInput('')
    toast('WhatsApp numarası kaydedildi ✅', 'success')
  }

  const disconnectWA = () => {
    localStorage.removeItem('teacher_wa_' + (user?.id || ''))
    setWaPhone('')
    setWaStep('idle')
    toast('Bağlantı kesildi', 'info')
  }

  const sendOdev = (s: any) => {
    if (!odevText.trim()) { toast('Ödev açıklaması yazın', 'error'); return }
    const msg = `Sayın ${s.parent_first_name} ${s.parent_last_name} 👋\n\n${s.first_name} ${s.last_name} için ${myClass?.name} dersinden yeni bir ödevimiz var:\n\n📚 ${odevText}\n\nDesteğiniz için teşekkür ederiz 🌿\nMesyo Eğitim`
    window.open(waLink(s.parent_phone, msg), '_blank')
  }

  const sendAllOdev = () => {
    const targets = odevAll ? myStudents : myStudents.filter(s => selStudents.includes(s.id))
    if (!odevText.trim()) { toast('Ödev açıklaması yazın', 'error'); return }
    targets.forEach((s, i) => setTimeout(() => sendOdev(s), i * 700))
    toast(`${targets.length} veliye ödev gönderildi 📱`, 'success')
  }

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center text-gray-400">
        <div className="text-3xl mb-2 animate-pulse">⏳</div>
        <p className="text-sm">Yükleniyor...</p>
      </div>
    </div>
  )

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">

      {/* ÜST BAR — sabit */}
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
              ✅ WA Kayıtlı
            </span>
          )}
          <button onClick={() => setTab('profil')}
            className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {(user?.full_name || 'Ö').charAt(0)}
          </button>
        </div>
      </header>

      {/* ORTA İÇERİK — scroll */}
      <main className="flex-1 overflow-y-auto p-4">

        {/* YOKLAMA */}
        {tab === 'yoklama' && (
          <div className="space-y-3">
            <div className="flex gap-2 flex-wrap items-center">
              <div className="bg-white rounded-xl shadow-sm px-3 py-2 flex items-center gap-2 flex-1">
                <span className="text-sm font-bold text-gray-700 truncate">{myClass?.name || 'Sınıf atanmamış'}</span>
                <span className="text-xs text-gray-400">• {myStudents.length} öğrenci</span>
              </div>
              <input type="date" value={selDate} onChange={e => setSelDate(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-green-500 bg-white" />
            </div>

            {!myClass && (
              <div className="text-center py-12 text-gray-400 bg-white rounded-xl shadow-sm">
                <div className="text-3xl mb-2">🏫</div>
                <p className="text-sm">Henüz bir sınıf atanmamış</p>
                <p className="text-xs text-gray-300 mt-1">Kurum yöneticinizle iletişime geçin</p>
              </div>
            )}

            {myClass && (
              <>
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

                {myStudents.map(s => {
                  const status = attendance[s.id]
                  const fullName = `${s.first_name} ${s.last_name}`
                  const parentName = `${s.parent_first_name} ${s.parent_last_name}`
                  return (
                    <div key={s.id} className={cn('bg-white rounded-xl shadow-sm border-2 overflow-hidden transition-all',
                      status === 'present' ? 'border-green-300 bg-green-50' : status === 'absent' ? 'border-red-300 bg-red-50' : 'border-gray-100')}>
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className={cn('w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0',
                          s.gender === 'erkek' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700')}>
                          {fullName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-gray-900 truncate">{fullName}</div>
                          <div className="text-xs text-gray-400">{parentName}</div>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <button onClick={() => mark(s.id, 'present')}
                            className={cn('px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all',
                              status === 'present' ? 'bg-green-500 text-white border-green-500' : 'border-green-400 text-green-600 bg-white')}>
                            ✓
                          </button>
                          <button onClick={() => mark(s.id, 'absent')}
                            className={cn('px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all',
                              status === 'absent' ? 'bg-red-500 text-white border-red-500' : 'border-red-400 text-red-500 bg-white')}>
                            ✗
                          </button>
                        </div>
                      </div>
                      {status === 'absent' && (
                        <div className="px-4 pb-3 border-t border-red-200">
                          <a href={waLink(s.parent_phone, absenceMessage(fullName, parentName, myClass?.name || '', selDate))}
                            target="_blank" rel="noreferrer"
                            className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-[#25D366] text-white text-xs font-semibold rounded-lg">
                            📱 Veliye Bildir
                          </a>
                        </div>
                      )}
                    </div>
                  )
                })}

                {myStudents.length === 0 && (
                  <div className="text-center py-12 text-gray-400 bg-white rounded-xl shadow-sm">
                    <div className="text-3xl mb-2">👥</div>
                    <p className="text-sm">Bu sınıfta onaylı öğrenci yok</p>
                  </div>
                )}

                {myStudents.length > 0 && (
                  <div className="flex gap-2">
                    <button onClick={saveAtt} disabled={saving}
                      className="flex-1 py-3 bg-[#1B4332] hover:bg-green-800 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-colors">
                      {saving ? '⏳ Kaydediliyor...' : '💾 Yoklamayı Kaydet'}
                    </button>
                    {absents.length > 0 && (
                      <button onClick={notifyAbsents}
                        className="flex-1 py-3 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold rounded-xl text-sm transition-colors">
                        📱 {absents.length} Devamsıza Bildir
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ÖDEV */}
        {tab === 'odev' && (
          <div className="space-y-3">
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
                      <span className="text-sm font-semibold text-gray-800">{s.first_name} {s.last_name}</span>
                    </label>
                  ))}
                </div>
              )}

              <button onClick={sendAllOdev}
                className="w-full py-3 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold rounded-xl text-sm transition-colors">
                📱 {odevAll ? `Tüm Sınıfa Gönder (${myStudents.length})` : `Seçilenlere Gönder (${selStudents.length})`}
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 text-sm font-bold text-gray-900">Tek Tek Gönder</div>
              {myStudents.map(s => (
                <div key={s.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900">{s.first_name} {s.last_name}</div>
                    <div className="text-xs text-gray-400">{s.parent_first_name} {s.parent_last_name}</div>
                  </div>
                  <button onClick={() => sendOdev(s)}
                    className="px-3 py-1.5 bg-[#25D366] text-white text-xs font-semibold rounded-lg">
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
              <div className="grid grid-cols-3 gap-3 mb-1">
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
                    {s.first_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900">{s.first_name} {s.last_name}</div>
                    <div className="text-xs text-gray-400">{s.mahalle || '—'} • Veli: {s.parent_first_name} {s.parent_last_name}</div>
                  </div>
                  <a href={`tel:${s.parent_phone}`}
                    className="px-2.5 py-1.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg">📞</a>
                  <a href={waLink(s.parent_phone, `Sayın ${s.parent_first_name} ${s.parent_last_name}, ${s.first_name} ${s.last_name} ile ilgili görüşmek istiyorum.`)}
                    target="_blank" rel="noreferrer"
                    className="px-2.5 py-1.5 bg-[#25D366] text-white text-xs font-semibold rounded-lg">💬</a>
                </div>
              ))}
              {myStudents.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">Sınıfta öğrenci yok</div>
              )}
            </div>
          </div>
        )}

        {/* PROFİL */}
        {tab === 'profil' && (
          <div className="space-y-3">
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
            </div>

            {/* WhatsApp */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="text-sm font-bold text-gray-900 mb-1">📱 WhatsApp Numaranız</div>
              <div className="text-xs text-gray-500 mb-3 leading-relaxed">
                Numaranızı kaydedin. Devamsız öğrencilere bildirim gönderirken WhatsApp bu numara üzerinden açılır.
              </div>

              {waStep === 'idle' && (
                <>
                  <input type="tel" value={waInput} onChange={e => setWaInput(e.target.value)}
                    placeholder="05XX XXX XX XX"
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-center text-base font-mono outline-none focus:border-green-500 mb-3" />
                  <button onClick={connectWA}
                    className="w-full py-3 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold rounded-xl text-sm transition-colors">
                    ✅ Kaydet
                  </button>
                </>
              )}

              {waStep === 'connected' && (
                <div className="space-y-2">
                  <div className="bg-green-50 border border-green-300 rounded-xl px-4 py-3 flex items-center gap-3">
                    <div className="text-2xl">✅</div>
                    <div>
                      <div className="text-sm font-bold text-green-800">Numara Kayıtlı</div>
                      <div className="text-xs text-green-600 font-mono">{waPhone}</div>
                    </div>
                  </div>
                  <button onClick={() => { setWaStep('input'); setWaInput(waPhone) }}
                    className="w-full py-2.5 border border-gray-200 text-gray-700 font-semibold rounded-xl text-sm hover:bg-gray-50">
                    ✏️ Değiştir
                  </button>
                  <button onClick={disconnectWA}
                    className="w-full py-2.5 border border-red-200 text-red-500 font-semibold rounded-xl text-sm hover:bg-red-50">
                    🗑️ Kaldır
                  </button>
                </div>
              )}

              {waStep === 'input' && (
                <div className="space-y-2">
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

            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="text-sm font-bold text-gray-900 mb-3">ℹ️ Nasıl Çalışır?</div>
              <div className="space-y-2">
                {[
                  '1. Yoklamada devamsız öğrencileri işaretleyin',
                  '2. "Devamsızları Bildir" butonuna basın',
                  '3. Her veli için WhatsApp açılır, mesaj hazır gelir',
                  '4. Telefonunuzdan "Gönder"e basın',
                ].map(t => (
                  <div key={t} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-green-500 flex-shrink-0">•</span>{t}
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => { logout(); window.location.href = '/login' }}
              className="w-full py-3 border-2 border-red-200 text-red-500 font-bold rounded-xl text-sm hover:bg-red-50 transition-colors">
              🚪 Çıkış Yap
            </button>
          </div>
        )}
      </main>

      {/* ALT MENÜ — sabit */}
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
