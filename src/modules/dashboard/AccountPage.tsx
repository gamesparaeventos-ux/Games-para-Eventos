import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { User, Mail, Lock, Camera, Loader2, Save, CreditCard, Shield } from 'lucide-react';

export function AccountPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [profile, setProfile] = useState({
    id: '',
    email: '',
    name: '',
    avatarUrl: '',
    credits: 0,
    plan: 'Starter'
  });

  const [passwords, setPasswords] = useState({ new: '', confirm: '' });

  useEffect(() => {
    getProfile();
  }, []);

  const getProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setProfile({
        id: user.id,
        email: user.email || '',
        name: profileData?.company_name || user.user_metadata?.full_name || '',
        avatarUrl: profileData?.logo_url || '',
        credits: profileData?.credits || 0,
        plan: 'Pro'
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setSaving(true);
    try {
      await supabase.auth.updateUser({
        data: { full_name: profile.name }
      });

      await supabase.from('profiles').update({
        company_name: profile.name,
        updated_at: new Date().toISOString()
      }).eq('id', profile.id);

      if (passwords.new) {
        if (passwords.new !== passwords.confirm) throw new Error('As senhas não coincidem');
        if (passwords.new.length < 6) throw new Error('A senha deve ter no mínimo 6 caracteres');
        
        await supabase.auth.updateUser({ password: passwords.new });
        setPasswords({ new: '', confirm: '' });
      }

      alert('Perfil atualizado com sucesso!');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao atualizar');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      await supabase.storage.from('uploads').upload(filePath, file);
      const { data } = supabase.storage.from('uploads').getPublicUrl(filePath);

      setProfile(prev => ({ ...prev, avatarUrl: data.publicUrl }));
      await supabase.from('profiles').update({ logo_url: data.publicUrl }).eq('id', profile.id);
      
    } catch {
      alert('Erro ao enviar foto.');
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-purple-600" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in font-sans pb-20">
      
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Minha Conta</h1>
        <p className="text-slate-500">Gerencie seus dados pessoais e segurança.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        <div className="space-y-6">
          
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center">
            <div className="relative w-32 h-32 mx-auto mb-4 group cursor-pointer">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-full rounded-full overflow-hidden border-4 border-slate-50 shadow-inner"
              >
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} className="w-full h-full object-cover" alt="Avatar" />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                    <User size={48} />
                  </div>
                )}
              </div>
              <div onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-purple-600 text-white p-2 rounded-full shadow-lg hover:bg-purple-700 transition-colors">
                <Camera size={16} />
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
            </div>
            
            <h2 className="text-lg font-bold text-slate-800">{profile.name}</h2>
            <p className="text-sm text-slate-400">{profile.email}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-6 rounded-2xl text-white shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-white/20 rounded-lg">
                <CreditCard size={20} />
              </div>
              <span className="bg-white/20 text-xs font-bold px-2 py-1 rounded uppercase">Ativo</span>
            </div>
            <p className="text-purple-100 text-sm mb-1">Plano Atual</p>
            <h3 className="text-2xl font-bold mb-4">Premium SaaS</h3>
            
            <div className="flex justify-between items-center text-sm pt-4 border-t border-white/20">
              <span>Créditos:</span>
              <span className="font-bold text-xl">{profile.credits}</span>
            </div>
          </div>

        </div>

        <div className="md:col-span-2 space-y-6">
          
          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <User className="text-purple-600" size={20} /> Dados Pessoais
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nome Completo</label>
                <input 
                  type="text" 
                  value={profile.name}
                  onChange={e => setProfile({...profile, name: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:border-purple-500 bg-slate-50 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">E-mail</label>
                <div className="flex items-center px-4 py-2 border rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed">
                  <Mail size={16} className="mr-2" />
                  {profile.email}
                </div>
                <p className="text-xs text-slate-400 mt-1">O e-mail não pode ser alterado.</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Shield className="text-purple-600" size={20} /> Segurança
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nova Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="password" 
                    placeholder="Deixe em branco para não alterar"
                    value={passwords.new}
                    onChange={e => setPasswords({...passwords, new: e.target.value})}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:border-purple-500 transition-all"
                  />
                </div>
              </div>
              {passwords.new && (
                <div className="animate-fade-in">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Confirmar Senha</label>
                  <input 
                    type="password" 
                    placeholder="Repita a nova senha"
                    value={passwords.confirm}
                    onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                    className={`w-full px-4 py-2 border rounded-lg outline-none transition-all ${passwords.confirm && passwords.new !== passwords.confirm ? 'border-red-500 focus:border-red-500' : 'focus:border-purple-500'}`}
                  />
                  {passwords.confirm && passwords.new !== passwords.confirm && (
                    <p className="text-xs text-red-500 mt-1">As senhas não coincidem.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button 
              onClick={handleUpdateProfile}
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-purple-200 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              Salvar Alterações
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}