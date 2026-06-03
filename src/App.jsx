import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProgressSpinner } from 'primereact/progressspinner';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminLayout from './layout/AdminLayout';
import DashboardPage from './pages/DashboardPage';
import ManagementPage from './pages/ManagementPage';
import UsersPage from './pages/UsersPage';
import AdminsManagement from './pages/management/AdminsManagement';
import DriversManagement from './pages/management/DriversManagement';
import PassengersManagement from './pages/management/PassengersManagement';
import DestinationsManagement from './pages/management/DestinationsManagement';
import TripsHistoryManagement from './pages/management/TripsHistoryManagement';
import LoginPage from './pages/LoginPage';

function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-loading">
        <ProgressSpinner style={{ width: '48px', height: '48px' }} strokeWidth="5" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="management" element={<ManagementPage />} />
            <Route path="management/admins" element={<AdminsManagement />} />
            <Route path="management/drivers" element={<DriversManagement />} />
            <Route path="management/passengers" element={<PassengersManagement />} />
            <Route path="management/destinations" element={<DestinationsManagement />} />
            <Route path="management/trips" element={<TripsHistoryManagement />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
