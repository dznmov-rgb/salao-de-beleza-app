import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
// import AppointmentDetailsModal from './AppointmentDetailsModal'; // Removido: 'AppointmentDetailsModal' não é usado diretamente aqui

type Props = {
  events: any[];
  onEventClick: (eventInfo: any) => void;
};

export default function AgendaView({ events, onEventClick }: Props) {
  return (
    <div>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        locale={ptBrLocale}
        events={events}
        eventClick={onEventClick}
        editable={true}
        selectable={true}
        allDaySlot={false}
        slotMinTime="08:00:00"
        slotMaxTime="20:00:00"
      />
    </div>
  );
}