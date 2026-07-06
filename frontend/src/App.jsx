import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './stores/authStore';
import useThemeStore from './stores/themeStore';
import Landing from './pages/Landing';
import Chat from './pages/Chat';
import AdminDashboard from './pages/AdminDashboard';
import Analytics from './pages/Analytics';

export default function App() {
  const init = useAuthStore((s) => s.init);
  const initTheme = useThemeStore((s) => s.initTheme);

  useEffect(() => {
    initTheme();
    init();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/analytics" element={<Analytics />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
