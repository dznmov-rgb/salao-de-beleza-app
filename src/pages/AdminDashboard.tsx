import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Scissors, 
  Calendar, 
  User, 
  BarChart2, 
  QrCode,
  LogOut
} from 'lucide-react';
import TeamManagement from '../components/admin/TeamManagement';
import ServiceManagement from '../components/admin/ServiceManagement';
import ScheduleView from '../components/admin/ScheduleView';
import Clientes from './Clientes';
import FinancialReports from '../components/admin/FinancialReports';
import QRCodeGenerator from '../components/QRCodeGenerator';
import AdminDashboardOverview from '../components/admin/AdminDashboardOverview'; // Importa o novo componente

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard },
  { name: 'Equipe', icon: Users },
  { name: 'Serviços', icon: Scissors },
  { name: 'Agenda', icon: Calendar },
  { name: 'Clientes', icon: User },
  { name: 'Relatórios', icon: BarChart2 },
  { name: 'QR Code', icon: QrCode },
];

export default function AdminDashboard() {
  const { signOut } = useAuth(); // 'profile' removido daqui
  const [activeTab, setActiveTab] = useState('Dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'Dashboard':
        return <AdminDashboardOverview />; // Renderiza o novo componente aqui
      case 'Equipe':
        return <TeamManagement />;
      case 'Serviços':
        return <ServiceManagement />;
      case 'Agenda':
        return <ScheduleView />;
      case 'Clientes':
        return <Clientes />;
      case 'Relatórios':
        return <FinancialReports />;
      case 'QR Code':
        const quickAppointmentUrl = `${window.location.origin}/quick-appointment`;
        return (
          <div className="max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900">Gerador de QR Code</h2>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-slate-100 rounded-2xl mb-6">
                  <QrCode className="w-16 h-16 text-slate-900" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                  QR Code de Agendamento Rápido
                </h3>
                <p className="text-slate-600">
                  Imprima este QR Code e posicione no balcão do salão para que clientes possam agendar
                  diretamente
                </p>
              </div>
              <QRCodeGenerator url={quickAppointmentUrl} />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-900">Salão Manager</h1>
        </div>
        <nav className="mt-6">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={`w-full flex items-center space-x-3 px-6 py-3 text-left transition ${
                activeTab === item.name
                  ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 w-64 p-6 border-t">
          <button
            onClick={signOut}
            className="w-full flex items-center space-x-3 px-6 py-3 text-left text-gray-700 hover:bg-gray-50 transition"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">{activeTab}</h2>
          </div>
        </header>
        <main className="flex-1 p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}