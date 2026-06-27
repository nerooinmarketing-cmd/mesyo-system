import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ToastProvider } from '@/components/ui'

// Pages
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/public/RegisterPage'
import GamePlayPage from '@/pages/public/GamePlayPage'
import SohbetKayitPage from '@/pages/public/SohbetKayitPage'
import KervanOyunPage from '@/pages/public/KervanOyunPage'
import KervanAdminPage from '@/pages/admin/KervanAdminPage'
import StudentImportPage from '@/pages/admin/StudentImportPage'
import CurriculumPage from '@/pages/admin/CurriculumPage'
import StudentProfilePage from '@/pages/admin/StudentProfilePage'

import ModulesPage from '@/pages/superadmin/ModulesPage'
import InstitutionsPage from '@/pages/superadmin/InstitutionsPage'
import UsersPage from '@/pages/superadmin/UsersPage'
import SuperadminSettingsPage from '@/pages/superadmin/SuperadminSettingsPage'
import ApplicationsPage from '@/pages/superadmin/ApplicationsPage'
import PaymentsPage from '@/pages/superadmin/PaymentsPage'
import MessagesPage from '@/pages/superadmin/MessagesPage'
import SuperadminRequestsPage from '@/pages/superadmin/RequestsPage'
import InstitutionRegisterPage from '@/pages/public/InstitutionRegisterPage'
import RequestsPage from '@/pages/admin/RequestsPage'
import AssetsPage from '@/pages/admin/AssetsPage'
import AssetDetailPage from '@/pages/public/AssetDetailPage'
import AssetReportPage from '@/pages/public/AssetReportPage'

import NotificationsPage from '@/pages/admin/NotificationsPage'
import AnnouncementsPage from '@/pages/admin/AnnouncementsPage'
import SohbetPage from '@/pages/admin/SohbetPage'
import QRRegisterPage from '@/pages/admin/QRRegisterPage'
import ProgressReportPage from '@/pages/admin/ProgressReportPage'
import AccountingPage from '@/pages/admin/AccountingPage'
import GameGuidePage from '@/pages/admin/GameGuidePage'
import ScorePage from '@/pages/public/ScorePage'
import GameAdminPage from '@/pages/admin/GameAdminPage'

import ParentPortalPage from '@/pages/public/ParentPortalPage'
import { ModuleProvider } from '@/contexts/ModuleContext'
// Superadmin
import SuperadminDashboard from '@/pages/superadmin/DashboardPage'
import InstitutionDetail from '@/pages/superadmin/InstitutionDetailPage'
import NewInstitution from '@/pages/superadmin/NewInstitutionPage'

// Admin
import AdminDashboard from '@/pages/admin/DashboardPage'
import StudentsPage from '@/pages/admin/StudentsPage'
import RegistrationsPage from '@/pages/admin/RegistrationsPage'
import ClassroomsPage from '@/pages/admin/ClassroomsPage'
import TeachersPage from '@/pages/admin/TeachersPage'
import AttendancePage from '@/pages/admin/AttendancePage'
import AssignmentsPage from '@/pages/admin/AssignmentsPage'
import SeasonsPage from '@/pages/admin/SeasonsPage'
import AddressPage from '@/pages/admin/AddressPage'
import SettingsPage from '@/pages/admin/SettingsPage'

import CalendarPage from '@/pages/admin/CalendarPage'
import PerformancePage from '@/pages/admin/PerformancePage'
// Teacher
import YoklamaPage from '@/pages/teacher/YoklamaPage'
import OdevPage from '@/pages/teacher/OdevPage'

function Guard({ children, roles }: { children: React.ReactNode; roles: string[] }) {
  const { user, isLoading } = useAuth()
  if (isLoading) return <div className="flex h-screen items-center justify-center text-gray-400">Yükleniyor...</div>
  if (!user) return <Navigate to="/login" replace />
  if (!roles.includes(user.role)) return <Navigate to="/login" replace />
  return <>{children}</>
}

