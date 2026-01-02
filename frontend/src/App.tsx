import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ModuleProvider, useModules } from './contexts/ModuleContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ThemeToggle from './components/ThemeToggle';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import VacationPlanner from './pages/VacationPlanner';
import ComplianceDashboard from './pages/ComplianceDashboard';
import CustomersPage from './pages/CustomersPage';
import InvoiceTemplatesPage from './pages/InvoiceTemplatesPage';
import IncidentManagement from './pages/IncidentManagement';
import ModulesPage from './pages/ModulesPage';
import ModulePermissionsPage from './pages/ModulePermissionsPage';
import MyApprovals from './pages/MyApprovals';
import PayrollManagement from './pages/PayrollManagement';
import { TravelExpensesPageWrapper } from './pages/TravelExpensesPageWrapper';
import MessagesPage from './pages/MessagesPage';
import MessageDetail from './pages/MessageDetail';
import ComposeMessage from './pages/ComposeMessage';import IntranetPage from './pages/Intranet/IntranetPage';import './App.css';

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
            <ThemeToggle />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
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
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Router>
      </ModuleProvider>
    </AuthProvider>
  </ThemeProvider>
  );
}

export default App;
