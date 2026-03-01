import React, { useState, useEffect, useRef } from 'react';
import { Save, Upload, Globe, Palette, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function CustomizePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Estado com dados reais
  const [brand, setBrand] = useState({
    companyName: '',
    primaryColor: '#8b5cf6',
    logoUrl: '',
    customDomain: '',
    removeBranding: false
  });

  useEffect(() => {
    loadBrandSettings();
  }, []);

  const loadBrandSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('company_name, logo_url, primary_color, custom_domain, remove_branding')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setBrand({
          companyName: data.company_name || '',
          logoUrl: data.logo_url || '',
          primaryColor: data.primary_color || '#8b5cf6',
          customDomain: data.custom_domain || '',
          removeBranding: data.remove_branding || false
        });
      }
    } catch (error) {
      console.error('Erro ao carregar marca:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `brand-logo-${Math.random()}.${fileExt}`;
      const filePath = `branding/${fileName}`;

      await supabase.storage.from('uploads').upload(filePath, file);
      const { data } = supabase.storage.from('uploads').getPublicUrl(filePath);

      setBrand(prev => ({ ...prev, logoUrl: data.publicUrl }));
    } catch (error) {
      alert('Erro ao fazer upload da logo.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não logado');

      const { error } = await supabase
        .from('profiles')
        .update({
          company_name: brand.companyName,
          logo_url: brand.logoUrl,
          primary_color: brand.primaryColor,
          custom_domain: brand.customDomain,
          remove_branding: brand.removeBranding,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      alert('Marca salva com sucesso! Seus novos eventos usarão este padrão.');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  };

  if (loadingData) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-purple-600" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in font-sans pb-20">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Personalização e Marca</h1>
          <p className="text-slate-500">Defina a identidade visual padrão para todos os seus jogos.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUNA ESQUERDA: Configurações */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card: Identidade Visual */}
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Palette className="text-purple-500" size={20} /> Identidade Visual
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Logo da Empresa (White Label)</label>
                <div className="flex items-center gap-6">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-32 h-32 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all overflow-hidden relative group"
                  >
                    {uploading ? <Loader2 className="animate-spin text-purple-500" /> : 
                     brand.logoUrl ? <img src={brand.logoUrl} className="w-full h-full object-contain p-2" alt="Logo" /> : 
                     <Upload className="text-slate-400 group-hover:text-purple-500" />}
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                  </div>
                  <div className="text-sm text-slate-500">
                    <p className="font-medium text-slate-700">Clique na caixa para enviar</p>
                    <p className="mb-2">Recomendado: PNG transparente</p>
                    {brand.logoUrl && (
                      <button onClick={() => setBrand(b => ({...b, logoUrl: ''}))} className="text-red-500 text-xs font-bold hover:underline">
                        Remover Logo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Nome da Empresa</label>
                  <input 
                    type="text" 
                    value={brand.companyName}
                    onChange={e => setBrand({...brand, companyName: e.target.value})}
                    placeholder="Ex: Minha Agência"
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:border-purple-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Cor Principal da Marca</label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={brand.primaryColor}
                      onChange={e => setBrand({...brand, primaryColor: e.target.value})}
                      className="h-10 w-12 rounded cursor-pointer border border-slate-200 p-0"
                    />
                    <input 
                      type="text" 
                      value={brand.primaryColor}
                      onChange={e => setBrand({...brand, primaryColor: e.target.value})}
                      className="flex-1 px-4 py-2 border rounded-lg outline-none focus:border-purple-500 uppercase font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card: White Label (Premium) */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-2xl text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Globe size={120} />
            </div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-bold text-xl flex items-center gap-2">
                    <Globe className="text-purple-400" size={20} /> Domínio & White Label
                  </h3>
                  <p className="text-slate-400 text-sm mt-1">Remova a marca GameHub e use seu próprio endereço.</p>
                </div>
                <span className="bg-purple-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider shadow-lg">Premium</span>
              </div>

              <div className="space-y-4">
                <div 
                  onClick={() => setBrand({...brand, removeBranding: !brand.removeBranding})}
                  className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${brand.removeBranding ? 'bg-purple-500/20 border-purple-500' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                >
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${brand.removeBranding ? 'bg-purple-500 border-purple-500' : 'border-slate-500'}`}>
                    {brand.removeBranding && <CheckCircle size={14} />}
                  </div>
                  <div>
                    <span className="text-sm font-bold block">Remover "Powered by GameHub"</span>
                    <span className="text-xs text-slate-400">O rodapé dos jogos ficará limpo ou com sua marca.</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Domínio Personalizado (CNAME)</label>
                  <div className="flex">
                    <span className="px-3 py-2 bg-white/10 border border-white/10 border-r-0 rounded-l-lg text-slate-400 text-sm flex items-center">https://</span>
                    <input 
                      type="text" 
                      placeholder="jogos.suaempresa.com.br" 
                      value={brand.customDomain}
                      onChange={e => setBrand({...brand, customDomain: e.target.value})}
                      className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-r-lg outline-none focus:border-purple-500 text-white placeholder:text-slate-600 transition-all"
                    />
                  </div>
                  <div className="flex items-start gap-2 mt-2 text-xs text-slate-500">
                    <AlertCircle size={12} className="mt-0.5" />
                    <p>Para ativar, aponte o CNAME do seu domínio para <code>cname.gamehub.com</code> e entre em contato com o suporte.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* COLUNA DIREITA: Preview */}
        <div className="space-y-6">
          <div className="sticky top-24">
            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider mb-4 text-center">Visualização ao Vivo</h3>
            
            <div className="bg-slate-900 rounded-[2.5rem] border-8 border-slate-800 p-2 shadow-2xl relative overflow-hidden aspect-[9/18] max-w-[280px] mx-auto ring-1 ring-slate-900/5">
              {/* Mockup da Tela do Celular */}
              <div className="bg-white w-full h-full rounded-[1.5rem] overflow-hidden flex flex-col relative font-sans">
                
                {/* Header do Jogo */}
                <div className="h-20 flex items-center justify-center shadow-sm relative z-10 bg-white px-6">
                  {brand.logoUrl ? (
                    <img src={brand.logoUrl} className="h-10 w-full object-contain" alt="Preview Logo" />
                  ) : (
                    <span className="font-black text-slate-200 text-lg uppercase tracking-widest border-2 border-dashed border-slate-200 p-2 rounded">LOGO AQUI</span>
                  )}
                </div>

                {/* Corpo do Jogo Mockup */}
                <div className="flex-1 bg-slate-50 flex flex-col items-center justify-center p-6 text-center space-y-6">
                  <div className="w-20 h-20 rounded-full bg-white shadow-md flex items-center justify-center" style={{ color: brand.primaryColor }}>
                    <Palette size={32} />
                  </div>
                  
                  <div className="space-y-2 w-full">
                    <div className="h-4 w-3/4 bg-slate-200 rounded mx-auto"></div>
                    <div className="h-3 w-1/2 bg-slate-200 rounded mx-auto"></div>
                  </div>
                  
                  <button 
                    className="w-full py-3.5 rounded-xl text-white font-bold text-sm shadow-lg mt-4 transition-all transform hover:scale-105"
                    style={{ backgroundColor: brand.primaryColor, boxShadow: `0 4px 12px ${brand.primaryColor}40` }}
                  >
                    COMEÇAR JOGO
                  </button>
                </div>

                {/* Footer Branding */}
                <div className="py-3 text-center bg-slate-100 border-t border-slate-200">
                  {!brand.removeBranding ? (
                    <p className="text-[10px] text-slate-400">Powered by <strong>GameHub</strong></p>
                  ) : (
                    <p className="text-[10px] text-slate-400 opacity-50">{brand.companyName || 'Sua Marca'}</p>
                  )}
                </div>
              </div>

              {/* Notch e Botão Home */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-slate-800 rounded-b-xl z-20"></div>
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-24 h-1 bg-slate-700 rounded-full z-20"></div>
            </div>
            
            <p className="text-center text-xs text-slate-400 mt-4 px-4">
              Esta é uma prévia de como seus jogos aparecerão para o cliente final.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}