function Root() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'superadmin') return <Navigate to="/superadmin" replace />
  if (user.role === 'institution_admin') return <Navigate to="/admin/dashboard" replace />
  return <Navigate to="/teacher/yoklama" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ModuleProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Root />} />

            {/* Superadmin */}
            <Route path="/superadmin" element={<Guard roles={['superadmin']}><SuperadminDashboard /></Guard>} />
            <Route path="/superadmin/applications" element={<Guard roles={['superadmin']}><ApplicationsPage /></Guard>} />
            <Route path="/superadmin/payments"     element={<Guard roles={['superadmin']}><PaymentsPage /></Guard>} />
            <Route path="/superadmin/messages"     element={<Guard roles={['superadmin']}><MessagesPage /></Guard>} />
            <Route path="/superadmin/requests"     element={<Guard roles={['superadmin']}><SuperadminRequestsPage /></Guard>} />
            <Route path="/kayit/kurum"             element={<InstitutionRegisterPage />} />
            <Route path="/superadmin/institutions" element={<Guard roles={['superadmin']}><InstitutionsPage /></Guard>} />
            <Route path="/superadmin/users" element={<Guard roles={['superadmin']}><UsersPage /></Guard>} />
            <Route path="/superadmin/settings" element={<Guard roles={['superadmin']}><SuperadminSettingsPage /></Guard>} />
            <Route path="/superadmin/institutions/new" element={<Guard roles={['superadmin']}><NewInstitution /></Guard>} />
            <Route path="/superadmin/institutions/:id" element={<Guard roles={['superadmin']}><InstitutionDetail /></Guard>} />
            <Route path="/superadmin/institutions/:id/modules" element={<Guard roles={['superadmin']}><ModulesPage /></Guard>} />

            {/* Admin */}
            <Route path="/admin/dashboard"     element={<Guard roles={['institution_admin','superadmin']}><AdminDashboard /></Guard>} />
            <Route path="/admin/students"      element={<Guard roles={['institution_admin','superadmin']}><StudentsPage /></Guard>} />
            <Route path="/admin/registrations" element={<Guard roles={['institution_admin','superadmin']}><RegistrationsPage /></Guard>} />
            <Route path="/admin/classrooms"    element={<Guard roles={['institution_admin','superadmin']}><ClassroomsPage /></Guard>} />
            <Route path="/admin/teachers"      element={<Guard roles={['institution_admin','superadmin']}><TeachersPage /></Guard>} />
            <Route path="/admin/attendance"    element={<Guard roles={['institution_admin','superadmin']}><AttendancePage /></Guard>} />
            <Route path="/admin/assignments"   element={<Guard roles={['institution_admin','superadmin']}><AssignmentsPage /></Guard>} />
            <Route path="/admin/seasons"       element={<Guard roles={['institution_admin','superadmin']}><SeasonsPage /></Guard>} />
            <Route path="/admin/address"       element={<Guard roles={['institution_admin','superadmin']}><AddressPage /></Guard>} />
            <Route path="/admin/notifications"  element={<Guard roles={['institution_admin','superadmin']}><NotificationsPage /></Guard>} />
            <Route path="/admin/announcements"  element={<Guard roles={['institution_admin','superadmin']}><AnnouncementsPage /></Guard>} />
            <Route path="/admin/sohbetler"      element={<Guard roles={['institution_admin','superadmin']}><SohbetPage /></Guard>} />
            <Route path="/admin/qr-register"    element={<Guard roles={['institution_admin','superadmin']}><QRRegisterPage /></Guard>} />
            <Route path="/admin/progress"       element={<Guard roles={['institution_admin','superadmin']}><ProgressReportPage /></Guard>} />
            <Route path="/admin/game"          element={<Guard roles={['institution_admin','superadmin']}><GameAdminPage /></Guard>} />
            <Route path="/admin/game-guide"     element={<Guard roles={['institution_admin','superadmin']}><GameGuidePage /></Guard>} />
            <Route path="/admin/kervan"         element={<Guard roles={['institution_admin','superadmin']}><KervanAdminPage /></Guard>} />
            <Route path="/admin/students/import" element={<Guard roles={['institution_admin','superadmin']}><StudentImportPage /></Guard>} />
            <Route path="/admin/curriculum"       element={<Guard roles={['institution_admin','superadmin']}><CurriculumPage /></Guard>} />
            <Route path="/admin/accounting"     element={<Guard roles={['institution_admin','superadmin']}><AccountingPage /></Guard>} />
            <Route path="/veli/:studentId"      element={<ParentPortalPage />} />
            <Route path="/admin/calendar"      element={<Guard roles={['institution_admin','superadmin']}><CalendarPage /></Guard>} />
            <Route path="/admin/performance"    element={<Guard roles={['institution_admin','superadmin']}><PerformancePage /></Guard>} />
            <Route path="/admin/assets"      element={<Guard roles={['institution_admin','superadmin']}><AssetsPage /></Guard>} />
            <Route path="/demirbase/:code"   element={<AssetReportPage />} />
            <Route path="/admin/requests"     element={<Guard roles={['institution_admin','superadmin']}><RequestsPage /></Guard>} />
            <Route path="/admin/settings"      element={<Guard roles={['institution_admin','superadmin']}><SettingsPage /></Guard>} />

            {/* Teacher */}
            <Route path="/teacher/yoklama" element={<Guard roles={['teacher']}><YoklamaPage /></Guard>} />
            <Route path="/teacher/odev"    element={<Guard roles={['teacher']}><OdevPage /></Guard>} />

            <Route path="/skor/:slug"         element={<ScorePage />} />
            <Route path="/kayit/:slug" element={<RegisterPage />} />
            <Route path="/oyun/:gameId" element={<GamePlayPage />} />
            <Route path="/sohbet/:sohbetId" element={<SohbetKayitPage />} />
            <Route path="/kervan/:familyId" element={<KervanOyunPage />} />
            <Route path="/admin/students/:id" element={<Guard roles={['institution_admin','superadmin']}><StudentProfilePage /></Guard>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </ModuleProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
