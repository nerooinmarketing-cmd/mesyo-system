import * as XLSX from 'xlsx'
import { calcAge } from './utils'
import { DEMO_CLASSROOMS } from './demo-data'

export function exportStudentsXLSX(students: any[], filename: string) {
  const headers = [
    'Ad', 'Soyad', 'T.C. No', 'Cinsiyet', 'Yaş', 'Doğum Tarihi', 'Sınıf',
    'İl', 'İlçe', 'Mahalle', 'Sokak', 'Veli Adı', 'Veli Soyadı', 'Veli Telefon', 'Başvuru Tarihi'
  ]

  const rows = students.map(s => {
    const cls = DEMO_CLASSROOMS.find(c => c.id === s.classroom_id)
    return [
      s.first_name,
      s.last_name,
      s.tc_no || '—',
      s.gender === 'erkek' ? 'Erkek' : 'Kız',
      calcAge(s.birth_date),
      s.birth_date,
      cls?.name || '—',
      s.city || '—',
      s.district || '—',
      s.mahalle || '—',
      s.sokak || '—',
      s.parent_first_name,
      s.parent_last_name,
      s.parent_phone,
      s.created_at,
    ]
  })

  const wsData = [headers, ...rows]
  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Kolon genişlikleri
  ws['!cols'] = [
    { wch: 14 }, // Ad
    { wch: 14 }, // Soyad
    { wch: 14 }, // T.C. No
    { wch: 10 }, // Cinsiyet
    { wch: 6 },  // Yaş
    { wch: 14 }, // Doğum Tarihi
    { wch: 18 }, // Sınıf
    { wch: 10 }, // İl
    { wch: 12 }, // İlçe
    { wch: 18 }, // Mahalle
    { wch: 18 }, // Sokak
    { wch: 14 }, // Veli Adı
    { wch: 14 }, // Veli Soyadı
    { wch: 15 }, // Veli Telefon
    { wch: 14 }, // Başvuru Tarihi
  ]

  // Header stili (bold)
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
  for (let C = range.s.c; C <= range.e.c; C++) {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c: C })]
    if (cell) {
      cell.s = { font: { bold: true }, fill: { fgColor: { rgb: '1B4332' } }, font2: { color: { rgb: 'FFFFFF' } } }
    }
  }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Öğrenciler')
  XLSX.writeFile(wb, `${filename}.xlsx`)
}
