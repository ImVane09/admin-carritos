import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProgressSpinner } from 'primereact/progressspinner';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminLayout from './layout/AdminLayout';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ManagementPage = lazy(() => import('./pages/ManagementPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const AdminsManagement = lazy(() => import('./pages/management/AdminsManagement'));
const DriversManagement = lazy(() => import('./pages/management/DriversManagement'));
const PassengersManagement = lazy(() => import('./pages/management/PassengersManagement'));
const DestinationsManagement = lazy(() => import('./pages/management/DestinationsManagement'));
const VehiclesManagement = lazy(() => import('./pages/management/VehiclesManagement'));
const TripsHistoryManagement = lazy(() => import('./pages/management/TripsHistoryManagement'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));

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
        <Suspense fallback={
          <div className="page-loading" style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            width: '100%'
          }}>
            <ProgressSpinner style={{ width: '48px', height: '48px' }} strokeWidth="5" />
          </div>
        }>
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
              <Route path="reports" element={<ReportsPage />} />
              <Route path="management" element={<ManagementPage />} />
              <Route path="management/admins" element={<AdminsManagement />} />
              <Route path="management/drivers" element={<DriversManagement />} />
              <Route path="management/passengers" element={<PassengersManagement />} />
              <Route path="management/destinations" element={<DestinationsManagement />} />
              <Route path="management/vehicles" element={<VehiclesManagement />} />
              <Route path="management/trips" element={<TripsHistoryManagement />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
