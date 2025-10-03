import { QrCode } from 'lucide-react';

export default function QRCodeGenerator() {
  const quickAppointmentUrl = `${window.location.origin}/quick-appointment`;

  const downloadQRCode = () => {
    const canvas = document.createElement('canvas');
    const size = 400;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, size, size);

      ctx.fillStyle = 'black';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('AGENDE SEU HORÁRIO', size / 2, 40);

      ctx.font = '16px sans-serif';
      ctx.fillText('Escaneie o QR Code', size / 2, size - 40);

      ctx.fillStyle = '#1e293b';
      const qrSize = 240;
      const qrX = (size - qrSize) / 2;
      const qrY = (size - qrSize) / 2;
      ctx.fillRect(qrX, qrY, qrSize, qrSize);
    }

    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'qr-code-agendamento.png';
    link.href = url;
    link.click();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Gerador de QR Code</h2>
      </div>

      <div className="max-w-2xl">
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

          <div className="bg-slate-50 rounded-lg p-6 mb-6">
            <p className="text-sm text-slate-600 mb-2">URL do Agendamento:</p>
            <p className="text-slate-900 font-mono text-sm break-all bg-white px-3 py-2 rounded border border-slate-200">
              {quickAppointmentUrl}
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={downloadQRCode}
              className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition"
            >
              Baixar QR Code
            </button>

            <a
              href={quickAppointmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center px-4 py-3 border-2 border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition"
            >
              Testar Agendamento Rápido
            </a>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Dica:</strong> Para gerar um QR Code real, você pode usar serviços como
              qr-code-generator.com ou qrcode.monkey e inserir a URL acima.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}