import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { Save, ArrowLeft, Upload, Trash2, Plus, Lock, CheckCircle, Loader2, Image as ImageIcon, Layout, Grid3X3, Eye, X } from 'lucide-react';

import { MemoryRunner } from '../../player/MemoryRunner';

import { DIFFICULTY_CONFIG } from '../memory.types';
import type { MemoryConfig } from '../memory.types';

export function MemoryEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('draft');
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const bgInputRef = useRef<HTMLInputElement | null>(null);

  const [config, setConfig] = useState<MemoryConfig>({
    title: 'Jogo da Memória',
    description: 'Encontre os pares!',
    primaryColor: '#06b6d4',
    skipLeadGate: false,
    logoUrl: '',
    backgroundImageUrl: '',
    difficulty: 'easy',
    images: []
  });

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
    const required = DIFFICULTY_CONFIG[config.difficulty].pairs;
    if (config.images.length < required) {
      alert(`Você precisa de ${required} imagens para o nível ${DIFFICULTY_CONFIG[config.difficulty].label}.`);
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('events').update({ config }).eq('id', id);
      if (error) throw error;
      alert('Salvo com sucesso!');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      alert('Erro: ' + msg);
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

  const handleAssetUpload = async (field: 'logoUrl' | 'backgroundImageUrl', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    try {
      const path = `memory-${id}-${field}-${Date.now()}`;
      const { error: uploadError } = await supabase.storage.from('uploads').upload(path, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('uploads').getPublicUrl(path);
      setConfig(prev => ({ ...prev, [field]: data.publicUrl }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro no upload';
      alert('Erro: ' + msg);
    } finally {
      e.target.value = '';
    }
  };

  const handleRemoveAsset = (field: 'logoUrl' | 'backgroundImageUrl') => {
    setConfig(prev => ({ ...prev, [field]: '' }));

    if (field === 'logoUrl' && logoInputRef.current) {
      logoInputRef.current.value = '';
    }

    if (field === 'backgroundImageUrl' && bgInputRef.current) {
      bgInputRef.current.value = '';
    }
  };

  const handleCardsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !id) return;

    setUploading(true);
    const newImages = [...config.images];
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 2 * 1024 * 1024) continue;

        const path = `memory-card-${id}-${Date.now()}-${i}`;
        const { error: uploadError } = await supabase.storage.from('uploads').upload(path, file);
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('uploads').getPublicUrl(path);
        newImages.push(data.publicUrl);
      }
      setConfig(prev => ({ ...prev, images: newImages }));
    } catch (err) {
      console.error('Erro no upload de cartas:', err);
      alert('Ocorreu um erro ao subir algumas imagens.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeCard = (index: number) => {
    setConfig(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-cyan-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <header className="bg-white border-b px-6 py-4 sticky top-0 z-30 flex justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-slate-100 rounded-full" aria-label="Voltar"><ArrowLeft size={20} /></button>
          <h1 className="text-xl font-bold text-slate-800">Editor de Memória</h1>
        </div>
        <div className="flex gap-3">
          {status === 'draft' ? (
            <button onClick={activateEvent} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-bold flex gap-2 text-sm shadow transition-all"><Lock size={16} /> Ativar (1 Crédito)</button>
          ) : <span className="bg-green-100 text-green-700 px-4 py-2 rounded-xl font-bold text-sm border border-green-200 flex gap-2 items-center"><CheckCircle size={16}/> Ativo</span>}
          <button onClick={saveEvent} disabled={saving} className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-xl font-bold flex gap-2 text-sm shadow transition-all"><Save size={16} /> Salvar</button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto mt-8 px-6 space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><ImageIcon size={20} className="text-cyan-600"/> Personalização Visual</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              onClick={() => logoInputRef.current?.click()}
              className="relative aspect-video rounded-xl border-2 border-dashed border-slate-300 hover:border-cyan-500 flex flex-col items-center justify-center overflow-hidden transition-all group cursor-pointer bg-slate-50"
            >
              {config.logoUrl ? (
                <>
                  <img src={config.logoUrl} className="h-full object-contain" alt="Logo do Evento" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveAsset('logoUrl');
                    }}
                    className="absolute top-2 right-2 z-10 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remover logo"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <Upload className="text-slate-400 mb-2 group-hover:text-cyan-500" />
                  <span className="text-xs font-bold text-slate-500">Logo</span>
                </>
              )}
              <input type="file" className="hidden" ref={logoInputRef} onChange={e => handleAssetUpload('logoUrl', e)} accept="image/*" />
            </div>

            <div
              onClick={() => bgInputRef.current?.click()}
              className="relative aspect-video rounded-xl border-2 border-dashed border-slate-300 hover:border-cyan-500 flex flex-col items-center justify-center overflow-hidden transition-all group cursor-pointer bg-slate-50"
            >
              {config.backgroundImageUrl ? (
                <>
                  <img src={config.backgroundImageUrl} className="w-full h-full object-cover" alt="Imagem de Fundo" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveAsset('backgroundImageUrl');
                    }}
                    className="absolute top-2 right-2 z-10 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remover fundo"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <ImageIcon className="text-slate-400 mb-2 group-hover:text-cyan-500" />
                  <span className="text-xs font-bold text-slate-500">Fundo</span>
                </>
              )}
              <input type="file" className="hidden" ref={bgInputRef} onChange={e => handleAssetUpload('backgroundImageUrl', e)} accept="image/*" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><Layout size={20} className="text-cyan-600"/> Configurações</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div><label className="block text-sm font-bold text-slate-700 mb-1">Título</label><input type="text" value={config.title} onChange={e => setConfig({...config, title: e.target.value})} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-100 outline-none" /></div>
            <div className="flex items-end"><div className="w-full bg-slate-50 p-3 rounded-xl border flex justify-between items-center"><span className="font-bold text-slate-700 text-sm">Capturar Leads?</span><button onClick={() => setConfig({...config, skipLeadGate: !config.skipLeadGate})} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${!config.skipLeadGate ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>{!config.skipLeadGate ? 'SIM' : 'NÃO'}</button></div></div>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border">
            <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><Grid3X3 size={16}/> Dificuldade do Jogo</label>
            <div className="grid grid-cols-3 gap-3">
              {(['easy', 'medium', 'hard'] as const).map(level => (
                <button key={level} onClick={() => setConfig({...config, difficulty: level})} className={`py-3 rounded-lg text-xs font-bold border-2 transition-all ${config.difficulty === level ? 'border-cyan-500 bg-white text-cyan-600 shadow-sm' : 'border-transparent bg-slate-200 text-slate-500 hover:bg-slate-300'}`}>
                  {DIFFICULTY_CONFIG[level].label}<span className="block opacity-80 font-normal">{DIFFICULTY_CONFIG[level].description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><ImageIcon size={20} className="text-cyan-600"/> Imagens das Cartas <span className="text-xs px-2 py-1 rounded-full bg-slate-100">{config.images.length}/{DIFFICULTY_CONFIG[config.difficulty].pairs}</span></h3>
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 font-bold transition-all flex items-center gap-2 shadow-md">{uploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />} Upload Múltiplo</button>
            <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleCardsUpload} accept="image/*" />
          </div>
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {config.images.map((url, idx) => (
              <div key={idx} className="aspect-square relative group bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-sm transition-transform hover:scale-105">
                <img src={url} className="w-full h-full object-cover" alt={`Carta ${idx + 1}`} />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <button onClick={() => removeCard(idx)} className="p-2 bg-white rounded-full text-red-500 hover:scale-110 transition-transform shadow-lg" aria-label="Remover carta">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            <button onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 hover:border-cyan-500 hover:text-cyan-600 hover:bg-cyan-50 transition-all">
              <Plus size={24} />
              <span className="text-xs font-bold mt-1">Adicionar</span>
            </button>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-xl">
              <Eye size={24} className="text-cyan-600"/> Preview do Jogo
            </h3>
            <span className="text-xs bg-slate-100 text-slate-500 px-4 py-1.5 rounded-full font-bold border border-slate-200 uppercase tracking-tight">
              Visualização em Tempo Real
            </span>
          </div>

          <div className="w-full min-h-[850px] rounded-[2.5rem] p-6 bg-slate-100/50 border-4 border-slate-200/50 relative shadow-inner flex flex-col items-center">
            <div className="w-full max-w-4xl h-full flex-1">
              <MemoryRunner config={config} mode="preview" />
            </div>
          </div>

          <p className="text-center text-sm text-slate-400 mt-6 max-w-lg mx-auto">
            Área de preview dinâmica. O tabuleiro se ajusta conforme as imagens são adicionadas.
          </p>
        </div>
      </div>
    </div>
  );
}