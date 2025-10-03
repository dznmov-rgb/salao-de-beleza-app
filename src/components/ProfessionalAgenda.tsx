import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import AppointmentDetailsModal from './AppointmentDetailsModal';

export default function ProfessionalAgenda() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [selectedEventInfo, setSelectedEventInfo] = useState<any>(null);

  const fetchAppointments = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // **A CHAVE É ESTE FILTRO:** Puxa apenas agendamentos onde o id_profissional é o ID do usuário logado
      const { data, error } = await supabase
        .from('agendamentos')
        .select(`*, servicos(nome_servico), profiles(nome)`);

      if (error) throw error;
      
      const formattedEvents = data.map((item: any) => ({
        id: item.id,
        title: `${item.cliente_nome} - ${item.servicos?.nome_servico || ''}`,
        start: item.data_hora_inicio,
        end: item.data_hora_fim,
        // Mantém a lógica de cor por status
        backgroundColor: item.status === 'concluido' ? '#16a34a' : item.status === 'cancelado' ? '#dc2626' : '#2563eb',
        borderColor: item.status === 'concluido' ? '#15803d' : item.status === 'cancelado' ? '#b91c1c' : '#1d4ed8',
        extendedProps: { professional: item.profiles?.nome || 'N/A' },
      }));
      setAppointments(formattedEvents);

    } catch (error) {
      console.error("Erro ao buscar agenda:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [user]);

  const handleEventClick = (eventInfo: any) => {
    setSelectedEventInfo(eventInfo);
    setIsAppointmentModalOpen(true);
  };

  if (loading) {
    return <p>Carregando sua agenda...</p>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      {isAppointmentModalOpen && (
        <AppointmentDetailsModal 
          eventInfo={selectedEventInfo} 
          onClose={() => setIsAppointmentModalOpen(false)} 
          onStatusChange={fetchAppointments} // Recarrega a agenda após a conclusão/cancelamento
        />
      )}
      <FullCalendar
        plugins={[timeGridPlugin, interactionPlugin]} // Visão semanal/diária é melhor para profissionais
        initialView="timeGridDay" 
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'timeGridWeek,timeGridDay'
        }}
        locale={ptBrLocale}
        events={appointments}
        eventClick={handleEventClick}
        editable={true}
        selectable={true}
        allDaySlot={false}
        slotMinTime="08:00:00"
        slotMaxTime="20:00:00"
        height="auto"
      />
    </div>
  );
}