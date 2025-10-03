// src/components/AgendaView.tsx

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';

type Props = {
  events: any[];
  onEventClick: (eventInfo: any) => void; // NOVA: Prop para lidar com o clique no evento
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
        eventClick={onEventClick} // AQUI ESTÁ A MÁGICA: chama a função quando um evento é clicado
        editable={true}
        selectable={true}
        allDaySlot={false}
        slotMinTime="08:00:00"
        slotMaxTime="20:00:00"
      />
    </div>
  );
}