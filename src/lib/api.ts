import type { Institution, AuthUser, Season, Classroom, Student, Teacher, SuperadminStats } from '@/types'

const API_URL = import.meta.env.VITE_API_URL || 'http://91.98.129.128:8200/api'

function getToken(): string | null { return localStorage.getItem('mesyo_token') }

async function req<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (res.status === 401) {
    localStorage.clear()
    window.location.href = '/login'
    throw new Error('Oturum süresi doldu')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Bir hata oluştu' }))
    throw new Error(err.detail || 'Bir hata oluştu')
  }
  return res.json()
}

// ── AUTH ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (phone: string, password: string) =>
    req<{ token: string; user: AuthUser }>('/auth/login', {
      method: 'POST', body: JSON.stringify({ phone, password })
    }),
  me: () => req<AuthUser>('/auth/me'),
  changePassword: (old_password: string, new_password: string) =>
    req('/auth/change-password', { method: 'POST', body: JSON.stringify({ old_password, new_password }) }),
}

// ── SUPERADMIN ────────────────────────────────────────────────────────────────
export const superadminApi = {
  stats: () => req<SuperadminStats>('/superadmin/stats'),
  institutions: (params?: { search?: string; status?: string; city?: string }) => {
    const qs = new URLSearchParams()
    if (params?.search) qs.set('search', params.search)
    if (params?.status) qs.set('status', params.status)
    if (params?.city) qs.set('city', params.city)
    return req<Institution[]>(`/superadmin/institutions?${qs}`)
  },
  institution: (id: string) => req<Institution>(`/superadmin/institutions/${id}`),
  createInstitution: (data: Partial<Institution> & { admin_phone: string; admin_password: string }) =>
    req<Institution>('/superadmin/institutions', { method: 'POST', body: JSON.stringify(data) }),
  updateInstitution: (id: string, data: Partial<Institution>) =>
    req<Institution>(`/superadmin/institutions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  toggleActive: (id: string, is_active: boolean) =>
    req(`/superadmin/institutions/${id}/toggle`, { method: 'POST', body: JSON.stringify({ is_active }) }),
  setSubscription: (id: string, data: { status: string; expires_at?: string }) =>
    req(`/superadmin/institutions/${id}/subscription`, { method: 'POST', body: JSON.stringify(data) }),
  institutionStudents: (id: string) => req<Student[]>(`/superadmin/institutions/${id}/students`),
  institutionTeachers: (id: string) => req<Teacher[]>(`/superadmin/institutions/${id}/teachers`),
  impersonate: (institutionId: string) =>
    req<{ token: string; user: AuthUser }>(`/superadmin/impersonate/${institutionId}`, { method: 'POST' }),
}

// ── INSTITUTION ───────────────────────────────────────────────────────────────
export const institutionApi = {
  me: () => req<Institution>('/institution/me'),
  update: (data: Partial<Institution>) =>
    req<Institution>('/institution/me', { method: 'PATCH', body: JSON.stringify(data) }),
  stats: () => req<any>('/institution/stats'),
}

// ── SEASONS ───────────────────────────────────────────────────────────────────
export const seasonsApi = {
  list: () => req<Season[]>('/seasons'),
  create: (data: { name: string; year: number }) =>
    req<Season>('/seasons', { method: 'POST', body: JSON.stringify(data) }),
  archive: (id: string) =>
    req<Season>(`/seasons/${id}/archive`, { method: 'POST' }),
}

// ── CLASSROOMS ────────────────────────────────────────────────────────────────
export const classroomsApi = {
  list: (seasonId?: string) => {
    const qs = seasonId ? `?season_id=${seasonId}` : ''
    return req<Classroom[]>(`/classrooms${qs}`)
  },
  create: (data: Partial<Classroom>) =>
    req<Classroom>('/classrooms', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Classroom>) =>
    req<Classroom>(`/classrooms/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) =>
    req(`/classrooms/${id}`, { method: 'DELETE' }),
  assignTeacher: (classroomId: string, teacherId: string) =>
    req(`/classrooms/${classroomId}/teacher`, { method: 'POST', body: JSON.stringify({ teacher_id: teacherId }) }),
}

