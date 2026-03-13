import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Mail, Lock, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

type AdminAllowedRole = 'admin' | 'support' | 'finance';

export const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const userId = data.user?.id;
      if (!userId) {
        throw new Error('Usuário não encontrado após login.');
      }

      const { data: roleRow, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleError) {
        console.error('[AdminLogin] Erro ao buscar role:', roleError);
        await supabase.auth.signOut();
        toast.error('Não foi possível validar a permissão de acesso.');
        return;
      }

      const allowedRoles: AdminAllowedRole[] = ['admin', 'support', 'finance'];
      const userRole = roleRow?.role as string | undefined;

      if (!userRole || !allowedRoles.includes(userRole as AdminAllowedRole)) {
        await supabase.auth.signOut();
        toast.error('Sua conta não tem permissão para acessar o painel administrativo.');
        return;
      }

      toast.success('Acesso Administrativo Liberado!');
      navigate('/admin', { replace: true });
    } catch (error) {
      console.error('[AdminLogin] Erro no login:', error);
      toast.error('Credenciais inválidas ou sem permissão de acesso.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 font-sans relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md relative z-10 border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-slate-900 text-purple-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <ShieldAlert size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Acesso Restrito</h1>
          <p className="text-slate-500 text-sm mt-1">Área exclusiva para Administradores</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              E-mail Administrativo
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail size={18} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-100 border-none rounded-xl py-3 pl-10 pr-4 text-slate-700 font-medium focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all outline-none"
                placeholder="seuemail@empresa.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-100 border-none rounded-xl py-3 pl-10 pr-4 text-slate-700 font-medium focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all outline-none"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group"
          >
            {loading ? (
              'Validando...'
            ) : (
              <>
                Entrar no Painel
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};