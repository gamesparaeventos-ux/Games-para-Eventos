import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { Save, ArrowLeft, Upload, Trash2, Plus, Lock, CheckCircle, Loader2, Image as ImageIcon, HelpCircle, X } from 'lucide-react';

import { QuizRunner } from '../../player/QuizRunner';
import type { QuizConfig, QuizQuestion } from '../quiz.types';

export function QuizEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('draft');
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const bgInputRef = useRef<HTMLInputElement | null>(null);

  const [config, setConfig] = useState<QuizConfig>({
    title: 'Quiz Interativo',
    description: 'Teste seus conhecimentos!',
    primaryColor: '#8b5cf6',
    skipLeadGate: false,
    logoUrl: '',
    backgroundImageUrl: '',
    questions: [{ question: '', options: ['', '', '', ''], correctIndex: 0 }]
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
      if (data) {
        if (data.config) setConfig(prev => ({ ...prev, ...data.config }));
        setStatus(data.status);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const saveEvent = async () => {
    const validQuestions = config.questions.filter((q) => q.question.trim() !== '');
    if (validQuestions.length === 0) return alert('Adicione pelo menos uma pergunta válida.');

    setSaving(true);
    try {
      const { error } = await supabase
        .from('events')
        .update({ config: { ...config, questions: validQuestions } })
        .eq('id', id);

      if (error) throw error;
      alert('Salvo com sucesso!');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      alert('Erro ao salvar: ' + msg);
    } finally {
      setSaving(false);
    }
  };

  const activateEvent = async () => {
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
      const path = `quiz-${id}-${field}-${Date.now()}`;
      const { error } = await supabase.storage.from('uploads').upload(path, file);
      if (error) throw error;

      const { data } = supabase.storage.from('uploads').getPublicUrl(path);
      setConfig(prev => ({ ...prev, [field]: data.publicUrl }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro no upload';
      alert('Erro no upload: ' + msg);
    } finally {
      e.target.value = '';
    }
  };

  const removeAsset = (field: 'logoUrl' | 'backgroundImageUrl') => {
    setConfig(prev => ({ ...prev, [field]: '' }));

    if (field === 'logoUrl' && logoInputRef.current) {
      logoInputRef.current.value = '';
    }

    if (field === 'backgroundImageUrl' && bgInputRef.current) {
      bgInputRef.current.value = '';
    }
  };

  const addQuestion = () => setConfig(prev => ({
    ...prev,
    questions: [...prev.questions, { question: '', options: ['', '', '', ''], correctIndex: 0 }]
  }));

  const removeQuestion = (index: number) => {
    if (config.questions.length > 1) {
      setConfig(prev => ({
        ...prev,
        questions: prev.questions.filter((_, i) => i !== index)
      }));
    }
  };

  const updateQuestionText = (index: number, text: string) => {
    const n = [...config.questions];
    n[index].question = text;
    setConfig(prev => ({ ...prev, questions: n }));
  };

  const updateOption = (qI: number, oI: number, t: string) => {
    const n = [...config.questions];
    n[qI].options[oI] = t;
    setConfig(prev => ({ ...prev, questions: n }));
  };

  const setCorrectAnswer = (qI: number, oI: number) => {
    const n = [...config.questions];
    n[qI].correctIndex = oI;
    setConfig(prev => ({ ...prev, questions: n }));
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-purple-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <header className="bg-white border-b px-6 py-4 sticky top-0 z-30 flex justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-slate-100 rounded-full">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-slate-800">Editor de Quiz</h1>
        </div>
        <div className="flex gap-3">
          {status === 'draft' ? (
            <button onClick={activateEvent} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-bold flex gap-2 text-sm shadow transition-all">
              <Lock size={16} /> Ativar (1 Crédito)
            </button>
          ) : (
            <span className="bg-green-100 text-green-700 px-4 py-2 rounded-xl font-bold text-sm border border-green-200 flex gap-2 items-center">
              <CheckCircle size={16} /> Ativo
            </span>
          )}
          <button onClick={saveEvent} disabled={saving} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-xl font-bold flex gap-2 text-sm shadow transition-all">
            <Save size={16} /> {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto mt-8 px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <ImageIcon size={20} className="text-purple-600" />
              Aparência
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div
                onClick={() => logoInputRef.current?.click()}
                className="aspect-video rounded-xl border-2 border-dashed border-slate-300 hover:border-purple-500 hover:bg-purple-50 cursor-pointer flex flex-col items-center justify-center relative overflow-hidden transition-all group"
              >
                {config.logoUrl ? (
                  <>
                    <img src={config.logoUrl} className="h-full object-contain" alt="Logo" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeAsset('logoUrl');
                      }}
                      className="absolute top-2 right-2 z-10 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remover logo"
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    <Upload className="text-slate-400 mb-2 group-hover:text-purple-500" />
                    <span className="text-xs font-bold text-slate-500">Logo</span>
                  </>
                )}
                <input type="file" className="hidden" ref={logoInputRef} onChange={e => handleUpload('logoUrl', e)} accept="image/*" />
              </div>

              <div
                onClick={() => bgInputRef.current?.click()}
                className="aspect-video rounded-xl border-2 border-dashed border-slate-300 hover:border-purple-500 hover:bg-purple-50 cursor-pointer flex flex-col items-center justify-center relative overflow-hidden transition-all group"
              >
                {config.backgroundImageUrl ? (
                  <>
                    <img src={config.backgroundImageUrl} className="w-full h-full object-cover" alt="Fundo" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeAsset('backgroundImageUrl');
                      }}
                      className="absolute top-2 right-2 z-10 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remover fundo"
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    <ImageIcon className="text-slate-400 mb-2 group-hover:text-purple-500" />
                    <span className="text-xs font-bold text-slate-500">Fundo</span>
                  </>
                )}
                <input type="file" className="hidden" ref={bgInputRef} onChange={e => handleUpload('backgroundImageUrl', e)} accept="image/*" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
              <HelpCircle size={20} className="text-purple-600" />
              Perguntas ({config.questions.length})
            </h3>

            <div className="space-y-6">
              {config.questions.map((q: QuizQuestion, qIndex: number) => (
                <div key={qIndex} className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold text-slate-400 bg-white px-2 py-1 rounded border">
                      Questão #{qIndex + 1}
                    </span>
                    {config.questions.length > 1 && (
                      <button onClick={() => removeQuestion(qIndex)} className="text-slate-400 hover:text-red-500">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    value={q.question}
                    onChange={e => updateQuestionText(qIndex, e.target.value)}
                    placeholder="Ex: Qual é a capital do Brasil?"
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 mb-4 font-bold text-slate-800 focus:ring-2 focus:ring-purple-200 outline-none"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {q.options.map((opt, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-3">
                        <button
                          onClick={() => setCorrectAnswer(qIndex, oIndex)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            q.correctIndex === oIndex ? 'border-green-500 bg-green-500' : 'border-slate-300'
                          }`}
                        >
                          {q.correctIndex === oIndex && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                        </button>

                        <input
                          type="text"
                          value={opt}
                          onChange={e => updateOption(qIndex, oIndex, e.target.value)}
                          placeholder={`Opção ${String.fromCharCode(65 + oIndex)}`}
                          className={`flex-1 px-4 py-2 border rounded-lg text-sm outline-none ${
                            q.correctIndex === oIndex
                              ? 'bg-green-50 border-green-200 font-bold text-slate-900'
                              : 'bg-white border-slate-200 text-slate-700'
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button onClick={addQuestion} className="w-full mt-6 py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 font-bold hover:border-purple-400 hover:text-purple-600 transition-all flex items-center justify-center gap-2">
              <Plus size={20} /> Nova Pergunta
            </button>
          </div>
        </div>

        <div className="hidden lg:block lg:col-span-5 sticky top-24">
          <div className="flex items-center justify-between text-slate-500 mb-4 px-2">
            <h3 className="font-bold text-sm uppercase tracking-wider">Preview ao Vivo</h3>
            <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">
              Modo Celular
            </span>
          </div>

          <div className="mx-auto w-[360px] h-[720px] rounded-[3rem] border-[8px] border-slate-900 bg-slate-900 shadow-2xl relative overflow-hidden ring-4 ring-slate-200">
            <div className="absolute top-0 w-full h-8 z-50 flex justify-center">
              <div className="w-32 h-6 bg-slate-900 rounded-b-xl"></div>
            </div>
            <div className="w-full h-full bg-slate-950 rounded-[2.5rem] overflow-hidden">
              <QuizRunner key={`preview-${config.questions.length}`} config={config} mode="preview" />
            </div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-white/20 rounded-full z-50"></div>
          </div>
        </div>
      </div>
    </div>
  );
}