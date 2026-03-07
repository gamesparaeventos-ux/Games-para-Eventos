import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Download, Filter, User, Users, Calendar } from 'lucide-react';

interface Lead {
  id: string;
  name?: string;
  email?: string;
  whatsapp?: string;
  score?: number;
  created_at: string;
  events?: { name: string };
}

export function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      // Busca leads com dados do evento relacionado
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          events ( name )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads((data as Lead[]) || []);
    } catch (error) {
      console.error('Erro ao buscar leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter(lead => 
    lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportCSV = () => {
    const headers = ['Nome,Email,Whatsapp,Score,Evento,Data'];
    const rows = filteredLeads.map(l => 
      `${l.name || ''},${l.email || ''},${l.whatsapp || ''},${l.score || 0},${l.events?.name || 'N/A'},${new Date(l.created_at).toLocaleDateString()}`
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "leads_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pistas</h1>
          <p className="text-slate-500 text-sm">Visualize todos os leads capturados em eventos</p>
        </div>
        <button 
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-purple-200 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-bold text-sm"
        >
          <Download size={16} /> Exportar CSV
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center"><Users size={24} /></div>
          <div><p className="text-2xl font-bold text-slate-800">{leads.length}</p><p className="text-xs text-slate-500">Total de Leads</p></div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-600 text-white rounded-xl flex items-center justify-center"><Filter size={24} /></div>
          <div><p className="text-2xl font-bold text-slate-800">{filteredLeads.length}</p><p className="text-xs text-slate-500">Leads Filtrados</p></div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center"><Calendar size={24} /></div>
          <div><p className="text-2xl font-bold text-slate-800">0</p><p className="text-xs text-slate-500">Eventos</p></div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar pistas..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-purple-500 transition-all text-slate-700"
          />
        </div>
        <select className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 outline-none focus:border-purple-500">
          <option>Todos os eventos</option>
        </select>
        <select className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 outline-none focus:border-purple-500">
          <option>Todos os jogos</option>
        </select>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-bold text-slate-700">Nome</th>
                <th className="px-6 py-4 font-bold text-slate-700">Telefone</th>
                <th className="px-6 py-4 font-bold text-slate-700">E-mail</th>
                <th className="px-6 py-4 font-bold text-slate-700">Evento</th>
                <th className="px-6 py-4 font-bold text-slate-700">Pontos</th>
                <th className="px-6 py-4 font-bold text-slate-700">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">Carregando dados...</td></tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                      <User size={32} />
                    </div>
                    <p className="text-slate-500 font-medium">Nenhuma pista encontrada</p>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800">{lead.name || '-'}</td>
                    <td className="px-6 py-4">{lead.whatsapp || '-'}</td>
                    <td className="px-6 py-4">{lead.email || '-'}</td>
                    <td className="px-6 py-4"><span className="bg-purple-50 text-purple-700 px-2 py-1 rounded text-xs font-bold">{lead.events?.name || 'Geral'}</span></td>
                    <td className="px-6 py-4 font-mono text-slate-500">{lead.score || 0}</td>
                    <td className="px-6 py-4 text-xs text-slate-400">{new Date(lead.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}