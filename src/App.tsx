import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProfileProvider } from './context/ProfileContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Perfiles from './pages/Perfiles';
import Dashboard from './pages/Dashboard';
import AuthCallback from './pages/AuthCallback';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProfileProvider>
          <Routes>
            {/* OAuth Callback strictly handles exchanges and bounces to perfiles/login */}
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Root: always redirect to /login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Public routes: logged-in users bounce to /perfiles */}
            <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

            {/* Protected routes: needs session */}
            <Route path="/perfiles"  element={<ProtectedRoute><Perfiles /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </ProfileProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
