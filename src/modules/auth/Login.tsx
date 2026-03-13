import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2, LogIn, Mail, Lock, UserPlus } from 'lucide-react';

type AuthMode = 'login' | 'register';

function getReadableError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes('invalid login credentials')) {
    return 'Email ou senha inválidos.';
  }

  if (normalized.includes('email not confirmed')) {
    return 'Seu email ainda não foi confirmado. Verifique sua caixa de entrada.';
  }

  if (normalized.includes('user already registered')) {
    return 'Este email já está cadastrado.';
  }

  if (normalized.includes('password should be at least')) {
    return 'A senha precisa ter pelo menos 6 caracteres.';
  }

  if (normalized.includes('provider is not enabled')) {
    return 'Esse login social ainda não está configurado no Supabase.';
  }

  return message;
}

export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialMode = useMemo<AuthMode>(() => {
    return searchParams.get('mode') === 'register' ? 'register' : 'login';
  }, [searchParams]);

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const resetFeedback = () => {
    setMessage(null);
    setErrorMessage(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFeedback();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(getReadableError(error.message));
        return;
      }

      navigate('/dashboard');
    } catch (error) {
      console.error('Erro ao entrar:', error);
      setErrorMessage('Não foi possível entrar agora. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFeedback();
    setLoading(true);

    try {
      const emailValue = email.trim();

      const { error } = await supabase.auth.signUp({
        email: emailValue,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: name.trim(),
            company_name: name.trim(),
          },
        },
      });

      if (error) {
        setErrorMessage(getReadableError(error.message));
        return;
      }

      setMessage('Conta criada com sucesso. Verifique seu email para confirmar o cadastro.');
      setPassword('');
    } catch (error) {
      console.error('Erro ao cadastrar:', error);
      setErrorMessage('Não foi possível criar sua conta agora. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = async (provider: 'google') => {
    resetFeedback();
    setSocialLoading(provider);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        setErrorMessage(getReadableError(error.message));
      }
    } catch (error) {
      console.error(`Erro ao autenticar com ${provider}:`, error);
      setErrorMessage('Não foi possível iniciar o login social agora.');
    } finally {
      setSocialLoading(null);
    }
  };

  const isRegister = mode === 'register';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-slate-800">
            {isRegister ? 'Crie sua Conta' : 'Acesse sua Conta'}
          </h1>
          <p className="text-slate-500 text-sm">
            {isRegister ? 'Comece a criar seus jogos e eventos' : 'Gerencie seus jogos e eventos'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              resetFeedback();
            }}
            className={`py-2.5 rounded-lg text-sm font-bold transition-colors ${
              !isRegister ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Entrar
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('register');
              resetFeedback();
            }}
            className={`py-2.5 rounded-lg text-sm font-bold transition-colors ${
              isRegister ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Criar conta
          </button>
        </div>

        <div className="space-y-3 mb-6">
          <button
            type="button"
            onClick={() => handleOAuthLogin('google')}
            disabled={socialLoading !== null || loading}
            className="w-full border border-slate-200 hover:border-slate-300 text-slate-700 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-70"
          >
            {socialLoading === 'google' ? <Loader2 className="animate-spin" size={18} /> : null}
            Continuar com Google
          </button>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-slate-400 font-bold">ou use seu email</span>
          </div>
        </div>

        <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome</label>
              <input
                type="text"
                required={isRegister}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition-colors"
                placeholder="Seu nome ou empresa"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-400" size={20} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition-colors"
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg outline-none focus:border-blue-500 transition-colors"
                placeholder="******"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {message && (
            <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || socialLoading !== null}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : isRegister ? (
              <UserPlus size={20} />
            ) : (
              <LogIn size={20} />
            )}

            {loading
              ? isRegister
                ? 'Criando conta...'
                : 'Entrando...'
              : isRegister
                ? 'Criar conta'
                : 'Entrar na Plataforma'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-slate-400">
          {isRegister ? (
            <>
              Já tem conta?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  resetFeedback();
                }}
                className="text-blue-600 font-bold hover:underline"
              >
                Entrar
              </button>
            </>
          ) : (
            <>
              Ainda não tem conta?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  resetFeedback();
                }}
                className="text-blue-600 font-bold hover:underline"
              >
                Criar conta
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}