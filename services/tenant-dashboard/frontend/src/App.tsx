import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './layout/DashboardLayout';
import { LoginPage } from './pages/Login';
import { DashboardPage } from './pages/Dashboard';
import { ProfilePage } from './pages/Profile';
import { SettingsPage } from './pages/Settings';
import { CatalogListPage } from './pages/catalog/CatalogList';
import { ProductFormPage } from './pages/catalog/ProductForm';
import { RfqInboxPage } from './pages/rfqs/RfqInbox';
import { RfqDetailPage } from './pages/rfqs/RfqDetail';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/catalog" element={<CatalogListPage />} />
          <Route path="/catalog/new" element={<ProductFormPage />} />
          <Route path="/catalog/:id/edit" element={<ProductFormPage />} />
          <Route path="/rfqs" element={<RfqInboxPage />} />
          <Route path="/rfqs/:id" element={<RfqDetailPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
