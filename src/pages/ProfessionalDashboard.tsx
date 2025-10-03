import { useState, useEffect } from 'react';
import { LogOut, Scissors, Phone, ArrowRight, ToggleLeft, ToggleRight, CalendarDays } from 'lucide-react'; // Adicionado CalendarDays
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import AppointmentDetailsModal from '../components/AppointmentDetailsModal';

type Appointment = {
  id: number;
  data_hora_inicio: string;
  cliente_nome: string;
  cliente_telefone: string;
  servicos: { nome_servico: string }[] | null; // Changed to allow array of services
  status: string;
};

export default function ProfessionalDashboard() {
  const { signOut, user, profile } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointmentsToday, setAppointmentsToday] = useState<Appointment[]>([]);
  const [futureAppointments, setFutureAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEventInfo, setSelectedEventInfo] = useState<any>(null);
  
  // Status de trabalho inicial
  const [isWorking, setIsWorking] = useState(profile?.is_working || false);

  const firstName = profile?.full_name ? profile.full_name.split(' ')[0] : 'Profissional';
  const displayDate = currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' });

  // FUNÇÃO PARA ATUALIZAR O STATUS DE TRABALHO
  const toggleWorkingStatus = async () => {
    const newStatus = !isWorking;
    setIsWorking(newStatus);
    try {
      await supabase
        .from('profiles')
        .update({ is_working: newStatus })
        .eq('id', user!.id);
      
      // Recarrega o perfil do usuário para atualizar o estado global (melhoria de UX)
      // fetchProfile(); // Se você tiver essa função, use-a. Por enquanto, só atualizamos localmente.

    } catch (error) {
      console.error("Erro ao atualizar status de trabalho:", error);
      setIsWorking(!newStatus); // Reverte se der erro
    }
  };


  const fetchAppointments = async () => {
    if (!user) return;
    setLoading(true);

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart); tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const targetDayStart = new Date(currentDate); targetDayStart.setHours(0, 0, 0, 0);
    const targetDayEnd = new Date(currentDate); targetDayEnd.setHours(23, 59, 59, 999);

    try {
      // 1. BUSCA AGENDAMENTOS DO DIA ATUALMENTE SELECIONADO
      const { data: todayData } = await supabase
        .from('agendamentos')
        .select(`id, data_hora_inicio, cliente_nome, cliente_telefone, status, servicos(nome_servico)`)
        .eq('id_profissional', user.id)
        .gte('data_hora_inicio', targetDayStart.toISOString())
        .lte('data_hora_inicio', targetDayEnd.toISOString())
        .order('data_hora_inicio', { ascending: true });
      
      setAppointmentsToday(todayData || []); // Ensure it's an array

      // 2. BUSCA AGENDAMENTOS FUTUROS (A PARTIR DE AMANHÃ)
      const { data: futureData } = await supabase
        .from('agendamentos')
        .select(`id, data_hora_inicio, cliente_nome, cliente_telefone, status, servicos(nome_servico)`) // Added cliente_telefone
        .eq('id_profissional', user.id)
        .eq('status', 'agendado')
        .gte('data_hora_inicio', tomorrowStart.toISOString())
        .order('data_hora_inicio', { ascending: true });
      
      setFutureAppointments(futureData || []); // Ensure it's an array

    } catch (error) {
      console.error("Erro ao buscar agenda:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    // Garante que o status do perfil seja carregado no botão
    if (profile?.is_working !== undefined) {
        setIsWorking(profile.is_working);
    }
  }, [user, currentDate]);

  const handleOpenModal = (appt: Appointment) => {
    setSelectedEventInfo({
        event: {
            id: appt.id,
            title: `${appt.cliente_nome} - ${appt.servicos?.[0]?.nome_servico || ''}`, // Access first element of array
            start: new Date(appt.data_hora_inicio),
            extendedProps: { 
                professional: profile?.full_name || 'N/A',
                cliente_nome: appt.cliente_nome, 
                servico_nome: appt.servicos?.[0]?.nome_servico || '', // Access first element of array
                status: appt.status
            }
        }
    });
    setIsModalOpen(true);
  };
  
  const statusMap = {
    agendado: { text: 'Agendado', color: 'bg-blue-100 text-blue-700', border: 'border-blue-500' },
    concluido: { text: 'Concluído', color: 'bg-green-100 text-green-700', border: 'border-green-500' },
    cancelado: { text: 'Cancelado', color: 'bg-red-100 text-red-700', border: 'border-red-500' },
  };
  
  const handleNextDay = () => { const next = new Date(currentDate); next.setDate(next.getDate() + 1); setCurrentDate(next); };
  const handlePrevDay = () => { const prev = new Date(currentDate); prev.setDate(prev.getDate() - 1); setCurrentDate(prev); };
  const handleToday = () => { setCurrentDate(new Date()); };
  
  const totalAgendados = appointmentsToday.filter(a => a.status === 'agendado').length;
  const totalConcluidos = appointmentsToday.filter(a => a.status === 'concluido').length;


  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {isModalOpen && selectedEventInfo && (
        <AppointmentDetailsModal 
          eventInfo={selectedEventInfo} 
          onClose={() => setIsModalOpen(false)} 
          onStatusChange={fetchAppointments} 
        />
      )}
      
      <header className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 shadow-lg flex justify-between items-center">
        <h1 className="text-xl font-bold text-white">Minha Agenda - {firstName}</h1>
        <div className="flex items-center space-x-4">
          
          {/* BOTÃO DE STATUS DE TRABALHO */}
          <button 
            onClick={toggleWorkingStatus}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition ${isWorking ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}
          >
            {isWorking ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
            <span className="text-white font-medium">{isWorking ? 'Em Expediente' : 'Off-line'}</span>
          </button>

          <button 
            onClick={signOut}
            className="text-white flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <LogOut size={18} />
            <span>Sair</span>
          </button>
        </div>
      </header>

      <main className="flex-1 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Seus Atendimentos</h2>
        
        {/* CARDS DE RESUMO VISUALMENTE MELHORADOS */}
        <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-blue-500">
                <p className="text-gray-500 text-sm">Próximos Agendamentos</p>
                <p className="text-3xl font-extrabold text-blue-600 mt-1">{totalAgendados}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-green-500">
                <p className="text-gray-500 text-sm">Concluídos no Dia</p>
                <p className="text-3xl font-extrabold text-green-600 mt-1">{totalConcluidos}</p>
            </div>
        </div>

        {/* NAVEGAÇÃO DE DATA (FOCO DO DIA) */}
        <div className="flex justify-between items-center mb-6 p-3 bg-white rounded-lg shadow-md">
            <button onClick={handlePrevDay} className="p-2 text-gray-800 hover:bg-gray-100 rounded-full">{"<"}</button>
            <span className="font-semibold text-xl text-gray-800">{displayDate}</span>
            <button onClick={handleNextDay} className="p-2 text-gray-800 hover:bg-gray-100 rounded-full">{">"}</button>
            <button onClick={handleToday} className="text-sm bg-blue-100 px-3 py-1 rounded-lg hover:bg-blue-200">Hoje</button>
        </div>

        {/* LISTA DE AGENDAMENTOS DO DIA */}
        <h3 className="text-xl font-bold text-gray-800 mb-3">Agenda de {displayDate}</h3>

        {loading ? <p>Carregando...</p> : appointmentsToday.length === 0 ? (
          <div className="bg-white p-6 rounded-lg text-center text-gray-500 shadow-md">Nenhum agendamento para esta data.</div>
        ) : (
          <div className="space-y-4 mb-10">
            {appointmentsToday.map(appt => (
              <div 
                key={appt.id} 
                onClick={() => handleOpenModal(appt)}
                className={`bg-white p-5 rounded-xl shadow-lg hover:shadow-2xl transition cursor-pointer border-l-4 ${statusMap[appt.status as keyof typeof statusMap].border} flex justify-between items-start`}
              >
                <div className="flex items-center space-x-5">
                    <div className="flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-3 rounded-lg w-16 h-16 flex-shrink-0">
                        <span className="text-lg font-bold">{new Date(appt.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div>
                        <p className="font-extrabold text-lg text-gray-900">{appt.cliente_nome}</p>
                        <div className="text-sm text-gray-600 space-y-0.5 mt-1">
                            <div className="flex items-center space-x-1"><Scissors size={14} className="flex-shrink-0" /><span>{appt.servicos?.[0]?.nome_servico || ''}</span></div>
                            <div className="flex items-center space-x-1"><Phone size={14} className="flex-shrink-0" /><span>{appt.cliente_telefone}</span></div>
                        </div>
                    </div>
                </div>
                <div className="text-right flex flex-col items-end space-y-1">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusMap[appt.status as keyof typeof statusMap].color}`}>
                        {statusMap[appt.status as keyof typeof statusMap].text}
                    </span>
                    <span className="text-gray-400 text-xs mt-2">Clique para Ações</span>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* BLOCO: AGENDAMENTOS FUTUROS (Se houver) */}
        {futureAppointments.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-300">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
                <CalendarDays size={20} className="text-gray-600" />
                <span>Próximos Agendamentos Futuros ({futureAppointments.length})</span>
            </h3>
           
            <div className="space-y-3">
                {futureAppointments.map(appt => (
                    <div key={appt.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center text-gray-700">
                        <div className="flex items-center space-x-3">
                            <ArrowRight size={16} className="text-green-500" />
                            <div>
                                <p className="font-medium">{appt.cliente_nome} ({appt.servicos?.[0]?.nome_servico || ''})</p>
                                <p className="text-xs text-gray-500">
                                    {new Date(appt.data_hora_inicio).toLocaleDateString('pt-BR', { dateStyle: 'short' })} às 
                                    {new Date(appt.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusMap[appt.status as keyof typeof statusMap].color}`}>
                            {statusMap[appt.status as keyof typeof statusMap].text}
                        </span>
                    </div>
                ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}