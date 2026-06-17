export type Role = 'superadmin' | 'institution_admin' | 'teacher'
export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'cancelled'

export interface Institution {
  id: string
  slug: string
  name: string
  city: string
  district: string
  address?: string
  responsible_name: string
  responsible_phone: string
  email?: string
  is_active: boolean
  subscription_status: SubscriptionStatus
  subscription_expires_at?: string
  trial_ends_at?: string
  student_limit: number
  created_at: string
  student_count?: number
  teacher_count?: number
  active_season_name?: string
}

export interface AuthUser {
  id: string
  institution_id?: string
  institution_slug?: string
  institution_name?: string
  full_name: string
  phone: string
  role: Role
  is_active: boolean
}

export interface Season {
  id: string
  institution_id: string
  name: string
  year: number
  is_active: boolean
  archived_at?: string
  student_count?: number
  created_at: string
}

export interface Classroom {
  id: string
  institution_id: string
  season_id: string
  name: string
  age_group?: string
  capacity: number
  teacher_id?: string | null
  teacher_name?: string | null
  student_count?: number
  is_active: boolean
}

export interface Student {
  id: string
  institution_id: string
  season_id: string
  classroom_id?: string | null
  first_name: string
  last_name: string
  birth_date: string
  gender: 'erkek' | 'kiz'
  tc_no?: string
  city?: string
  district?: string
  mahalle?: string
  sokak?: string
  address?: string
  parent_first_name: string
  parent_last_name: string
  parent_phone: string
  parent_phone2?: string
  notes?: string
  status: 'pending' | 'approved' | 'rejected'
  registration_source: 'form' | 'manual'
  created_at: string
}

export interface Teacher {
  id: string
  institution_id: string
  full_name: string
  phone: string
  class_id?: string | null
  class_name?: string | null
  is_active: boolean
  see_all: boolean
  wa_connected: boolean
  last_login?: string
}

export interface AttendanceRecord {
  id: string
  student_id: string
  classroom_id: string
  date: string
  status: 'present' | 'absent' | 'late' | 'excused'
  note?: string
}

export interface SuperadminStats {
  total_institutions: number
  active_institutions: number
  trial_institutions: number
  expired_institutions: number
  total_students: number
  total_teachers: number
}

export interface ApiError { detail: string }
