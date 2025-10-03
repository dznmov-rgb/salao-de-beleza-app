// src/components/QRCodeGenerator.tsx

import { QRCodeCanvas } from 'qrcode.react';
import { useRef } from 'react';
import { Download } from 'lucide-react';

type Props = {
  url: string;
};

export default function QRCodeGenerator({ url }: Props) {
  const qrRef = useRef<HTMLDivElement>(null);

  const downloadQRCode = () => {
    if (qrRef.current) {
      const canvas = qrRef.current.querySelector('canvas');
      if (canvas) {
        const image = canvas.toDataURL("image/png");
        const anchor = document.createElement("a");
        anchor.href = image;
        anchor.download = `qrcode-agendamento.png`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 border rounded-lg bg-slate-50">
      <p className="text-slate-600 mb-4 text-center">
        Aponte a câmera do seu celular para testar ou baixe a imagem para imprimir.
      </p>
      
      {/* O componente que renderiza o QR Code */}
      <div ref={qrRef} className="p-4 bg-white border shadow-sm">
        <QRCodeCanvas
          value={url}
          size={256}
          bgColor={"#ffffff"}
          fgColor={"#000000"}
          level={"L"}
          includeMargin={false}
        />
      </div>

      <button
        onClick={downloadQRCode}
        className="mt-6 bg-slate-900 text-white px-5 py-2 rounded-lg font-semibold hover:bg-slate-800 transition flex items-center space-x-2"
      >
        <Download size={18} />
        <span>Baixar Imagem do QR Code</span>
      </button>

      <div className="mt-4 text-center text-xs text-slate-500 break-all">
        <p className="font-semibold">O QR Code aponta para o seguinte endereço:</p>
        <p>{url}</p>
      </div>
    </div>
  );
}