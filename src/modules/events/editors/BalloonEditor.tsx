import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { Save, ArrowLeft, Upload, Trash2, Lock, CheckCircle, Loader2, Image as ImageIcon, Layout, Settings, Palette, Clock, Gauge, GripHorizontal, Eye } from 'lucide-react';

// --- IMPORTS DO MOTOR E TIPOS (Caminhos ajustados pela estrutura da imagem 4c0d43) ---
import { BalloonRunner } from '../../player/BalloonRunner';
import { ALL_BALLOON_COLORS } from '../balloon.types';
import type { BalloonConfig } from '../balloon.types';

export function BalloonEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('draft');
  const [previewKey, setPreviewKey] = useState(0);
  
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const bgInputRef = useRef<HTMLInputElement | null>(null);
  const balloonLogoInputRef = useRef<HTMLInputElement | null>(null);

  const [config, setConfig] = useState<BalloonConfig>({
    title: 'Estoura Balão',
    description: 'Toque na cor correta!',
    primaryColor: '#8b5cf6',
    skipLeadGate: false,
    logoUrl: '',
    backgroundImageUrl: '',
    balloonLogoUrl: '',
    balloonCount: 5,
    speed: 2,
    duration: 60,
    activeColors: ALL_BALLOON_COLORS.map(c => c.hex)
  });

  useEffect(() => {
    setPreviewKey(prev => prev + 1);
  }, [config.speed, config.balloonCount, config.activeColors, config.balloonLogoUrl, config.backgroundImageUrl]);

  useEffect(() => { loadEvent(); }, [id]);

  const loadEvent = async () => {
    if (!id) return;
    try {
      const { data } = await supabase.from('events').select('*').eq('id', id).single();
      if (data && data.config) {
        setConfig({ ...config, ...data.config });
        setStatus(data.status);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const saveEvent = async () => {
    setSaving(true);
    const { error } = await supabase.from('events').update({ config }).eq('id', id);
    setSaving(false);
    if(error) alert('Erro ao salvar');
    else alert('Configurações salvas com sucesso!');
  };

  const activateEvent = async () => {
    if (!confirm('Ativar por 1 crédito?')) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // CORREÇÃO: Adicionado 'id' como primeiro argumento no .eq()
      const { data: profile } = await supabase.from('profiles').select('credits').eq('id', user.id).single();
      
      if (!profile || profile.credits < 1) throw new Error('Sem créditos.');

      // CORREÇÃO: Adicionado 'id' como primeiro argumento no .eq()
      await supabase.from('profiles').update({ credits: profile.credits - 1 }).eq('id', user.id);
      
      // CORREÇÃO: Adicionado 'id' como primeiro argumento no .eq()
      await supabase.from('events').update({ status: 'active' }).eq('id', id);

      setStatus('active');
      alert('Ativado!');
    } catch (err: any) { alert(err.message); } finally { setSaving(false); }
  };

  const handleUpload = async (field: 'logoUrl' | 'backgroundImageUrl' | 'balloonLogoUrl', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const path = `balloon-${id}-${field}-${Date.now()}`;
      const { error } = await supabase.storage.from('uploads').upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from('uploads').getPublicUrl(path);
      setConfig({ ...config, [field]: data.publicUrl });
    } catch (e) { alert('Erro no upload'); }
  };

  const toggleColor = (hex: string) => {
    const current = config.activeColors;
    if (current.includes(hex)) {
      if (current.length > 2) {
        setConfig({ ...config, activeColors: current.filter(c => c !== hex) });
      } else {
        alert('Selecione pelo menos 2 cores.');
      }
    } else {
      setConfig({ ...config, activeColors: [...current, hex] });
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-purple-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <header className="bg-white border-b px-6 py-4 sticky top-0 z-30 flex justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/games')} className="p-2 hover:bg-slate-100 rounded-full"><ArrowLeft size={20} /></button>
          <h1 className="text-xl font-bold text-slate-800">Editor de Balão</h1>
        </div>
        <div className="flex gap-3">
           {status === 'draft' ? (
             <button onClick={activateEvent} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-bold flex gap-2 text-sm shadow"><Lock size={16} /> Ativar (1 Crédito)</button>
           ) : <span className="bg-green-100 text-green-700 px-4 py-2 rounded-xl font-bold text-sm border border-green-200 flex gap-2 items-center"><CheckCircle size={16}/> Ativo</span>}
           <button onClick={saveEvent} disabled={saving} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-xl font-bold flex gap-2 text-sm shadow"><Save size={16} /> Salvar</button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto mt-8 px-6 space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><ImageIcon size={20} className="text-purple-600"/> Personalização Visual</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div onClick={() => logoInputRef.current?.click()} className="aspect-video rounded-xl border-2 border-dashed border-slate-300 hover:border-purple-500 cursor-pointer flex flex-col items-center justify-center overflow-hidden transition-all group">
               {config.logoUrl ? <img src={config.logoUrl} className="h-full object-contain" /> : <><Upload className="text-slate-400 group-hover:text-purple-500" /><span className="text-xs font-bold text-slate-500">Logo Evento</span></>}
               <input type="file" className="hidden" ref={logoInputRef} onChange={e => handleUpload('logoUrl', e)} accept="image/*" />
            </div>
            <div onClick={() => bgInputRef.current?.click()} className="aspect-video rounded-xl border-2 border-dashed border-slate-300 hover:border-purple-500 cursor-pointer flex flex-col items-center justify-center overflow-hidden transition-all group">
               {config.backgroundImageUrl ? <img src={config.backgroundImageUrl} className="w-full h-full object-cover" /> : <><ImageIcon className="text-slate-400 group-hover:text-purple-500" /><span className="text-xs font-bold text-slate-500">Imagem Fundo</span></>}
               <input type="file" className="hidden" ref={bgInputRef} onChange={e => handleUpload('backgroundImageUrl', e)} accept="image/*" />
            </div>
            <div onClick={() => balloonLogoInputRef.current?.click()} className="aspect-video rounded-xl border-2 border-dashed border-slate-300 hover:border-purple-500 cursor-pointer flex flex-col items-center justify-center overflow-hidden transition-all group">
               {config.balloonLogoUrl ? <div className="relative w-16 h-20 bg-red-500 rounded-[50%] flex items-center justify-center shadow-lg"><img src={config.balloonLogoUrl} className="w-8 h-8 object-contain opacity-80" /></div> : <><div className="w-8 h-10 bg-slate-200 rounded-full mb-2"></div><span className="text-xs font-bold text-slate-500">Logo Balão</span></>}
               <input type="file" className="hidden" ref={balloonLogoInputRef} onChange={e => handleUpload('balloonLogoUrl', e)} accept="image/*" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><Settings size={20} className="text-purple-600"/> Regras do Jogo</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50 p-4 rounded-xl border">
               <label className="flex justify-between text-sm font-bold text-slate-700 mb-4"><span className="flex items-center gap-2"><GripHorizontal size={16}/> Qtd. Balões</span><span className="text-purple-600">{config.balloonCount}</span></label>
               <input type="range" min="3" max="15" step="1" value={config.balloonCount} onChange={e => setConfig({...config, balloonCount: parseInt(e.target.value)})} className="w-full accent-purple-600 cursor-pointer" />
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border">
               <label className="flex justify-between text-sm font-bold text-slate-700 mb-4"><span className="flex items-center gap-2"><Gauge size={16}/> Velocidade</span><span className="text-purple-600">{config.speed}x</span></label>
               <input type="range" min="1" max="5" step="0.5" value={config.speed} onChange={e => setConfig({...config, speed: parseFloat(e.target.value)})} className="w-full accent-purple-600 cursor-pointer" />
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border">
               <label className="flex justify-between text-sm font-bold text-slate-700 mb-4"><span className="flex items-center gap-2"><Clock size={16}/> Tempo</span><span className="text-purple-600">{config.duration}s</span></label>
               <input type="range" min="15" max="120" step="5" value={config.duration} onChange={e => setConfig({...config, duration: parseInt(e.target.value)})} className="w-full accent-purple-600 cursor-pointer" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Palette size={20} className="text-purple-600"/> Cores dos Balões</h3>
          <div className="flex flex-wrap gap-4">
            {ALL_BALLOON_COLORS.map(color => {
              const isActive = config.activeColors.includes(color.hex);
              return (
                <button key={color.id} onClick={() => toggleColor(color.hex)} className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all w-28 ${isActive ? 'border-purple-500 bg-purple-50 shadow-md' : 'border-slate-100 bg-white opacity-60 grayscale'}`}>
                  <div className="w-10 h-12 rounded-[50%] shadow-sm relative" style={{ backgroundColor: color.hex }}>
                      <div className="absolute top-2 left-2 w-2 h-3 bg-white/30 rounded-full rotate-[-15deg]"></div>
                      {config.balloonLogoUrl && <img src={config.balloonLogoUrl} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 object-contain opacity-70" />}
                  </div>
                  <span className={`text-xs font-bold ${isActive ? 'text-purple-700' : 'text-slate-400'}`}>{color.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
            <div><h3 className="font-bold text-slate-800">Formulário de Leads</h3><p className="text-xs text-slate-500">Pedir dados antes de jogar?</p></div>
            <button onClick={() => setConfig({...config, skipLeadGate: !config.skipLeadGate})} className={`px-4 py-2 rounded-lg font-bold text-sm ${!config.skipLeadGate ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{!config.skipLeadGate ? 'ATIVADO' : 'DESATIVADO'}</button>
        </div>

        {/* 5. PREVIEW AO VIVO (Largo conforme solicitado) */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-8">
                <h3 className="font-bold text-slate-800 flex items-center gap-2 text-xl"><Eye size={24} className="text-purple-600"/> Preview do Jogo</h3>
                <span className="text-xs bg-purple-100 text-purple-700 px-4 py-1.5 rounded-full font-bold border border-purple-200 uppercase tracking-tight">Visualização em Tempo Real</span>
            </div>
            <div className="w-full min-h-[750px] rounded-[2.5rem] p-6 bg-slate-100 border-4 border-slate-200 relative shadow-inner flex flex-col items-center justify-center">
                {/* LARGURA 4XL PARA FICAR BEM LARGO IGUAL À MEMÓRIA */}
                <div className="w-full max-w-4xl h-[700px] overflow-hidden rounded-[2rem] border-8 border-slate-800 shadow-2xl bg-black relative">
                    <BalloonRunner key={previewKey} config={config} mode="preview" />
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}