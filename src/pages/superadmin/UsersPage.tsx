import { useState } from 'react'
import { SuperadminLayout } from '@/components/layout/SuperadminLayout'
import { Button, Modal, useToast } from '@/components/ui'

interface User {
  id: string; name: string; phone: string; role: 'institution_admin'|'teacher'
  institution: string; institution_slug: string; is_active: boolean; last_login?: string; created_at: string
}

const DEMO_USERS: User[] = [
  { id:'u1', name:'Ahmet Yıldız',  phone:'05321111111', role:'institution_admin', institution:'Karacihan Mescidi',   institution_slug:'karacihan',   is_active:true,  last_login:'2026-06-16', created_at:'2025-09-01' },
  { id:'u2', name:'Fatma Öğretmen',phone:'05329999991', role:'teacher',           institution:'Karacihan Mescidi',   institution_slug:'karacihan',   is_active:true,  last_login:'2026-06-16', created_at:'2025-09-05' },
  { id:'u3', name:'Mehmet Kaya',   phone:'05322222222', role:'institution_admin', institution:'Fatih Camii',         institution_slug:'fatih',       is_active:true,  last_login:'2026-06-15', created_at:'2026-04-01' },
  { id:'u4', name:'Ali Demir',     phone:'05323333333', role:'institution_admin', institution:'Merkez Camii',        institution_slug:'merkez',      is_active:false, last_login:'2026-01-10', created_at:'2025-01-01' },
  { id:'u5', name:'Fatma Öz',      phone:'05324444444', role:'institution_admin', institution:'Yenimahalle Mescidi', institution_slug:'yenimahalle', is_active:true,  last_login:'2026-06-14', created_at:'2025-09-01' },
  { id:'u6', name:'Hasan Çelik',   phone:'05325555555', role:'institution_admin', institution:'Havzan Camii',        institution_slug:'havzan',      is_active:true,  last_login:'2026-06-16', created_at:'2026-05-01' },
  { id:'u7', name:'Ayşe Öğretmen', phone:'05329999992', role:'teacher',           institution:'Fatih Camii',         institution_slug:'fatih',       is_active:true,  last_login:'2026-06-15', created_at:'2026-04-05' },
  { id:'u8', name:'Mustafa Şahin', phone:'05326666666', role:'institution_admin', institution:'Selimiye Camii',      institution_slug:'selimiye',    is_active:true,  last_login:'2026-06-13', created_at:'2025-09-01' },
]

export default function UsersPage() {
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>(DEMO_USERS)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all'|'institution_admin'|'teacher'>('all')
  const [resetModal, setResetModal] = useState<{open:boolean;user:User|null}>({open:false,user:null})
  const [newPw, setNewPw] = useState('')

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    const mq = !q || u.name.toLowerCase().includes(q) || u.phone.includes(q) || u.institution.toLowerCase().includes(q)
    const mr = roleFilter==='all' || u.role===roleFilter
    return mq && mr
  })

  const toggleActive = (id: string) => {
    setUsers(p => p.map(u => u.id===id ? {...u, is_active:!u.is_active} : u))
    toast('Kullanıcı durumu güncellendi','success')
  }

  const resetPassword = () => {
    if (!newPw || newPw.length < 4) { toast('En az 4 karakter girin','error'); return }
    toast(`${resetModal.user?.name} şifresi sıfırlandı ✅`, 'success')
    setResetModal({open:false, user:null}); setNewPw('')
  }

  const deleteUser = (id: string, name: string) => {
    if (!confirm(`${name} kullanıcısını silmek istiyor musunuz?`)) return
    setUsers(p => p.filter(u => u.id!==id))
    toast('Kullanıcı silindi', 'info')
  }

  return (
    <SuperadminLayout>
      <div className="space-y-4">
        {/* Özet */}
        <div className="grid grid-cols-3 gap-3">
          {[
            {l:'Toplam Kullanıcı', v:users.length, c:'text-gray-900'},
            {l:'Yönetici', v:users.filter(u=>u.role==='institution_admin').length, c:'text-green-600'},
            {l:'Öğretmen', v:users.filter(u=>u.role==='teacher').length, c:'text-blue-600'},
          ].map(s=>(
            <div key={s.l} className="bg-white rounded-xl shadow-sm p-4 text-center">
              <div className={`text-2xl font-extrabold ${s.c}`}>{s.v}</div>
              <div className="text-xs text-gray-400 font-semibold mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        {/* Filtreler */}
        <div className="flex gap-2 flex-wrap items-center">
          <input type="text" placeholder="🔍 İsim, telefon, kurum..."
            value={search} onChange={e=>setSearch(e.target.value)}
            className="flex-1 min-w-52 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500 bg-white"/>
          <div className="flex gap-1.5">
            {([['all','Tümü'],['institution_admin','Yönetici'],['teacher','Öğretmen']] as const).map(([v,l])=>(
              <button key={v} onClick={()=>setRoleFilter(v)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${roleFilter===v?'bg-green-500 text-white border-green-500':'border-gray-200 text-gray-500 bg-white'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Tablo */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex justify-between">
            <span className="text-sm font-bold text-gray-900">Kullanıcılar</span>
            <span className="text-xs text-gray-400">{filtered.length} kullanıcı</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Ad Soyad','Telefon','Kurum','Rol','Son Giriş','Durum','İşlem'].map(h=>(
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-bold text-gray-400 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(u=>(
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${u.role==='institution_admin'?'bg-green-100 text-green-700':'bg-blue-100 text-blue-700'}`}>
                          {u.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-gray-900">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{u.phone}</td>
                    <td className="px-4 py-3">
                      <div className="text-gray-700 text-xs">{u.institution}</div>
                      <div className="text-gray-400 font-mono text-[10px]">{u.institution_slug}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.role==='institution_admin'?'bg-green-100 text-green-700':'bg-blue-100 text-blue-700'}`}>
                        {u.role==='institution_admin'?'👤 Yönetici':'👨‍🏫 Öğretmen'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{u.last_login||'—'}</td>
                    <td className="px-4 py-3">
                      <button onClick={()=>toggleActive(u.id)}
                        className={`relative w-9 h-5 rounded-full transition-colors ${u.is_active?'bg-green-500':'bg-gray-200'}`}>
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${u.is_active?'translate-x-4':'translate-x-0.5'}`}/>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button onClick={()=>{setResetModal({open:true,user:u});setNewPw('')}}
                          className="px-2.5 py-1.5 border border-amber-200 text-amber-600 text-xs font-semibold rounded-lg hover:bg-amber-50">
                          🔑 Şifre
                        </button>
                        <button onClick={()=>deleteUser(u.id,u.name)}
                          className="px-2.5 py-1.5 border border-red-200 text-red-500 text-xs font-semibold rounded-lg hover:bg-red-50">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length===0 && (
            <div className="text-center py-10 text-gray-400 text-sm">Kullanıcı bulunamadı</div>
          )}
        </div>
      </div>

      <Modal open={resetModal.open} onClose={()=>setResetModal({open:false,user:null})} title={`🔑 Şifre Sıfırla — ${resetModal.user?.name}`}
        footer={<><Button variant="outline" onClick={()=>setResetModal({open:false,user:null})}>İptal</Button><Button onClick={resetPassword}>Kaydet</Button></>}>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Yeni Şifre</label>
          <input type="text" value={newPw} onChange={e=>setNewPw(e.target.value)} placeholder="Yeni şifre girin"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500"/>
          <p className="text-xs text-gray-400 mt-1">Şifreyi kullanıcıya iletmeyi unutmayın.</p>
        </div>
      </Modal>
    </SuperadminLayout>
  )
}
