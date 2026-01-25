import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ModuleProvider, useModules } from './contexts/ModuleContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ThemeToggle from './components/ThemeToggle';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/DashboardNew';
import AdminDashboard from './pages/AdminDashboard';
import VacationPlanner from './pages/VacationPlanner';
import ComplianceDashboard from './pages/ComplianceDashboard';
import CustomersPage from './pages/CustomersPage';
import InvoiceTemplatesPage from './pages/InvoiceTemplatesPage';
import IncidentManagement from './pages/IncidentManagement';
import EHSDashboard from './pages/EHSDashboard';
import EHSTodosPage from './pages/EHSTodosPage';
import ModulesPage from './pages/ModulesPage';
import ModulePermissionsPage from './pages/ModulePermissionsPage';
import MyApprovals from './pages/MyApprovals';
import PayrollManagement from './pages/PayrollManagement';
import { TravelExpensesPageWrapper } from './pages/TravelExpensesPageWrapper';
import MessagesPage from './pages/MessagesPage';
import MessageDetail from './pages/MessageDetail';
import ComposeMessage from './pages/ComposeMessage';
import IntranetPage from './pages/Intranet/IntranetPage';
import { MediaPageWrapper } from './pages/MediaPageWrapper';
import OrdersPage from './pages/OrdersPage';
import CostCentersPage from './pages/CostCentersPage';
import ZeitmodelleVerwaltung from './pages/ZeitmodelleVerwaltung';
import ProjectPlanningPage from './pages/ProjectPlanningPage';
import ELearningPage from './pages/ELearningPage';
import CourseEditorPage from './pages/CourseEditorPage';
import CourseDetailPage from './pages/CourseDetailPage';
import ApplicantsPage from './pages/ApplicantsPage';
import OnboardingDashboardPage from './pages/OnboardingDashboardPage';
import ApplicantRegisterPage from './pages/ApplicantRegisterPage';
import ApplicantLoginPage from './pages/ApplicantLoginPage';
import ApplicantVerifyEmailPage from './pages/ApplicantVerifyEmailPage';
import ApplicantVerifyPage from './pages/ApplicantVerifyPage';
import ApplicantPortalPage from './pages/ApplicantPortalPage';
import LandingPage from './pages/LandingPage';
import UserProfile from './pages/UserProfile';
import './App.css';

const PrivateRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean; allowModuleAccess?: boolean }> = ({ 
  children, 
  adminOnly = false,
  allowModuleAccess = false
}) => {
  const { user, loading } = useAuth();
  const { modules } = useModules();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (adminOnly) {
    // Wenn allowModuleAccess true ist, auch Benutzer mit Modulberechtigungen durchlassen
    if (allowModuleAccess && modules.length > 0) {
      return <>{children}</>;
    }
    // Sonst nur Admins
    if (user.role !== 'ADMIN') {
      return <Navigate to="/dashboard" />;
    }
  }

  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ModuleProvider>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Applicant Public Routes */}
              <Route path="/applicant/register" element={<ApplicantRegisterPage />} />
              <Route path="/applicant/login" element={<ApplicantLoginPage />} />
              <Route path="/applicant/verify-email" element={<ApplicantVerifyEmailPage />} />
              <Route path="/applicant/verify" element={<ApplicantVerifyPage />} />
              <Route path="/applicant/portal" element={<ApplicantPortalPage />} />
              
              {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <UserProfile />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <PrivateRoute adminOnly allowModuleAccess>
                  <AdminDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/vacation-planner"
              element={
                <PrivateRoute adminOnly>
                  <VacationPlanner />
                </PrivateRoute>
              }
            />
            <Route
              path="/compliance"
              element={
                <PrivateRoute adminOnly>
                  <ComplianceDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/customers"
              element={
                <PrivateRoute adminOnly>
                  <CustomersPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/invoice-templates"
              element={
                <PrivateRoute adminOnly>
                  <InvoiceTemplatesPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/incidents"
              element={
                <PrivateRoute>
                  <IncidentManagement />
                </PrivateRoute>
              }
            />
            <Route
              path="/ehs-dashboard"
              element={
                <PrivateRoute>
                  <EHSDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/ehs-todos"
              element={
                <PrivateRoute>
                  <EHSTodosPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/modules"
              element={
                <PrivateRoute adminOnly>
                  <ModulesPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/module-permissions"
              element={
                <PrivateRoute adminOnly>
                  <ModulePermissionsPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/my-approvals"
              element={
                <PrivateRoute>
                  <MyApprovals />
                </PrivateRoute>
              }
            />
            <Route
              path="/payroll"
              element={
                <PrivateRoute adminOnly>
                  <PayrollManagement />
                </PrivateRoute>
              }
            />
            <Route
              path="/travel-expenses"
              element={
                <PrivateRoute>
                  <TravelExpensesPageWrapper />
                </PrivateRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <PrivateRoute>
                  <MessagesPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/messages/compose"
              element={
                <PrivateRoute>
                  <ComposeMessage />
                </PrivateRoute>
              }
            />
            <Route
              path="/messages/:id"
              element={
                <PrivateRoute>
                  <MessageDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/intranet"
              element={
                <PrivateRoute>
                  <IntranetPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/media"
              element={
                <PrivateRoute>
                  <MediaPageWrapper />
                </PrivateRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <PrivateRoute>
                  <OrdersPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/cost-centers"
              element={
                <PrivateRoute adminOnly allowModuleAccess>
                  <CostCentersPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/zeitmodelle"
              element={
                <PrivateRoute adminOnly allowModuleAccess>
                  <ZeitmodelleVerwaltung />
                </PrivateRoute>
              }
            />
            <Route
              path="/project-planning"
              element={
                <PrivateRoute adminOnly allowModuleAccess>
                  <ProjectPlanningPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/elearning"
              element={
                <PrivateRoute>
                  <ELearningPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/elearning/courses/:id/edit"
              element={
                <PrivateRoute adminOnly>
                  <CourseEditorPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/elearning/courses/:id"
              element={
                <PrivateRoute>
                  <CourseDetailPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/onboarding"
              element={
                <PrivateRoute adminOnly>
                  <OnboardingDashboardPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/onboarding/applicants"
              element={
                <PrivateRoute adminOnly>
                  <ApplicantsPage />
                </PrivateRoute>
              }
            />
            {/* Root Route - Landing Page */}
            <Route path="/" element={<LandingPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Router>
      </ModuleProvider>
    </AuthProvider>
  </ThemeProvider>
  );
}

export default App;
