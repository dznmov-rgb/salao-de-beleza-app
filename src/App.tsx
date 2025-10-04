import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import QuickAppointment from './pages/QuickAppointment';
import AdminDashboard from './pages/AdminDashboard';
import ProfessionalDashboard from './pages/ProfessionalDashboard';
import SignUp from './pages/SignUp';
import ClientDashboard from './pages/ClientDashboard'; // Importa o novo ClientDashboard

function AppRouter() {
  const { user, profile, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Adicionado log para depuração
  console.log('AppRouter: Loading state:', loading, 'User:', user?.id, 'Profile Role:', profile?.role, 'Current Path:', currentPath);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Carregando...</p>
        </div>
      </div>
    );
  }

  // ROTAS PÚBLICAS
  if (currentPath === '/quick-appointment') {
    return <QuickAppointment />;
  }
  
  if (currentPath === '/cadastro') {
    return <SignUp />;
  }

  // SE NÃO ESTIVER LOGADO, VAI PARA O LOGIN
  if (!user || !profile) {
    return <Login />;
  }
  
  // ROTAS PRIVADAS (PAINÉIS)
  if (profile.role === 'admin') {
    return <AdminDashboard />;
  }

  if (profile.role === 'professional') {
    return <ProfessionalDashboard />;
  }

  if (profile.role === 'client') { // Nova rota para clientes
    return <ClientDashboard />;
  }

  // CASO DE FALHA, VAI PARA O LOGIN
  return <Login />;
}

function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;