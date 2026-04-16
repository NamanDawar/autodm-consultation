import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Services from './pages/Services';
import Bookings from './pages/Bookings';
import MyPage from './pages/MyPage';
import PublicPage from './pages/PublicPage';
import Automation from './pages/Automation';

const ProtectedRoute = ({ children }) => {
  const { creator, loading } = useAuth();
  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#080810',color:'#fff'}}>Loading...</div>;
  return creator ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
  const { creator } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={!creator ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/signup" element={!creator ? <Signup /> : <Navigate to="/dashboard" />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/automations" element={<ProtectedRoute><Automation /></ProtectedRoute>} />
      <Route path="/services" element={<ProtectedRoute><Services /></ProtectedRoute>} />
      <Route path="/bookings" element={<ProtectedRoute><Bookings /></ProtectedRoute>} />
      <Route path="/my-page" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />
      <Route path="/:slug" element={<PublicPage />} />
      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="bottom-right" toastOptions={{ style: { background: '#1a1a26', color: '#f7f6ff', border: '1px solid rgba(255,255,255,0.1)' } }} />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}