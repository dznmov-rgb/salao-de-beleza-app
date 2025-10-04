import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import QuickAppointment from './pages/QuickAppointment';
import AdminDashboard from './pages/AdminDashboard';
import ProfessionalDashboard from './pages/ProfessionalDashboard';
import SignUp from './pages/SignUp';
import ClientDashboard from './pages/ClientDashboard';

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

  // Efeito para lidar com redirecionamentos baseados no estado de autenticação e role
  useEffect(() => {
    if (!loading) {
      // Se o usuário está logado e tem um perfil
      if (user && profile) {
        // Redirecionar usuários logados de login/cadastro para seus respectivos dashboards
        if (currentPath === '/' || currentPath === '/cadastro') {
          if (profile.role === 'admin') {
            window.history.pushState({}, '', '/admin-dashboard');
            setCurrentPath('/admin-dashboard');
          } else if (profile.role === 'professional') {
            window.history.pushState({}, '', '/professional-dashboard');
            setCurrentPath('/professional-dashboard');
          } else if (profile.role === 'client') {
            window.history.pushState({}, '', '/client-dashboard');
            setCurrentPath('/client-dashboard');
          }
          return; // Sair cedo após o redirecionamento
        }
        // REMOVIDO: Redirecionamento específico para clientes que tentam acessar quick-appointment
        // A lógica de inicialização do QuickAppointment.tsx já lida com clientes logados.
      } else { // O usuário NÃO está logado
        // Redirecionar de dashboards protegidos para o login
        if (currentPath === '/admin-dashboard' || currentPath === '/professional-dashboard' || currentPath === '/client-dashboard') {
          window.history.pushState({}, '', '/');
          setCurrentPath('/');
          return; // Sair cedo após o redirecionamento
        }
      }
    }
  }, [loading, user, profile, currentPath]); // Dependências para este efeito

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

  // Lógica de renderização após todas as verificações de redirecionamento e carregamento
  // Rotas públicas
  if (currentPath === '/quick-appointment') {
    return <QuickAppointment />;
  }
  
  if (currentPath === '/cadastro') {
    return <SignUp />;
  }

  // Se não estiver logado, mostra a página de login (será atingido se nenhuma rota pública corresponder e o usuário não estiver autenticado)
  if (!user || !profile) {
    return <Login />;
  }
  
  // Rotas autenticadas baseadas na role
  if (profile.role === 'admin') {
    return <AdminDashboard />;
  }

  if (profile.role === 'professional') {
    return <ProfessionalDashboard />;
  }

  if (profile.role === 'client') {
    return <ClientDashboard />;
  }

  // Fallback (não deve ser alcançado se a lógica estiver correta)
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