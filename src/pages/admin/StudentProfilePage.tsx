import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Badge, Button, useToast, Modal, Input, Select } from '@/components/ui'
import { calcAge, waLink, absenceMessage } from '@/lib/utils'
import { DEMO_STUDENTS, DEMO_CLASSROOMS } from '@/lib/demo-data'

type Tab = 'genel' | 'devam' | 'odevler' | 'notlar'

// Demo devam verisi
const DEMO_ATT: Record<string,string> = {
  '2026-06-09':'present','2026-06-10':'absent','2026-06-11':'present',
  '2026-06-12':'present','2026-06-13':'absent','2026-06-16':'present',
}

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const student = DEMO_STUDENTS.find(s=>s.id===id) || DEMO_STUDENTS[0]
  const cls = DEMO_CLASSROOMS.find(c=>c.id===student.classroom_id)
  const [tab, setTab] = useState<Tab>('genel')
  const [editModal, setEditModal] = useState(false)
  const [note, setNote] = useState('')
  const [notes, setNotes] = useState<{id:number;text:string;date:string}[]>([])

  const age = calcAge(student.birth_date)
  const attEntries = Object.entries(DEMO_ATT)
  const present = attEntries.filter(([,v])=>v==='present').length
  const absent = attEntries.filter(([,v])=>v==='absent').length
  const rate = attEntries.length > 0 ? Math.round(present/attEntries.length*100) : 0

  return (
    <AdminLayout>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4 text-sm text-gray-400">
        <button onClick={() => navigate('/admin/students')} className="hover:text-gray-600">Öğrenciler</button>
        <span>/</span>
        <span className="text-gray-900 font-semibold">{(student.first_name + ' ' + student.last_name)}</span>
      </div>

      {/* Header kartı */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
        <div className="flex items-start gap-4 flex-wrap">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl flex-shrink-0 ${student.gender==='erkek'?'bg-blue-100 text-blue-600':'bg-pink-100 text-pink-600'}`}>
            {(student.first_name + ' ' + student.last_name).charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xl font-extrabold text-gray-900">{(student.first_name + ' ' + student.last_name)}</div>
            <div className="flex flex-wrap gap-2 mt-1.5">
              <Badge variant={student.gender==='erkek'?'blue':'green'}>{student.gender==='erkek'?'👦 Erkek':'👧 Kız'}</Badge>
              <Badge variant="gray">{age} yaş</Badge>
              <Badge variant={cls?'green':'amber'}>{cls?cls.name:'Sınıf atanmamış'}</Badge>
              <Badge variant={rate>=80?'green':rate>=60?'amber':'red'}>%{rate} devam</Badge>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button size="sm" variant="outline" onClick={()=>setEditModal(true)}>✏️ Düzenle</Button>
            <a href={waLink(student.parent_phone,`Sayın ${(student.parent_first_name + ' ' + student.parent_last_name)}, ${(student.first_name + ' ' + student.last_name)} ile ilgili bilgi vermek istiyoruz.`)}
              target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] text-white text-xs font-semibold rounded-lg">
              💬 Veliye WA
            </a>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-xl p-1 mb-4">
        {([['genel','📋 Genel'],['devam','✅ Devam'],['odevler','📚 Ödevler'],['notlar','📝 Notlar']] as const).map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${tab===t?'bg-white text-gray-900 shadow-sm':'text-gray-400'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* GENEL */}
      {tab==='genel' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-sm font-bold text-gray-900 mb-3">📋 Öğrenci Bilgileri</div>
            {[
              ['Ad Soyad',(student.first_name + ' ' + student.last_name)],
              ['Doğum Tarihi',student.birth_date],
              ['Cinsiyet',student.gender==='erkek'?'Erkek':'Kız'],
              ['Yaş',`${age} yaş`],
              ['Sınıf',cls?.name||'Atanmamış'],
              ['Mahalle',student.mahalle||'—'],
              ['Sokak',student.sokak||'—'],
              ['Kayıt Tarihi',student.created_at],
            ].map(([l,v])=>(
              <div key={l} className="flex items-center py-2 border-b border-gray-50 last:border-0 text-sm gap-3">
                <span className="text-xs font-semibold text-gray-400 w-24 flex-shrink-0">{l}</span>
                <span className="text-gray-700">{v}</span>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5">
            <div className="text-sm font-bold text-gray-900 mb-3">👤 Veli Bilgileri</div>
            {[
              ['Veli Adı',(student.parent_first_name + ' ' + student.parent_last_name)],
              ['Telefon 1',student.parent_phone],
              ['Telefon 2',student.parent_phone],
              ['Notlar','—'],
            ].map(([l,v])=>(
              <div key={l} className="flex items-center py-2 border-b border-gray-50 last:border-0 text-sm gap-3">
                <span className="text-xs font-semibold text-gray-400 w-24 flex-shrink-0">{l}</span>
                <span className="text-gray-700">{v}</span>
              </div>
            ))}
            <div className="mt-4 space-y-2">
              <a href={waLink(student.parent_phone,`Sayın ${(student.parent_first_name + ' ' + student.parent_last_name)}, ${(student.first_name + ' ' + student.last_name)} ile ilgili bilgi vermek istiyoruz.`)} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 w-full py-2.5 px-3 bg-[#25D366] text-white text-sm font-bold rounded-lg justify-center">
                💬 WhatsApp Mesaj Gönder
              </a>
              <a href={`tel:${student.parent_phone}`}
                className="flex items-center gap-2 w-full py-2.5 px-3 border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg justify-center hover:bg-gray-50">
                📞 Ara
              </a>
            </div>
          </div>
        </div>
      )}

      {/* DEVAM */}
      {tab==='devam' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              {l:'Geldi',v:present,c:'text-green-600 border-green-400'},
              {l:'Gelmedi',v:absent,c:'text-red-500 border-red-400'},
              {l:'Devam Oranı',v:`%${rate}`,c:rate>=80?'text-green-600 border-green-400':rate>=60?'text-amber-500 border-amber-400':'text-red-500 border-red-400'},
            ].map(s=>(
              <div key={s.l} className={`bg-white rounded-xl shadow-sm p-4 text-center border-t-[3px] ${s.c.split(' ')[1]}`}>
                <div className={`text-2xl font-extrabold ${s.c.split(' ')[0]}`}>{s.v}</div>
                <div className="text-xs font-semibold text-gray-400 mt-1">{s.l}</div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 text-sm font-bold text-gray-900">Devam Geçmişi</div>
            {attEntries.map(([date,status])=>(
              <div key={date} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-600 w-28">{date}</span>
                <Badge variant={status==='present'?'green':'red'}>{status==='present'?'✅ Geldi':'❌ Gelmedi'}</Badge>
                {status==='absent' && (
                  <a href={waLink(student.parent_phone, absenceMessage((student.first_name + ' ' + student.last_name),(student.parent_first_name + ' ' + student.parent_last_name),cls?.name||'',date))}
                    target="_blank" rel="noreferrer"
                    className="ml-auto text-xs px-2 py-1 bg-[#25D366] text-white font-semibold rounded">📱 WA</a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ÖDEVLER */}
      {tab==='odevler' && (
        <div className="bg-white rounded-xl shadow-sm p-5 text-center text-gray-400">
          <div className="text-3xl mb-2">📚</div>
          <p className="text-sm">API bağlanınca ödev geçmişi burada görünecek</p>
        </div>
      )}

      {/* NOTLAR */}
      {tab==='notlar' && (
        <div className="space-y-3">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="text-sm font-bold text-gray-900 mb-3">📝 Not Ekle</div>
            <textarea value={note} onChange={e=>setNote(e.target.value)} rows={3} placeholder="Bu öğrenci hakkında not..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500 resize-none mb-2" />
            <Button size="sm" onClick={()=>{if(!note.trim())return;setNotes(p=>[{id:Date.now(),text:note,date:new Date().toLocaleDateString('tr-TR')},...p]);setNote('');toast('Not eklendi ✅','success')}}>
              Not Ekle
            </Button>
          </div>
          {notes.length===0
            ? <div className="text-center py-10 text-gray-400 text-sm">Henüz not yok</div>
            : notes.map(n=>(
                <div key={n.id} className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-400">
                  <div className="text-sm text-gray-700">{n.text}</div>
                  <div className="text-xs text-gray-400 mt-1">{n.date}</div>
                </div>
              ))
          }
        </div>
      )}

      {/* Edit Modal */}
      <Modal open={editModal} onClose={()=>setEditModal(false)} title="✏️ Öğrenciyi Düzenle"
        footer={<><Button variant="outline" onClick={()=>setEditModal(false)}>İptal</Button><Button onClick={()=>{toast('Kaydedildi ✅','success');setEditModal(false)}}>Kaydet</Button></>}>
        <Input label="Ad Soyad" defaultValue={(student.first_name + ' ' + student.last_name)} />
        <Input label="Doğum Tarihi" type="date" defaultValue={student.birth_date} />
        <Input label="Veli Adı" defaultValue={(student.parent_first_name + ' ' + student.parent_last_name)} />
        <Input label="Veli Telefon" type="tel" defaultValue={student.parent_phone} />
        <Input label="Mahalle" defaultValue={student.mahalle||''} />
        <Select label="Sınıf" defaultValue={student.classroom_id||''}>
          <option value="">Sınıf atanmamış</option>
          {DEMO_CLASSROOMS.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </Modal>
    </AdminLayout>
  )
}
