import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import EmployeeDetails from './pages/EmployeeDetails';
import EmployeeForm from './pages/EmployeeForm';
import Departments from './pages/Departments';
import DepartmentForm from './pages/DepartmentForm';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#fff',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="employees" element={<Employees />} />
          <Route path="employees/:id" element={<EmployeeDetails />} />
          <Route
            path="employees/new"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
                <EmployeeForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="employees/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Manager']}>
                <EmployeeForm />
              </ProtectedRoute>
            }
          />
          <Route path="departments" element={<Departments />} />
          <Route
            path="departments/new"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <DepartmentForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="departments/:id/edit"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <DepartmentForm />
              </ProtectedRoute>
            }
          />
          <Route path="settings" element={<Settings />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
