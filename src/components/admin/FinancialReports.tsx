import { DollarSign } from 'lucide-react';

export default function FinancialReports() {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Relatórios Financeiros</h2>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="text-center">
          <DollarSign className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Relatórios Financeiros</h3>
          <p className="text-slate-600">Funcionalidade em desenvolvimento</p>
        </div>
      </div>
    </div>
  );
}