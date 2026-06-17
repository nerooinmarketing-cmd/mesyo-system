import { useState } from 'react'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Button, Modal, Input, Select, Badge, ProgressBar, useToast, EmptyState } from '@/components/ui'
import { calcAge } from '@/lib/utils'
import { DEMO_STUDENTS, DEMO_CLASSROOMS, DEMO_TEACHERS } from '@/lib/demo-data'

export default function ClassroomsPage() {
  const { toast } = useToast()
  const [classrooms, setClassrooms] = useState(DEMO_CLASSROOMS)
  const [teachers] = useState(DEMO_TEACHERS)
  const [students, setStudents] = useState(DEMO_STUDENTS)
  const [addModal, setAddModal] = useState(false)
  const [editModal, setEditModal] = useState<{open:boolean;cls:any|null}>({open:false,cls:null})
  const [editForm, setEditForm] = useState({name:'',age_group:'',capacity:'20'})
  const [asnStdModal, setAsnStdModal] = useState<{open:boolean;clsId:string;clsName:string}>({open:false,clsId:'',clsName:''})
  const [asnTchModal, setAsnTchModal] = useState<{open:boolean;clsId:string;clsName:string}>({open:false,clsId:'',clsName:''})
  const [addForm, setAddForm] = useState({name:'',age_group:'',capacity:'20'})
  const [asnTchId, setAsnTchId] = useState('')
  const [asnSearch, setAsnSearch] = useState('')
  const [asnAge, setAsnAge] = useState('')
  const [selectedStd, setSelectedStd] = useState<Set<string>>(new Set())

  const unassigned = students.filter(s => !s.classroom_id)
  const filteredUnassigned = unassigned.filter(s => {
    const q = asnSearch.toLowerCase()
    const mq = !q || (s.first_name + ' ' + s.last_name).toLowerCase().includes(q)
    const ma = !asnAge || (()=>{const[mn,mx]=asnAge.split('-').map(Number);const a=calcAge(s.birth_date);return a>=mn&&a<=mx})()
    return mq && ma
  })

  const clsStudentCount = (cid: string) => students.filter(s => s.classroom_id === cid).length

  const addClass = () => {
    if (!addForm.name) { toast('Sınıf adı girin','error'); return }
    setClassrooms(p => [...p, {id:'c'+Date.now(),name:addForm.name,age_group:addForm.age_group,capacity:parseInt(addForm.capacity)||20,student_count:0,teacher_id:null,teacher_name:null,is_active:true}])
    toast('Sınıf oluşturuldu ✅','success'); setAddModal(false); setAddForm({name:'',age_group:'',capacity:'20'})
  }

  const openEdit = (cls: any) => {
    setEditForm({name:cls.name, age_group:cls.age_group||'', capacity:String(cls.capacity)})
    setEditModal({open:true, cls})
  }

  const saveEdit = () => {
    setClassrooms(p => p.map(c => c.id===editModal.cls?.id
      ? {...c, name:editForm.name, age_group:editForm.age_group, capacity:parseInt(editForm.capacity)||20}
      : c))
    toast('Sınıf güncellendi ✅','success'); setEditModal({open:false,cls:null})
  }

  const doDelete = (cid: string, name: string) => {
    if (!confirm(`"${name}" sınıfı silinsin mi? Öğrenci atamaları da kaldırılacak.`)) return
    setClassrooms(p => p.filter(c => c.id !== cid))
    setStudents(p => p.map(s => s.classroom_id === cid ? {...s, classroom_id: null} : s))
    toast(`${name} silindi`, 'info')
  }

  const assignStudents = () => {
    if (!selectedStd.size) { toast('Öğrenci seçin','error'); return }
    setStudents(p => p.map(s => selectedStd.has(s.id) ? {...s, classroom_id: asnStdModal.clsId} : s))
    toast(`${selectedStd.size} öğrenci atandı ✅`,'success')
    setAsnStdModal(p=>({...p,open:false})); setSelectedStd(new Set())
  }

  const assignTeacher = () => {
    if (!asnTchId) { toast('Öğretmen seçin','error'); return }
    const tch = teachers.find(t=>t.id===asnTchId)
    setClassrooms(p => p.map(c => c.id===asnTchModal.clsId ? {...c,teacher_id:asnTchId,teacher_name:tch?.full_name||null} : c))
    toast('Öğretmen atandı ✅','success'); setAsnTchModal(p=>({...p,open:false}))
  }

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-400">{classrooms.length} sınıf</span>
        <Button onClick={() => setAddModal(true)}>+ Sınıf Ekle</Button>
      </div>

      {classrooms.length === 0
        ? <EmptyState icon="🏫" title="Henüz sınıf yok" subtitle="Sınıf ekleyerek başlayın" />
        : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {classrooms.map(c => {
              const cnt = clsStudentCount(c.id)
              const pct = Math.round(cnt/c.capacity*100)
              return (
                <div key={c.id} className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-500">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-gray-900">{c.name}</div>
                      {c.age_group && <div className="text-xs text-gray-400 mt-0.5">🎂 {c.age_group} yaş</div>}
                    </div>
                    <Badge variant={cnt>=c.capacity?'red':cnt>0?'green':'gray'}>{cnt>=c.capacity?'Dolu':cnt>0?'Aktif':'Boş'}</Badge>
                  </div>
                  <div className="text-sm text-gray-500 mb-2">
                    👨‍🏫 {c.teacher_name || <span className="text-red-400">Öğretmen atanmamış</span>}
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1"><span>Doluluk</span><span>{cnt}/{c.capacity}</span></div>
                  <ProgressBar value={cnt} max={c.capacity} className="mb-3" />
                  <div className="flex gap-1.5 flex-wrap">
                    <Button size="sm" className="flex-1"
                      onClick={() => { setAsnStdModal({open:true,clsId:c.id,clsName:c.name}); setSelectedStd(new Set()); setAsnSearch(''); setAsnAge('') }}>
                      👥 Öğrenci Seç
                    </Button>
                    <Button size="sm" variant="outline"
                      onClick={() => { setAsnTchModal({open:true,clsId:c.id,clsName:c.name}); setAsnTchId(c.teacher_id||'') }}>
                      👨‍🏫 Ata
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openEdit(c)}>✏️</Button>
                    <Button size="sm" variant="danger" onClick={() => doDelete(c.id, c.name)}>🗑️</Button>
                  </div>
                </div>
              )
            })}
          </div>
      }

      {/* Ekle */}
      <Modal open={addModal} onClose={() => setAddModal(false)} title="🏫 Yeni Sınıf"
        footer={<><Button variant="outline" onClick={() => setAddModal(false)}>İptal</Button><Button onClick={addClass}>Oluştur</Button></>}>
        <Input label="Sınıf Adı" placeholder="örn: Sabah Grubu" value={addForm.name} onChange={e => setAddForm(p=>({...p,name:e.target.value}))} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Yaş Grubu" placeholder="örn: 7-9" value={addForm.age_group} onChange={e => setAddForm(p=>({...p,age_group:e.target.value}))} />
          <Input label="Kontenjan" type="number" value={addForm.capacity} onChange={e => setAddForm(p=>({...p,capacity:e.target.value}))} />
        </div>
      </Modal>

      {/* Düzenle */}
      <Modal open={editModal.open} onClose={() => setEditModal(p=>({...p,open:false}))}
        title={`✏️ ${editModal.cls?.name}`}
        footer={<><Button variant="outline" onClick={() => setEditModal(p=>({...p,open:false}))}>İptal</Button><Button onClick={saveEdit}>Kaydet</Button></>}>
        <Input label="Sınıf Adı" value={editForm.name} onChange={e => setEditForm(p=>({...p,name:e.target.value}))} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Yaş Grubu" placeholder="örn: 7-9" value={editForm.age_group} onChange={e => setEditForm(p=>({...p,age_group:e.target.value}))} />
          <Input label="Kontenjan" type="number" value={editForm.capacity} onChange={e => setEditForm(p=>({...p,capacity:e.target.value}))} />
        </div>
      </Modal>

      {/* Öğrenci Seç */}
      <Modal open={asnStdModal.open} onClose={() => setAsnStdModal(p=>({...p,open:false}))}
        title={`👥 Öğrenci Seç — ${asnStdModal.clsName}`} wide
        footer={<><Button variant="outline" onClick={() => setAsnStdModal(p=>({...p,open:false}))}>İptal</Button><Button onClick={assignStudents}>Seçilenleri Ata</Button></>}>
        <div className="flex gap-2 mb-3 flex-wrap">
          <input type="text" placeholder="🔍 Ara..." value={asnSearch} onChange={e => setAsnSearch(e.target.value)}
            className="flex-1 min-w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-green-500" />
          <select value={asnAge} onChange={e => setAsnAge(e.target.value)} className="px-2 py-2 border border-gray-200 rounded-lg text-sm outline-none">
            <option value="">Tüm yaşlar</option>
            <option value="7-9">7-9 yaş</option><option value="10-12">10-12 yaş</option><option value="13-14">13-14 yaş</option>
          </select>
        </div>
        <div className="text-xs text-gray-400 mb-2">{selectedStd.size} öğrenci seçildi</div>
        <div className="space-y-1.5 max-h-72 overflow-y-auto">
          {filteredUnassigned.length === 0
            ? <div className="text-center py-8 text-gray-400 text-sm">Atanmamış öğrenci yok</div>
            : filteredUnassigned.map(s => (
                <label key={s.id} className={`flex items-center gap-3 p-2.5 rounded-lg border-[1.5px] cursor-pointer transition-all ${selectedStd.has(s.id)?'border-green-500 bg-green-50':'border-gray-200 hover:border-green-300'}`}>
                  <input type="checkbox" checked={selectedStd.has(s.id)}
                    onChange={() => setSelectedStd(p=>{const n=new Set(p);n.has(s.id)?n.delete(s.id):n.add(s.id);return n})}
                    className="w-4 h-4 accent-green-500 flex-shrink-0" />
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${s.gender==='erkek'?'bg-blue-100 text-blue-700':'bg-pink-100 text-pink-700'}`}>{(s.first_name + ' ' + s.last_name).charAt(0)}</div>
                  <div>
                    <div className="text-sm font-semibold">{(s.first_name + ' ' + s.last_name)}</div>
                    <div className="text-xs text-gray-400">{calcAge(s.birth_date)} yaş • {s.mahalle||'—'} • {(s.parent_first_name + ' ' + s.parent_last_name)}</div>
                  </div>
                </label>
              ))
          }
        </div>
      </Modal>

      {/* Öğretmen Ata */}
      <Modal open={asnTchModal.open} onClose={() => setAsnTchModal(p=>({...p,open:false}))}
        title={`👨‍🏫 Öğretmen Ata — ${asnTchModal.clsName}`}
        footer={<><Button variant="outline" onClick={() => setAsnTchModal(p=>({...p,open:false}))}>İptal</Button><Button onClick={assignTeacher}>Ata</Button></>}>
        <Select label="Öğretmen" value={asnTchId} onChange={e => setAsnTchId(e.target.value)}>
          <option value="">— Seçin —</option>
          {teachers.map(t=><option key={t.id} value={t.id}>{t.full_name}{t.class_name?` (${t.class_name})`:''}</option>)}
        </Select>
      </Modal>
    </AdminLayout>
  )
}
