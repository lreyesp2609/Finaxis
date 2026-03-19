import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MisAnalisis from './pages/MisAnalisis';
import Catalogos from './pages/Catalogos';
import MisSalas from './pages/MisSalas';
import UnirseSala from './pages/UnirseSala';
import AuthCallback from './pages/AuthCallback';
import EditarCatalogo from './pages/EditarCatalogo';
import DashboardLayout from './components/DashboardLayout';
import SalaParticipante from './pages/Salaparticipante';
import VerParticipante from './pages/Verparticipante';

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
          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="analisis" element={<MisAnalisis />} />
            <Route path="catalogos" element={<Catalogos />} />
            <Route path="salas" element={<MisSalas />} />
            <Route path="unirse" element={<UnirseSala />} />
            <Route path="catalogos/:id" element={<EditarCatalogo />} />
            <Route path="sala/:codigo" element={<SalaParticipante />} />
            <Route path="salap/:codigosala/participante/:participanteId" element={<VerParticipante />} />

          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
