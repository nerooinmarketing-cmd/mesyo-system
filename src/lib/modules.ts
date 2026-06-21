// ─── MODÜL TANIMI ─────────────────────────────────────────────────────────────
export interface Module {
  id: string
  name: string
  description: string
  icon: string
  category: 'core' | 'advanced' | 'communication' | 'reporting'
  route?: string
  navItem?: boolean
  adminOnly?: boolean   // sadece superadmin aktif edebilir
  default: boolean      // yeni kurum açılınca varsayılan açık mı?
}

export const ALL_MODULES: Module[] = [
  // CORE — temel, her zaman açık
  { id:'students',      name:'Öğrenci Yönetimi',    description:'Öğrenci listesi, profil, sil/düzenle',                    icon:'👥', category:'core',          route:'/admin/students',      navItem:true,  default:true },
  { id:'registrations', name:'Başvuru Yönetimi',     description:'Veli kayıt formu, onay/ret, toplu atama',                 icon:'📋', category:'core',          route:'/admin/registrations', navItem:true,  default:true },
  { id:'classrooms',    name:'Sınıf Yönetimi',       description:'Sınıf oluştur, öğrenci/öğretmen ata',                    icon:'🏫', category:'core',          route:'/admin/classrooms',    navItem:true,  default:true },
  { id:'teachers',      name:'Öğretmen Yönetimi',    description:'Öğretmen ekle, sil, görünürlük ayarı',                   icon:'👨‍🏫', category:'core',         route:'/admin/teachers',      navItem:true,  default:true },

  // ADVANCED
  { id:'attendance',    name:'Yoklama Takibi',       description:'Günlük yoklama, devamsızlık raporu, WA bildirimi',        icon:'✅', category:'advanced',      route:'/admin/attendance',    navItem:true,  default:true },
  { id:'assignments',   name:'Ödev Yönetimi',        description:'Kişiselleştirilmiş ödev, velilere WA',                   icon:'📚', category:'advanced',      route:'/admin/assignments',   navItem:true,  default:true },
  { id:'performance',   name:'Performans Takibi',    description:'Sure/beceri bazlı seviye tablosu',                        icon:'⭐', category:'advanced',      route:'/admin/performance',   navItem:true,  default:false },
  { id:'calendar',      name:'Etkinlik Takvimi',     description:'Tatil, etkinlik, sınav, toplantı takibi',                 icon:'📅', category:'advanced',      route:'/admin/calendar',      navItem:true,  default:true },

  // COMMUNICATION
  { id:'wa_teacher',    name:'Öğretmen WhatsApp',    description:'Öğretmen kendi numarasıyla velilere mesaj gönderir',      icon:'💬', category:'communication', navItem:false, default:true },
  { id:'wa_bulk',       name:'Toplu WhatsApp',       description:'Tüm sınıfa/velilere tek mesaj gönderimi',                 icon:'📱', category:'communication', navItem:false, default:true },
  { id:'register_form', name:'Veli Kayıt Formu',     description:'Public kayıt formu (mesyosoft.com/kayit/slug)',           icon:'📝', category:'communication', navItem:false, default:true },

  // REPORTING
  { id:'seasons',       name:'Sezon/Arşiv Yönetimi', description:'Sezon kapat, arşivle, eski verilere eriş',               icon:'📦', category:'reporting',     route:'/admin/seasons',       navItem:false, default:true },
  { id:'excel_export',  name:'Excel Export',          description:'Öğrenci listesi Excel olarak indir',                     icon:'⬇', category:'reporting',      navItem:false, default:true },
  { id:'address_mgmt',  name:'Mahalle Yönetimi',      description:'Mahalle/sokak listesi yönetimi',                         icon:'🗺️', category:'reporting',     route:'/admin/address',       navItem:false, default:false },
  { id:'parent_portal',   name:'Veli Portalı',        description:'Veliler QR/link ile çocuklarının bilgilerini görür',        icon:'👨‍👩‍👧', category:'communication', navItem:false, default:true, route:'/admin/qr-register' },
  { id:'notifications',   name:'Bildirim Merkezi',    description:'Tüm WA gönderim logları, kim ne zaman gönderdi',           icon:'🔔', category:'reporting',     route:'/admin/notifications', navItem:true,  default:true },
  { id:'announcements',   name:'Toplu Duyuru',        description:'Tüm velilere veya sınıfa WA duyurusu',                     icon:'📢', category:'communication', route:'/admin/announcements', navItem:true,  default:true },
  { id:'sohbetler',       name:'Sohbetler',           description:'Sohbet takvimi, kayıt ve katılımcı arşivi',                icon:'🕌', category:'communication', route:'/admin/sohbetler',     navItem:true,  default:true },
  { id:'qr_register',     name:'QR Kayıt',            description:'Cami kapısı QR kodu ile veli kayıt formu',                 icon:'📱', category:'communication', navItem:false, default:true },
  { id:'progress_report', name:'Gelişim Raporu',      description:'Veliye aylık otomatik öğrenci gelişim raporu (WA)',        icon:'📈', category:'reporting',     route:'/admin/progress',      navItem:true,  default:false },
  { id:'game_admin',      name:'Kubbeler Yarışıyor',   description:'Oyun yönetimi: şifre, soru seçimi, yayınlama, sonuçlar',     icon:'🎮', category:'advanced',      route:'/admin/game',          navItem:true,  default:true },
  { id:'game_guide',      name:'Oyun Rehberi',        description:'Kubbeler Yarışıyor hoca ve veli kullanım kılavuzu',              icon:'📖', category:'advanced',      route:'/admin/game-guide',    navItem:false,  default:true },
  { id:'assets', name:'Demirbaş Yönetimi', description:'Bina, eşya, ekipman takibi, QR kod, bakım geçmişi', icon:'📦', category:'advanced', route:'/admin/assets', navItem:true, default:true },
  { id:'accounting',      name:'Ön Muhasebe',         description:'Gelir, gider, bağış takibi — cuma/bayram/kişi bazlı',     icon:'💰', category:'advanced',      route:'/admin/accounting',    navItem:true,  default:true },
]

export type ModuleId = typeof ALL_MODULES[number]['id']

// localStorage'dan kurum modüllerini oku
export function getInstitutionModules(institutionId: string): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(`mesyo_modules_${institutionId}`)
    if (raw) return JSON.parse(raw)
  } catch {}
  // Varsayılan: default:true olanlar açık
  return Object.fromEntries(ALL_MODULES.map(m => [m.id, m.default]))
}

// localStorage'a kaydet
export function saveInstitutionModules(institutionId: string, modules: Record<string, boolean>) {
  localStorage.setItem(`mesyo_modules_${institutionId}`, JSON.stringify(modules))
}

// Modül aktif mi?
export function isModuleActive(modules: Record<string, boolean>, moduleId: string): boolean {
  return modules[moduleId] !== false // undefined ise default:true kabul et
}

// Aktif nav itemlarını döndür
export function getActiveNavItems(modules: Record<string, boolean>) {
  return ALL_MODULES.filter(m => m.navItem && isModuleActive(modules, m.id))
}
