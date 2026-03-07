import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { Save, ArrowLeft, Upload, Trash2, Plus, Lock, CheckCircle, Loader2, Image as ImageIcon, Layout, Gift, Eye } from 'lucide-react';

import { RouletteRunner } from '../../player/RouletteRunner';
import { ROULETTE_PALETTE } from '../roulette.types';
import type { RouletteConfig } from '../roulette.types';

export function RouletteEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('draft');
  const [previewKey, setPreviewKey] = useState(0);
  
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const bgInputRef = useRef<HTMLInputElement | null>(null);

  const [config, setConfig] = useState<RouletteConfig>({
    title: 'ROLETA DE PRÊMIOS',
    description: 'Gire a roleta e boa sorte!',
    primaryColor: '#8b5cf6',
    skipLeadGate: false,
    logoUrl: '',
    backgroundImageUrl: '',
    items: ['Prêmio 1', 'Prêmio 2', 'Tente Novamente', 'Brinde'],
    outerRimColor: '#b45309',
    ledColor: '#ffffff'
  });

  useEffect(() => {
    setPreviewKey(prev => prev + 1);
  }, [config.items, config.backgroundImageUrl, config.logoUrl, config.outerRimColor, config.ledColor, config.title]);

  useEffect(() => { 
    loadEvent(); 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadEvent = async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase.from('events').select('*').eq('id', id).single();
      if (error) throw error;
      if (data && data.config) {
        setConfig(prev => ({ ...prev, ...data.config }));
        setStatus(data.status);
      }
    } catch (e) { 
      console.error('Erro ao carregar evento:', e); 
    } finally { 
      setLoading(false); 
    }
  };

  const saveEvent = async () => {
    if (!id) return;
    if (config.items.length < 2) return alert('A roleta precisa de pelo menos 2 prêmios.');
    
    setSaving(true);
    try {
      const { error } = await supabase.from('events').update({ config }).eq('id', id);
      if (error) throw error;
      alert('Configurações salvas!');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      alert('Erro ao salvar: ' + msg);
    } finally {
      setSaving(false);
    }
  };

  const activateEvent = async () => {
    if (!id) return;
    if (!confirm('Ativar por 1 crédito?')) return;
    
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile, error: profileError } = await supabase.from('profiles').select('credits').eq('id', user.id).single();
      if (profileError) throw profileError;
      if (!profile || profile.credits < 1) throw new Error('Sem créditos disponíveis.');
      
      const { error: updateCreditError } = await supabase.from('profiles').update({ credits: profile.credits - 1 }).eq('id', user.id);
      if (updateCreditError) throw updateCreditError;

      const { error: eventError } = await supabase.from('events').update({ status: 'active' }).eq('id', id);
      if (eventError) throw eventError;
      
      setStatus('active');
      alert('Evento ativado com sucesso!');
    } catch (err) { 
      const msg = err instanceof Error ? err.message : 'Erro na ativação';
      alert(msg); 
    } finally { 
      setSaving(false); 
    }
  };

  const handleUpload = async (field: 'logoUrl' | 'backgroundImageUrl', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    try {
      const path = `roulette-${id}-${field}-${Date.now()}`;
      const { error: uploadError } = await supabase.storage.from('uploads').upload(path, file);
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage.from('uploads').getPublicUrl(path);
      setConfig(prev => ({ ...prev, [field]: data.publicUrl }));
    } catch (err) { 
      const msg = err instanceof Error ? err.message : 'Erro no upload';
      alert('Erro no upload: ' + msg); 
    }
  };

  const addPrize = () => {
    if (config.items.length >= 12) return alert('Máximo de 12 itens permitidos.');
    setConfig(prev => ({ ...prev, items: [...prev.items, `Novo Item`] }));
  };

  const removePrize = (idx: number) => {
    if (config.items.length <= 2) return alert('A roleta deve ter no mínimo 2 itens.');
    setConfig(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
  };

  const updatePrize = (idx: number, val: string) => {
    const newItems = [...config.items];
    newItems[idx] = val;
    setConfig(prev => ({ ...prev, items: newItems }));
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-purple-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      
      <header className="bg-white border-b px-6 py-4 sticky top-0 z-30 flex justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-slate-100 rounded-full transition-colors" aria-label="Voltar"><ArrowLeft size={20} /></button>
          <h1 className="text-xl font-bold text-slate-800">Editor de Roleta</h1>
        </div>
        <div className="flex gap-3">
           {status === 'draft' ? (
             <button onClick={activateEvent} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-bold flex gap-2 text-sm shadow transition-all"><Lock size={16} /> Ativar (1 Crédito)</button>
           ) : <span className="bg-green-100 text-green-700 px-4 py-2 rounded-xl font-bold text-sm border border-green-200 flex gap-2 items-center"><CheckCircle size={16}/> Ativo</span>}
           <button onClick={saveEvent} disabled={saving} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-xl font-bold flex gap-2 text-sm shadow transition-all"><Save size={16} /> Salvar</button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto mt-8 px-6 space-y-6">
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><ImageIcon size={20} className="text-purple-600"/> Design da Roleta</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
               <label className="block text-xs font-black text-slate-500 uppercase mb-3">Cor do Aro Externo</label>
               <div className="flex gap-3 items-center">
                 <input type="color" value={config.outerRimColor} onChange={e => setConfig({...config, outerRimColor: e.target.value})} className="w-12 h-12 rounded-lg cursor-pointer border-none bg-transparent" />
                 <span className="text-sm font-mono text-slate-600 uppercase">{config.outerRimColor}</span>
               </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
               <label className="block text-xs font-black text-slate-500 uppercase mb-3">Cor das Lâmpadas (LED)</label>
               <div className="flex gap-3 items-center">
                 <input type="color" value={config.ledColor} onChange={e => setConfig({...config, ledColor: e.target.value})} className="w-12 h-12 rounded-lg cursor-pointer border-none bg-transparent" />
                 <span className="text-sm font-mono text-slate-600 uppercase">{config.ledColor}</span>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div onClick={() => logoInputRef.current?.click()} className="aspect-video rounded-xl border-2 border-dashed border-slate-300 hover:border-purple-500 cursor-pointer flex flex-col items-center justify-center overflow-hidden transition-all bg-slate-50 group">
               {config.logoUrl ? <img src={config.logoUrl} className="h-full object-contain" alt="Logo do Evento" /> : <><Upload className="text-slate-400 group-hover:text-purple-500 mb-2" /><span className="text-xs font-bold text-slate-500">Logo Evento</span></>}
               <input type="file" className="hidden" ref={logoInputRef} onChange={e => handleUpload('logoUrl', e)} accept="image/*" />
            </div>
            <div onClick={() => bgInputRef.current?.click()} className="aspect-video rounded-xl border-2 border-dashed border-slate-300 hover:border-purple-500 cursor-pointer flex flex-col items-center justify-center overflow-hidden transition-all bg-slate-50 group">
               {config.backgroundImageUrl ? <img src={config.backgroundImageUrl} className="w-full h-full object-cover" alt="Imagem de Fundo" /> : <><ImageIcon className="text-slate-400 group-hover:text-purple-500 mb-2" /><span className="text-xs font-bold text-slate-500">Imagem Fundo</span></>}
               <input type="file" className="hidden" ref={bgInputRef} onChange={e => handleUpload('backgroundImageUrl', e)} accept="image/*" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
           <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Layout size={20} className="text-purple-600"/> Textos</h3>
           <div>
             <label className="block text-xs font-black text-slate-500 uppercase mb-2">Escrita Acima da Roleta</label>
             <input 
              type="text" 
              value={config.title} 
              onChange={e => setConfig({...config, title: e.target.value.toUpperCase()})} 
              placeholder="EX: ROLETA DA SORTE" 
              className="w-full px-4 py-3 border-2 border-black rounded-xl font-black text-black bg-white focus:ring-4 focus:ring-purple-100 outline-none transition-all shadow-sm" 
             />
           </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Gift size={20} className="text-purple-600"/> Itens da Roleta</h3>
            <button 
              onClick={addPrize} 
              disabled={config.items.length >= 12} 
              className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl hover:bg-purple-700 transition-all shadow-md font-bold text-sm"
            >
              <Plus size={18} /> Adicionar Item
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {config.items.map((item, idx) => (
              <div key={idx} className="group flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 hover:border-purple-300 transition-all">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-black shadow-sm flex-shrink-0" style={{ backgroundColor: ROULETTE_PALETTE[idx % ROULETTE_PALETTE.length] }}>{idx + 1}</div>
                <input type="text" value={item} onChange={e => updatePrize(idx, e.target.value)} className="flex-1 bg-transparent border-none outline-none font-bold text-slate-700 placeholder:text-slate-300" placeholder="Nome do Prêmio" />
                <button onClick={() => removePrize(idx)} className="p-2 text-slate-400 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100" aria-label="Remover prêmio"><Trash2 size={18} /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Layout size={18} className="text-purple-600"/> Capturar Leads?</h3>
            <button onClick={() => setConfig({...config, skipLeadGate: !config.skipLeadGate})} className={`px-5 py-2 rounded-lg font-black text-xs uppercase transition-all ${!config.skipLeadGate ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
              {!config.skipLeadGate ? 'SIM' : 'NÃO'}
            </button>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-8">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-xl"><Eye size={24} className="text-purple-600"/> Preview Dinâmico</h3>
                <span className="text-xs bg-purple-50 text-purple-700 px-4 py-1.5 rounded-full font-bold border border-purple-100 uppercase">Tempo Real</span>
            </div>
            <div className="w-full min-h-[750px] rounded-[3rem] p-6 bg-slate-100 border-4 border-slate-200 relative shadow-inner flex flex-col items-center justify-center">
                <div className="w-full max-w-4xl h-[650px] overflow-hidden rounded-[2.5rem] border-8 border-slate-800 shadow-2xl bg-black relative">
                    <RouletteRunner key={previewKey} config={config} mode="preview" />
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}