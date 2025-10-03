import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Profile } from '../lib/supabase';
import { LayoutDashboard, Users, Scissors, Calendar, BarChart2, QrCode, LogOut, Edit, Trash2, Clock, User } from 'lucide-react';
import AddProfessionalModal from '../components/AddProfessionalModal';
import ServiceModal from '../components/ServiceModal';
import AgendaView from '../components/AgendaView';
import QRCodeGenerator from '../components/QRCodeGenerator';
import EditProfessionalModal from '../components/EditProfessionalModal';
import AppointmentDetailsModal from '../components/AppointmentDetailsModal';
import Clientes from './Clientes';

type Service = { id: number; nome_servico: string; preco: number; duracao_media_minutos: number; };
type DashboardStats = { teamCount: number; serviceCount: number; workingCount: number; };

export default function AdminDashboard() {
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('Dashboard');
  
  const [isProfessionalModalOpen, setIsProfessionalModalOpen] = useState(false);
  const [team, setTeam] = useState<Profile[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(true);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [professionalToEdit, setProfessionalToEdit] = useState<Profile | null>(null);

  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [serviceToEdit, setServiceToEdit] = useState<Service | null>(null);
  
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [selectedEventInfo, setSelectedEventInfo] = useState<any>(null);

  const [successMessage, setSuccessMessage] = useState('');
  const [stats, setStats] = useState<DashboardStats>({ teamCount: 0, serviceCount: 0, workingCount: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);

  const [reportData, setReportData] = useState({ totalRevenue: 0 });
  const [loadingReport, setLoadingReport] = useState(true);
  const [dateRange, setDateRange] = useState('month');

  const fetchTeam = async () => {
    setLoadingTeam(true);
    try {
      const { data, error } = await supabase.from('profiles').select('*, is_working').eq('role', 'professional');
      if (error) throw error;
      setTeam(data || []);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoadingTeam(false);
    }
  };

  const handleAddProfessionalSuccess = () => {
    setSuccessMessage('Profissional adicionado!');
    fetchTeam();
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleEditProfessionalSuccess = () => {
    setSuccessMessage('Profissional atualizado!');
    fetchTeam();
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const openEditModal = (profile: Profile) => {
    setProfessionalToEdit(profile);
    setIsEditModalOpen(true);
  };

  const deleteProfessional = async (profileId: string) => {
    if (window.confirm('Tem certeza?')) {
      try {
        await supabase.from('profiles').delete().eq('id', profileId);
        setSuccessMessage('Profissional deletado!');
        fetchTeam();
      } catch (error) {
        console.error('Erro:', error);
      }
    }
  };
  
  const fetchServices = async () => {
    setLoadingServices(true);
    try {
      const { data, error } = await supabase.from('servicos').select('*').order('nome_servico');
      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoadingServices(false);
    }
  };

  const handleAddServiceSuccess = () => {
    setSuccessMessage('Serviço salvo!');
    fetchServices();
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const openServiceModal = (service: Service | null = null) => {
    setServiceToEdit(service);
    setIsServiceModalOpen(true);
  };

  const deleteService = async (serviceId: number) => {
    if (window.confirm('Tem certeza?')) {
      try {
        await supabase.from('servicos').delete().eq('id', serviceId);
        setSuccessMessage('Serviço deletado!');
        fetchServices();
      } catch (error) {
        console.error('Erro:', error);
      }
    }
  };
  
  const fetchDashboardStats = async () => {
    setLoadingStats(true);
    try {
      const { count: teamCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'professional');
      const { count: serviceCount } = await supabase.from('servicos').select('*', { count: 'exact', head: true });
      const { count: workingCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'professional').eq('is_working', true);
      setStats({ teamCount: teamCount || 0, serviceCount: serviceCount || 0, workingCount: workingCount || 0 });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setLoadingStats(false);
    }
  };
  
  const fetchAppointments = async () => {
    setLoadingAppointments(true);
    try {
      const { data, error } = await supabase.from('agendamentos').select(`*, clientes(nome_completo), servicos(nome_servico), profiles(full_name)`);
      if (error) throw error;
      const formattedEvents = data.map((item: any) => ({
        id: item.id,
        title: `${item.clientes?.nome_completo || 'Cliente'} - ${item.servicos?.nome_servico || ''}`,
        start: item.data_hora_inicio,
        end: item.data_hora_fim,
        backgroundColor: item.status === 'concluido' ? '#16a34a' : item.status === 'cancelado' ? '#dc2626' : '#2563eb',
        borderColor: item.status === 'concluido' ? '#15803d' : item.status === 'cancelado' ? '#b91c1c' : '#1d4ed8',
        extendedProps: { professional: item.profiles?.full_name || 'N/A' },
      }));
      setAppointments(formattedEvents);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoadingAppointments(false);
    }
  };
  
  const fetchReportData = async () => {
    setLoadingReport(true);
    const now = new Date();
    let startDate = new Date();
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);
    
    if (dateRange === 'today') {
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
    } else if (dateRange === 'week') {
      const firstDayOfWeek = now.getDate() - now.getDay();
      startDate = new Date(now.setDate(firstDayOfWeek));
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
    }
    
    try {
      const { data, error } = await supabase
        .from('agendamentos')
        .select('servicos(preco)')
        .eq('status', 'concluido')
        .gte('data_hora_inicio', startDate.toISOString())
        .lte('data_hora_inicio', endDate.toISOString());
      
      if (error) throw error;
      
      const totalRevenue = data.reduce((acc, current) => acc + (current.servicos?.preco || 0), 0);
      setReportData({ totalRevenue });
    } catch (error) {
      console.error('Erro ao buscar dados do relatório:', error);
    } finally {
      setLoadingReport(false);
    }
  };

  const handleEventClick = (eventInfo: any) => {
    setSelectedEventInfo(eventInfo);
    setIsAppointmentModalOpen(true);
  };

  const qrCodeUrl = typeof window !== 'undefined' ? `${window.location.origin}/quick-appointment` : '';
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Equipe', icon: Users },
    { name: 'Serviços', icon: Scissors },
    { name: 'Agenda', icon: Calendar },
    { name: 'Relatórios', icon: BarChart2 },
    { name: 'QR Code', icon: QrCode },
    { name: 'Clientes', icon: User },
  ];

  useEffect(() => {
    if (activeTab === 'Equipe') fetchTeam();
    if (activeTab === 'Serviços') fetchServices();
    if (activeTab === 'Dashboard') fetchDashboardStats();
    if (activeTab === 'Agenda') fetchAppointments();
    if (activeTab === 'Relatórios') fetchReportData();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'Relatórios') {
      fetchReportData();
    }
  }, [dateRange]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-secondary">
      {isProfessionalModalOpen && <AddProfessionalModal onClose={() => setIsProfessionalModalOpen(false)} onSuccess={handleAddProfessionalSuccess} />}
      {isEditModalOpen && professionalToEdit && <EditProfessionalModal profile={professionalToEdit} onClose={() => setIsEditModalOpen(false)} onSuccess={handleEditProfessionalSuccess} />}
      {isServiceModalOpen && <ServiceModal serviceToEdit={serviceToEdit} onClose={() => setIsServiceModalOpen(false)} onSuccess={handleAddServiceSuccess} />}
      {isAppointmentModalOpen && (
        <AppointmentDetailsModal eventInfo={selectedEventInfo} onClose={() => setIsAppointmentModalOpen(false)} onStatusChange={fetchAppointments} />
      )}
      
      <aside className="w-64 bg-primary text-white flex-col hidden md:flex">
        <div className="p-6 text-xl font-bold border-b border-primary-dark whitespace-nowrap">Painel Admin</div>
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                onClick={() => setActiveTab(item.name)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${activeTab === item.name ? 'bg-primary-dark' : 'hover:bg-white/20'}`}
              >
                <Icon size={20} className="flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-primary-dark">
          <button onClick={signOut} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/20 transition">
            <LogOut size={20} className="flex-shrink-0" />
            <span className="truncate">Sair</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-primary">{activeTab}</h1>
          {activeTab === 'Equipe' && (
            <button onClick={() => setIsProfessionalModalOpen(true)} className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-lg font-semibold flex items-center space-x-2">
              <Users size={18} />
              <span>Adicionar Profissional</span>
            </button>
          )}
          {activeTab === 'Serviços' && (
            <button onClick={() => openServiceModal()} className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-lg font-semibold flex items-center space-x-2">
              <Scissors size={18} />
              <span>Adicionar Serviço</span>
            </button>
          )}
        </div>

        {(activeTab === 'Equipe' || activeTab === 'Serviços') && successMessage && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md">
            <p>{successMessage}</p>
          </div>
        )}

        {activeTab === 'Dashboard' && (
          loadingStats ? (
            <p className="bg-white p-6 rounded-lg shadow-md">Carregando...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Users className="text-blue-600" size={24} />
                </div>
                <div>
                  <p className="text-slate-500 text-sm">Total de Profissionais</p>
                  <p className="text-2xl font-bold text-slate-800">{stats.teamCount}</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4">
                <div className={`p-3 rounded-full ${stats.workingCount > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  <Clock className={`${stats.workingCount > 0 ? 'text-green-600' : 'text-red-600'}`} size={24} />
                </div>
                <div>
                  <p className="text-slate-500 text-sm">Profissionais Online</p>
                  <p className="text-2xl font-bold text-slate-800">{stats.workingCount}</p>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <Scissors className="text-green-600" size={24} />
                </div>
                <div>
                  <p className="text-slate-500 text-sm">Total de Serviços</p>
                  <p className="text-2xl font-bold text-slate-800">{stats.serviceCount}</p>
                </div>
              </div>
            </div>
          )
        )}
        
        {activeTab === 'Relatórios' && (
          <div>
            <div className="flex space-x-2 mb-6">
              <button onClick={() => setDateRange('today')} className={`px-4 py-2 rounded-lg ${dateRange === 'today' ? 'bg-primary text-white' : 'bg-white'}`}>
                Hoje
              </button>
              <button onClick={() => setDateRange('week')} className={`px-4 py-2 rounded-lg ${dateRange === 'week' ? 'bg-primary text-white' : 'bg-white'}`}>
                Esta Semana
              </button>
              <button onClick={() => setDateRange('month')} className={`px-4 py-2 rounded-lg ${dateRange === 'month' ? 'bg-primary text-white' : 'bg-white'}`}>
                Este Mês
              </button>
            </div>
            {loadingReport ? (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <p>Carregando...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <p className="text-slate-500 text-sm">Faturamento Total</p>
                  <p className="text-3xl font-bold text-slate-800">
                    R$ {reportData.totalRevenue.toFixed(2).replace('.', ',')}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab !== 'Dashboard' && activeTab !== 'Relatórios' && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            {activeTab === 'Equipe' && (
              loadingTeam ? (
                <p>Carregando...</p>
              ) : team.length === 0 ? (
                <p>Nenhum profissional cadastrado.</p>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b">
                      <th className="p-3">Nome</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {team.map(profile => (
                      <tr key={profile.id} className="border-b hover:bg-slate-50">
                        <td className="p-3 font-medium">{profile.nome}</td>
                        <td className="p-3 text-slate-600">{profile.email || 'N/A'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${profile.is_working ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {profile.is_working ? 'Online' : 'Offline'}
                          </span>
                        </td>
                        <td className="p-3 flex space-x-3">
                          <button onClick={() => openEditModal(profile)}>
                            <Edit size={18} />
                          </button>
                          <button onClick={() => deleteProfessional(profile.id)}>
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
            {activeTab === 'Serviços' && (
              loadingServices ? (
                <p>Carregando...</p>
              ) : services.length === 0 ? (
                <p>Nenhum serviço cadastrado.</p>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b">
                      <th className="p-3">Serviço</th>
                      <th className="p-3">Preço</th>
                      <th className="p-3">Duração</th>
                      <th className="p-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map(service => (
                      <tr key={service.id} className="border-b hover:bg-slate-50">
                        <td className="p-3 font-medium">{service.nome_servico}</td>
                        <td className="p-3">R$ {service.preco.toFixed(2).replace('.', ',')}</td>
                        <td className="p-3">{service.duracao_media_minutos} min</td>
                        <td className="p-3 flex space-x-3">
                          <button onClick={() => openServiceModal(service)}>
                            <Edit size={18} />
                          </button>
                          <button onClick={() => deleteService(service.id)}>
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
            {activeTab === 'Agenda' && (
              loadingAppointments ? (
                <p>Carregando...</p>
              ) : (
                <AgendaView events={appointments} onEventClick={handleEventClick} />
              )
            )}
            {activeTab === 'QR Code' && <QRCodeGenerator url={qrCodeUrl} />}
            {activeTab === 'Clientes' && <Clientes />}
          </div>
        )}
      </main>
      
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-primary border-t border-primary-dark flex justify-around">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.name)}
              className={`flex flex-col items-center justify-center space-y-1 p-2 w-full ${activeTab === item.name ? 'text-white' : 'text-slate-300 hover:text-white'}`}
            >
              <Icon size={24} />
              <span className="text-xs truncate">{item.name}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}