// ── STUDENTS ──────────────────────────────────────────────────────────────────
export const studentsApi = {
  list: (params?: { season_id?: string; classroom_id?: string; status?: string; gender?: string }) => {
    const qs = new URLSearchParams()
    if (params?.season_id) qs.set('season_id', params.season_id)
    if (params?.classroom_id) qs.set('classroom_id', params.classroom_id)
    if (params?.status) qs.set('status', params.status)
    if (params?.gender) qs.set('gender', params.gender)
    return req<Student[]>(`/students?${qs}`)
  },
  get: (id: string) => req<Student>(`/students/${id}`),
  create: (data: Partial<Student>) =>
    req<Student>('/students', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Student>) =>
    req<Student>(`/students/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) =>
    req(`/students/${id}`, { method: 'DELETE' }),
  approve: (id: string) =>
    req<Student>(`/students/${id}/approve`, { method: 'POST' }),
  reject: (id: string, reason?: string) =>
    req<Student>(`/students/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
  assignClassroom: (studentId: string, classroomId: string) =>
    req<Student>(`/students/${studentId}/classroom`, { method: 'POST', body: JSON.stringify({ classroom_id: classroomId }) }),
  publicRegister: (slug: string, data: Partial<Student>) =>
    req<Student>(`/public/register/${slug}`, { method: 'POST', body: JSON.stringify(data) }),
}

// ── TEACHERS ──────────────────────────────────────────────────────────────────
export const teachersApi = {
  list: () => req<Teacher[]>('/teachers'),
  create: (data: { full_name: string; phone: string; password: string; see_all?: boolean }) =>
    req<Teacher>('/teachers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Teacher>) =>
    req<Teacher>(`/teachers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) =>
    req(`/teachers/${id}`, { method: 'DELETE' }),
  resetPassword: (id: string, new_password: string) =>
    req(`/teachers/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ new_password }) }),
  myClassrooms: () => req<Classroom[]>('/teachers/me/classrooms'),
  myStudents: () => req<Student[]>('/teachers/me/students'),
}

// ── ATTENDANCE ────────────────────────────────────────────────────────────────
export const attendanceApi = {
  save: (classroom_id: string, date: string, entries: { student_id: string; status: string }[]) =>
    req('/attendance/bulk', { method: 'POST', body: JSON.stringify({ classroom_id, date, entries }) }),
  getByDate: (classroom_id: string, date: string) =>
    req<any>(`/attendance?classroom_id=${classroom_id}&date=${date}`),
  getReport: (classroom_id: string, start: string, end: string) =>
    req<any[]>(`/attendance/report?classroom_id=${classroom_id}&start=${start}&end=${end}`),
  studentSummary: (student_id: string) =>
    req<any>(`/attendance/student/${student_id}/summary`),
}

// ── PUBLIC ─────────────────────────────────────────────────────────────────────
export const publicApi = {
  institutionBySlug: (slug: string) =>
    req<{ id: string; name: string; city: string; is_active: boolean }>(`/public/institution/${slug}`),
}

// ── ASSIGNMENTS ────────────────────────────────────────────────────────────────
export const assignmentsApi = {
  list: (classroom_id?: string) =>
    req<any[]>(`/assignments${classroom_id ? `?classroom_id=${classroom_id}` : ''}`),
  create: (data: { classroom_id: string; title: string; description: string; due_date?: string; student_ids: string[] }) =>
    req<any>('/assignments', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: string) =>
    req(`/assignments/${id}`, { method: 'DELETE' }),
}

// ── SKILLS / PERFORMANCE ─────────────────────────────────────────────────────────
export const skillsApi = {
  list: () => req<{ id: string; name: string; category: string | null; sort_order: number }[]>('/skills'),
  classroomLevels: (classroomId: string) =>
    req<Record<string, Record<string, string>>>(`/skills/classroom/${classroomId}`),
  updateLevels: (updates: { student_id: string; skill_id: string; level: string }[]) =>
    req('/skills/levels', { method: 'POST', body: JSON.stringify({ updates }) }),
}

