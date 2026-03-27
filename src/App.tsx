import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { RestockTool } from './pages/RestockTool';
import { Stores } from './pages/Stores';
import { Events } from './pages/Events';
import { Products } from './pages/Products';
import { DispatchHistory } from './pages/DispatchHistory';
import { Users } from './pages/Users';
import { ComingSoon } from './pages/ComingSoon';
import { Target, Settings } from 'lucide-react';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-skin-bg "><div className="animate-spin text-skin-accent text-4xl">✨</div></div>;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="stores" element={<Stores />} />
            <Route path="events" element={<Events />} />
            <Route path="products" element={<Products />} />
            <Route path="restock" element={<RestockTool />} />
            <Route path="dispatch-history" element={<DispatchHistory />} />
            <Route path="users" element={<Users />} />
            <Route path="goals" element={<ComingSoon title="Metas Corporativas" icon={Target} />} />
            <Route path="settings" element={<ComingSoon title="Ajustes de Sistema" icon={Settings} />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
