import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MisAnalisis from './pages/MisAnalisis';
import MisSalas from './pages/MisSalas';
import UnirseSala from './pages/UnirseSala';
import AuthCallback from './pages/AuthCallback';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* OAuth Callback handles exchanges and bounces to dashboard/login */}
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Root: always redirect to /login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Public routes: logged-in users bounce to /dashboard */}
          <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* Protected routes: needs session */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard/analisis" element={<ProtectedRoute><MisAnalisis /></ProtectedRoute>} />
          <Route path="/dashboard/salas" element={<ProtectedRoute><MisSalas /></ProtectedRoute>} />
          <Route path="/dashboard/unirse" element={<ProtectedRoute><UnirseSala /></ProtectedRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
