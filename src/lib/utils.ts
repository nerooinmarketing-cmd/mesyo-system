export function calcAge(birthDate: string): number {
  if (!birthDate) return 0
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export function isEligible(birthDate: string): boolean {
  const a = calcAge(birthDate)
  return a >= 7 && a <= 14
}

export function ageLabel(birthDate: string): string {
  if (!birthDate) return '—'
  const a = calcAge(birthDate)
  if (a < 7) return `${a} yaş ⚠️`
  if (a > 14) return `${a} yaş ⚠️`
  return `${a} yaş`
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  const months = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

export function formatPhone(phone: string): string {
  return phone.replace(/^0/, '90')
}

export function waLink(phone: string, message: string): string {
  const normalized = phone.replace(/\s/g,'').replace(/^0/, '90')
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`
}

// Devamsızlık bildirimi — samimi, naif, şık
export function absenceMessage(
  studentName: string,
  parentName: string,
  classroomName: string,
  date: string
): string {
  return `Sayın ${parentName} 👋

${studentName}'in bugün (${date}) eğitim programına katılamadığını fark ettik.

Umarız her şey yolundadır. Bir durum varsa bizimle paylaşmaktan çekinmeyin.

Sevgi ve saygılarımızla 🌿
Mesyo Eğitim`
}

// Ödev bildirimi — samimi, naif, şık
export function assignmentMessage(
  studentName: string,
  parentName: string,
  classroomName: string,
  title: string,
  description: string,
  dueDate?: string
): string {
  const dueText = dueDate
    ? `\n📅 Teslim tarihi: ${new Date(dueDate).toLocaleDateString('tr-TR')}`
    : ''
  return `Sayın ${parentName} 👋

${studentName} için ${classroomName} dersinden yeni bir çalışmamız var:

✏️ *${title}*
${description}${dueText}

Desteğiniz için teşekkür ederiz 🌿
Sevgi ve saygılarımızla,
Mesyo Eğitim`
}

// Sezon daveti — arşivdeki velilere
export function inviteMessage(
  parentName: string,
  studentName: string,
  nextYear: number
): string {
  return `Sayın ${parentName} 👋

${studentName}'in geçen yıl aramızda olması bizim için çok değerliydi.

${nextYear} yılı eğitim programımız yakında başlıyor. ${studentName}'i tekrar aramızda görmekten mutluluk duyarız 💚

Kayıt ve bilgi için lütfen bizimle iletişime geçiniz.

Sevgi ve saygılarımızla 🌿
Mesyo Eğitim`
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export function dateRangeDays(start: string, end: string): string[] {
  const dates: string[] = []
  const cur = new Date(start)
  const endD = new Date(end)
  while (cur <= endD) {
    dates.push(cur.toISOString().split('T')[0])
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

const DAYS = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi']
const MONTHS_LONG = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']

export function formatDateLong(dateStr: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`
}
