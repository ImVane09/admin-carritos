import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProgressSpinner } from 'primereact/progressspinner';
import ProtectedRoute from './components/ProtectedRoute';
import PermissionRoute from './components/PermissionRoute';
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
const ShiftsManagement = lazy(() => import('./pages/management/ShiftsManagement'));
const AssignmentsManagement = lazy(() => import('./pages/management/AssignmentsManagement'));
const ComplaintsManagement = lazy(() => import('./pages/management/ComplaintsManagement'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DriverReport = lazy(() => import('./pages/reports/DriverReport'));
const RouteReport = lazy(() => import('./pages/reports/RouteReport'));
const PassengerReport = lazy(() => import('./pages/reports/PassengerReport'));

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
              <Route index element={
                <PermissionRoute permission="view_dashboard">
                  <DashboardPage />
                </PermissionRoute>
              } />
              <Route path="users" element={
                <PermissionRoute permission="manage_users">
                  <UsersPage />
                </PermissionRoute>
              } />
              <Route path="reports/drivers" element={
                <PermissionRoute permission="view_driver_reports">
                  <DriverReport />
                </PermissionRoute>
              } />
              <Route path="reports/routes" element={
                <PermissionRoute permission="view_route_reports">
                  <RouteReport />
                </PermissionRoute>
              } />
              <Route path="reports/passengers" element={
                <PermissionRoute permission="view_passenger_reports">
                  <PassengerReport />
                </PermissionRoute>
              } />
              <Route path="management" element={
                <PermissionRoute permission="manage_users">
                  <ManagementPage />
                </PermissionRoute>
              } />
              <Route path="management/admins" element={
                <PermissionRoute permission="manage_admins">
                  <AdminsManagement />
                </PermissionRoute>
              } />
              <Route path="management/drivers" element={
                <PermissionRoute permission="manage_users">
                  <DriversManagement />
                </PermissionRoute>
              } />
              <Route path="management/passengers" element={
                <PermissionRoute permission="manage_users">
                  <PassengersManagement />
                </PermissionRoute>
              } />
              <Route path="management/destinations" element={
                <PermissionRoute permission="manage_destinations">
                  <DestinationsManagement />
                </PermissionRoute>
              } />
              <Route path="management/vehicles" element={
                <PermissionRoute permission="manage_vehicles">
                  <VehiclesManagement />
                </PermissionRoute>
              } />
              <Route path="management/trips" element={
                <PermissionRoute permission="view_history">
                  <TripsHistoryManagement />
                </PermissionRoute>
              } />
              <Route path="management/shifts" element={
                <PermissionRoute permission="manage_users">
                  <ShiftsManagement />
                </PermissionRoute>
              } />
              <Route path="management/assignments" element={
                <PermissionRoute permission="manage_users">
                  <AssignmentsManagement />
                </PermissionRoute>
              } />
              <Route path="management/complaints" element={
                <PermissionRoute permission="view_passenger_reports">
                  <ComplaintsManagement />
                </PermissionRoute>
              } />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
