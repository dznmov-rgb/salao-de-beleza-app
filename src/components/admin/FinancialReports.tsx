import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { DollarSign, TrendingUp, Calendar, Users } from 'lucide-react';

type ProfessionalReport = {
  id: string;
  nome: string;
  totalServicos: number;
  faturamento: number;
  comissao: number;
  commission_percentage: number;
};

export default function FinancialReports() {
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reports, setReports] = useState<ProfessionalReport[]>([]);
  const [totals, setTotals] = useState({
    totalRevenue: 0,
    totalCommissions: 0,
    totalServices: 0
  });

  useEffect(() => {
    loadReports();
  }, [startDate, endDate]);

  const loadReports = async () => {
    const { data: professionals } = await supabase
      .from('profiles')
      .select('id, nome, commission_percentage')
      .eq('role', 'professional')
      .eq('ativo', true);

    if (!professionals) return;

    const professionalReports: ProfessionalReport[] = [];
    let totalRev = 0;
    let totalComm = 0;
    let totalServ = 0;

    for (const prof of professionals) {
      const { data: appointments } = await supabase
        .from('agendamentos')
        .select('servicos(preco)')
        .eq('id_profissional', prof.id)
        .eq('status', 'executado')
        .gte('data_hora', `${startDate}T00:00:00`)
        .lte('data_hora', `${endDate}T23:59:59`);

      const faturamento = appointments?.reduce(
        (sum, item: any) => sum + (item.servicos?.preco || 0),
        0
      ) || 0;

      const comissao = faturamento * (prof.commission_percentage / 100);

      professionalReports.push({
        id: prof.id,
        nome: prof.nome,
        totalServicos: appointments?.length || 0,
        faturamento,
        comissao,
        commission_percentage: prof.commission_percentage
      });

      totalRev += faturamento;
      totalComm += comissao;
      totalServ += appointments?.length || 0;
    }

    setReports(professionalReports);
    setTotals({
      totalRevenue: totalRev,
      totalCommissions: totalComm,
      totalServices: totalServ
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Relatórios Financeiros</h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Data Inicial</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Data Final</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Faturamento Total</p>
              <p className="text-2xl font-bold text-slate-900">
                R$ {totals.totalRevenue.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Total de Comissões</p>
              <p className="text-2xl font-bold text-slate-900">
                R$ {totals.totalCommissions.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-slate-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Serviços Realizados</p>
              <p className="text-2xl font-bold text-slate-900">{totals.totalServices}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-xl font-bold text-slate-900">Detalhamento por Profissional</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                  Profissional
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                  Serviços
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                  Faturamento
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                  % Comissão
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">
                  Comissão
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-slate-900 font-medium">{report.nome}</td>
                  <td className="px-6 py-4 text-slate-700">{report.totalServicos}</td>
                  <td className="px-6 py-4 text-slate-700">
                    R$ {report.faturamento.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-slate-700">
                    {report.commission_percentage}%
                  </td>
                  <td className="px-6 py-4 text-slate-900 font-semibold">
                    R$ {report.comissao.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}