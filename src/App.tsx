import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { InstallAppBanner } from './components/common/InstallAppBanner';
import { LoginScreen } from './components/screens/LoginScreen';
import { SignupScreen } from './components/screens/SignupScreen';
import { ForgotPasswordScreen } from './components/screens/ForgotPasswordScreen';
import { SetupScreen } from './components/screens/SetupScreen';
import { HomeScreen } from './components/screens/HomeScreen';
import { SavingsScreen } from './components/screens/SavingsScreen';
import { ExpensesScreen } from './components/screens/ExpensesScreen';
import { AddExpenseScreen } from './components/screens/AddExpenseScreen';
import { SplitBillScreen } from './components/screens/SplitBillScreen';
import { HostelExpensesScreen } from './components/screens/HostelExpensesScreen';
import { MonthlyReportScreen } from './components/screens/MonthlyReportScreen';
import { AdminScreen } from './components/screens/AdminScreen';
import { LayoutDashboard, Receipt, PiggyBank, BarChart3, PlusCircle } from 'lucide-react';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRole?: 'student' | 'parent' }> = ({ children, allowedRole }) => {
  const { user } = useFinance();
  if (!user || !user.isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === 'parent' ? '/admin' : '/'} replace />;
  }

  return <>{children}</>;
};

const NavigationShell: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useFinance();

  const isAuthPage = ['/login', '/signup', '/forgot-password', '/setup', '/admin'].includes(location.pathname);
  const showBottomNav = user?.isLoggedIn && user.role === 'student' && !isAuthPage;

  return (
    <div className="app-container">
      {/* Mobile PWA / WebAPK Install Header Banner */}
      <InstallAppBanner />

      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/signup" element={<SignupScreen />} />
        <Route path="/forgot-password" element={<ForgotPasswordScreen />} />

        {/* Parent / Admin Route */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRole="parent">
            <AdminScreen />
          </ProtectedRoute>
        } />

        {/* Student Protected Routes */}
        <Route path="/setup" element={
          <ProtectedRoute allowedRole="student">
            <SetupScreen />
          </ProtectedRoute>
        } />
        <Route path="/" element={
          <ProtectedRoute>
            {user?.role === 'parent' ? <Navigate to="/admin" replace /> : <HomeScreen />}
          </ProtectedRoute>
        } />
        <Route path="/expenses" element={
          <ProtectedRoute allowedRole="student">
            <ExpensesScreen />
          </ProtectedRoute>
        } />
        <Route path="/add-expense" element={
          <ProtectedRoute allowedRole="student">
            <AddExpenseScreen />
          </ProtectedRoute>
        } />
        <Route path="/savings" element={
          <ProtectedRoute allowedRole="student">
            <SavingsScreen />
          </ProtectedRoute>
        } />
        <Route path="/split-bill" element={
          <ProtectedRoute allowedRole="student">
            <SplitBillScreen />
          </ProtectedRoute>
        } />
        <Route path="/hostel-expenses" element={
          <ProtectedRoute allowedRole="student">
            <HostelExpensesScreen />
          </ProtectedRoute>
        } />
        <Route path="/monthly-report" element={
          <ProtectedRoute allowedRole="student">
            <MonthlyReportScreen />
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to={user?.role === 'parent' ? '/admin' : '/'} replace />} />
      </Routes>

      {/* Global Student Bottom Navigation */}
      {showBottomNav && (
        <nav className="bottom-nav">
          <button
            type="button"
            className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}
            onClick={() => navigate('/')}
          >
            <LayoutDashboard size={20} />
            <span>Home</span>
          </button>

          <button
            type="button"
            className={`nav-item ${location.pathname === '/expenses' ? 'active' : ''}`}
            onClick={() => navigate('/expenses')}
          >
            <Receipt size={20} />
            <span>Expenses</span>
          </button>

          <button
            type="button"
            className={`nav-item ${location.pathname === '/add-expense' ? 'active' : ''}`}
            onClick={() => navigate('/add-expense')}
            style={{ color: location.pathname === '/add-expense' ? '#4F46E5' : '#64748B' }}
          >
            <PlusCircle size={20} color="#4F46E5" />
            <span style={{ fontWeight: 700, color: '#4F46E5' }}>+ Add</span>
          </button>

          <button
            type="button"
            className={`nav-item ${location.pathname === '/savings' ? 'active' : ''}`}
            onClick={() => navigate('/savings')}
          >
            <PiggyBank size={20} />
            <span>Savings</span>
          </button>

          <button
            type="button"
            className={`nav-item ${location.pathname === '/monthly-report' ? 'active' : ''}`}
            onClick={() => navigate('/monthly-report')}
          >
            <BarChart3 size={20} />
            <span>Report</span>
          </button>
        </nav>
      )}
    </div>
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <BrowserRouter>
        <NavigationShell />
      </BrowserRouter>
    </FinanceProvider>
  );
}
