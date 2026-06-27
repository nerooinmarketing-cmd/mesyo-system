import { useState, useRef, useEffect } from 'react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { useToast } from '@/components/ui'
import { studentsApi, classroomsApi, seasonsApi } from '@/lib/api'
import * as XLSX from 'xlsx'

interface ParsedStudent {
  first_name: string
  last_name: string
  birth_date?: string
  gender: string
  age?: number
  tc_no?: string
  address?: string
  parent_name: string
  parent_first_name?: string
  parent_last_name?: string
  parent_address?: string
  parent_phone: string
  registration_date?: string
  classroom_name?: string
  classroom_id?: string
  error?: string
}

export default function StudentImportPage() {
  const { toast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [students, setStudents] = useState<ParsedStudent[]>([])
  const [classrooms, setClassrooms] = useState<any[]>([])
  const [seasons, setSeasons] = useState<any[]>([])
  const [selSeason, setSelSeason] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload')

  useEffect(() => {
    classroomsApi.list().then(setClassrooms).catch(() => {})
    seasonsApi.list().then((s: any[]) => {
      setSeasons(s)
      const active = s.find(x => x.is_active)
      if (active) setSelSeason(active.id)
    }).catch(() => {})
  }, [])

  const parseExcel = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: 'binary' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' })

        const parsed: ParsedStudent[] = rows.slice(0, 200).map((row, i) => {
          const first_name = String(row['ADI *'] || row['ADI'] || row['Ad *'] || row['Ad'] || '').trim()
          const last_name = String(row['SOYADI *'] || row['SOYADI'] || row['Soyad *'] || row['Soyad'] || '').trim()
          const gender_raw = String(row['CİNSİYET *'] || row['CİNSİYET'] || row['Cinsiyet'] || 'kiz').trim().toLowerCase()
          const parent_first_name = String(row['VELİ ADI *'] || row['VELİ ADI'] || '').trim()
          const parent_last_name = String(row['VELİ SOYADI *'] || row['VELİ SOYADI'] || '').trim()
          const parent_name = parent_first_name && parent_last_name ? `${parent_first_name} ${parent_last_name}` : (parent_first_name || parent_last_name || String(row['Veli Adı Soyadı *'] || row['Veli Adı'] || '').trim())
          const parent_phone = String(row['GSM NUMARASI *'] || row['GSM NUMARASI'] || row['Veli Telefonu *'] || row['Veli Telefonu'] || '').trim()
          const parent_address = String(row['VELİ ADRESİ'] || row['Veli Adresi'] || '').trim()
          const birth_date_raw = String(row['DOĞUM TARİHİ'] || row['Doğum Tarihi'] || '').trim()
          const tc_no = String(row['TC NO'] || row['TC Kimlik No'] || row['TC'] || '').trim()
          const address = String(row['ADRES'] || row['Adres'] || '').trim()
          const age_raw = row['YAŞI'] || row['Yaşı'] || row['YAŞ'] || ''
          const age = age_raw ? parseInt(String(age_raw)) : undefined
          const registration_date_raw = String(row['KAYIT TARİHİ'] || row['Kayıt Tarihi'] || '').trim()
          const classroom_name = String(row['SINIF'] || row['Sınıf Adı'] || row['Sınıf'] || '').trim()

          const gender = gender_raw === 'erkek' ? 'erkek' : 'kiz'

          let error = ''
          if (!first_name) error += 'Ad eksik. '
          if (!last_name) error += 'Soyad eksik. '
          if (!parent_name) error += 'Veli adı eksik. '
          if (!parent_phone) error += 'Telefon eksik. '

          // Doğum tarihi formatla
          let birth_date = ''
          if (birth_date_raw) {
            if (/^\d{4}-\d{2}-\d{2}$/.test(birth_date_raw)) {
              birth_date = birth_date_raw
            } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(birth_date_raw)) {
              const [d, m, y] = birth_date_raw.split('/')
              birth_date = `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`
            } else if (typeof row['Doğum Tarihi (YYYY-AA-GG)'] === 'number') {
              // Excel tarih sayısı
              const date = XLSX.SSF.parse_date_code(row['Doğum Tarihi (YYYY-AA-GG)'])
              birth_date = `${date.y}-${String(date.m).padStart(2,'0')}-${String(date.d).padStart(2,'0')}`
            }
          }

          // Sınıf eşleştir
          const cls = classrooms.find(c =>
            c.name.toLowerCase() === classroom_name.toLowerCase() ||
            c.name.toLowerCase().includes(classroom_name.toLowerCase())
          )

          // Kayıt tarihi formatla
          let registration_date = ''
          if (registration_date_raw && /^\d{4}-\d{2}-\d{2}$/.test(registration_date_raw)) {
            registration_date = registration_date_raw
          }

          return {
            first_name, last_name, gender,
            age: isNaN(age as number) ? undefined : age,
            tc_no: tc_no || undefined,
            address: address || undefined,
            parent_name, parent_phone,
            parent_first_name: parent_first_name || undefined,
            parent_last_name: parent_last_name || undefined,
            parent_address: parent_address || undefined,
            birth_date: birth_date || undefined,
            registration_date: registration_date || undefined,
            classroom_name: classroom_name || undefined,
            classroom_id: cls?.id,
            error: error || undefined,
          }
        }).filter(s => s.first_name || s.last_name) // Boş satırları atla

        setStudents(parsed)
        setStep('preview')
      } catch (err) {
        toast('Excel dosyası okunamadı', 'error')
      }
    }
    reader.readAsBinaryString(file)
  }

  const validStudents = students.filter(s => !s.error)
  const invalidStudents = students.filter(s => s.error)

  const handleImport = async () => {
    if (validStudents.length === 0) { toast('Yüklenecek geçerli öğrenci yok', 'error'); return }
    setLoading(true)
    try {
      const token = localStorage.getItem('mesyo_token')
      const res = await fetch('/api/students/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          season_id: selSeason || null,
          students: validStudents.map(s => ({
            first_name: s.first_name,
            last_name: s.last_name,
            full_name: `${s.first_name} ${s.last_name}`,
            gender: s.gender,
            age: s.age,
            tc_no: s.tc_no,
            address: s.address,
            parent_name: s.parent_name,
            parent_first_name: s.parent_first_name,
            parent_last_name: s.parent_last_name,
            parent_address: s.parent_address,
            parent_phone: s.parent_phone,
            birth_date: s.birth_date,
            registration_date: s.registration_date,
            classroom_id: s.classroom_id,
          }))
        })
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.detail || 'Hata')
      toast(`${d.count} öğrenci eklendi ✅`, 'success')
      setStep('done')
    } catch (e: any) {
      toast(e.message || 'Yükleme başarısız', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">📊 Toplu Öğrenci Yükle</h1>
            <p className="text-sm text-gray-500">Excel dosyasından öğrencileri içe aktarın</p>
          </div>
          <a href="/ogrenci_sablonu.xlsx" download
            className="px-4 py-2 bg-green-500 text-white text-sm font-bold rounded-xl hover:bg-green-600">
            📥 Şablon İndir
          </a>
        </div>

        {/* Adım göstergesi */}
        <div className="flex items-center gap-2">
          {[
            { n: 1, label: 'Excel Yükle', s: 'upload' },
            { n: 2, label: 'Önizleme', s: 'preview' },
            { n: 3, label: 'Tamamlandı', s: 'done' },
          ].map((item, i) => (
            <div key={item.s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step === item.s ? 'bg-green-500 text-white' :
                (step === 'preview' && i === 0) || (step === 'done' && i < 2) ? 'bg-green-200 text-green-700' :
                'bg-gray-100 text-gray-400'
              }`}>{item.n}</div>
              <span className="text-sm text-gray-500">{item.label}</span>
              {i < 2 && <div className="w-8 h-px bg-gray-200"/>}
            </div>
          ))}
        </div>

        {/* ADIM 1: UPLOAD */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
              <div className="font-bold mb-2">📋 Nasıl Kullanılır?</div>
              <ol className="space-y-1 list-decimal list-inside">
                <li>Şablon Excel dosyasını indirin</li>
                <li>Öğrenci bilgilerini doldurun (yeşil örnek satırları silin)</li>
                <li>Dosyayı buraya yükleyin</li>
                <li>Önizlemede kontrol edin ve onaylayın</li>
              </ol>
            </div>

            <div
              className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition-all"
              onClick={() => fileRef.current?.click()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) parseExcel(f) }}
              onDragOver={(e) => e.preventDefault()}>
              <div className="text-5xl mb-3">📊</div>
              <div className="text-gray-600 font-semibold">Excel dosyasını buraya sürükleyin</div>
              <div className="text-gray-400 text-sm mt-1">veya tıklayarak seçin (.xlsx, .xls)</div>
              <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) parseExcel(f) }}/>
            </div>
          </div>
        )}

        {/* ADIM 2: ÖNİZLEME */}
        {step === 'preview' && (
          <div className="space-y-4">
            {/* Özet */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-green-700">{validStudents.length}</div>
                <div className="text-xs text-green-600">Geçerli Öğrenci</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-red-700">{invalidStudents.length}</div>
                <div className="text-xs text-red-600">Hatalı Satır</div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-gray-700">{students.length}</div>
                <div className="text-xs text-gray-500">Toplam</div>
              </div>
            </div>

            {/* Sezon seçimi */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
              <label className="text-sm font-bold text-gray-700">Sezon:</label>
              <select value={selSeason} onChange={e=>setSelSeason(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500">
                <option value="">Sezon seçin</option>
                {seasons.map(s => <option key={s.id} value={s.id}>{s.name}{s.is_active ? ' (Aktif)' : ''}</option>)}
              </select>
            </div>

            {/* Hatalı satırlar */}
            {invalidStudents.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="font-bold text-red-700 mb-2">⚠️ Hatalı Satırlar (yüklenmeyecek)</div>
                {invalidStudents.map((s, i) => (
                  <div key={i} className="text-xs text-red-600 py-1 border-b border-red-100 last:border-0">
                    {s.first_name} {s.last_name} — {s.error}
                  </div>
                ))}
              </div>
            )}

            {/* Geçerli öğrenciler tablosu */}
            {validStudents.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <span className="font-bold text-gray-900">✅ Yüklenecek Öğrenciler</span>
                  <span className="text-xs text-gray-400">{validStudents.length} öğrenci</span>
                </div>
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        {['#','Ad Soyad','Cinsiyet','Veli','Telefon','Sınıf','Doğum'].map(h=>(
                          <th key={h} className="px-3 py-2 text-left text-xs font-bold text-gray-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {validStudents.map((s, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-gray-400 text-xs">{i+1}</td>
                          <td className="px-3 py-2 font-semibold">{s.first_name} {s.last_name}</td>
                          <td className="px-3 py-2">{s.gender === 'kiz' ? '👧 Kız' : '👦 Erkek'}</td>
                          <td className="px-3 py-2 text-gray-600">{s.parent_name}</td>
                          <td className="px-3 py-2 text-gray-600">{s.parent_phone}</td>
                          <td className="px-3 py-2">
                            {s.classroom_id
                              ? <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">{s.classroom_name}</span>
                              : s.classroom_name
                                ? <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">⚠️ {s.classroom_name}</span>
                                : <span className="text-gray-300">—</span>
                            }
                          </td>
                          <td className="px-3 py-2 text-gray-500 text-xs">{s.birth_date || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => { setStep('upload'); setStudents([]) }}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold">
                ← Geri Dön
              </button>
              <button onClick={handleImport} disabled={loading || validStudents.length === 0}
                className="flex-1 py-2 bg-green-500 text-white rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-green-600">
                {loading ? '⏳ Yükleniyor...' : `✅ ${validStudents.length} Öğrenciyi Yükle`}
              </button>
            </div>
          </div>
        )}

        {/* ADIM 3: TAMAMLANDI */}
        {step === 'done' && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Yükleme Tamamlandı!</h2>
            <p className="text-gray-500 mb-6">{validStudents.length} öğrenci sisteme eklendi.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => { setStep('upload'); setStudents([]) }}
                className="px-6 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold">
                Yeni Yükleme
              </button>
              <a href="/admin/students"
                className="px-6 py-2 bg-green-500 text-white rounded-xl text-sm font-bold hover:bg-green-600">
                Öğrenci Listesine Git →
              </a>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
