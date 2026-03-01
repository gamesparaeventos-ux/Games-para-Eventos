import React, { useState } from 'react';
import { HelpCircle, Mail, MessageCircle, Send } from 'lucide-react';

export function SupportPage() {
  const [message, setMessage] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Mensagem enviada! Entraremos em contato em breve.');
    setMessage('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in font-sans">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Suporte & Ajuda</h1>
        <p className="text-slate-500">Estamos aqui para ajudar você a criar os melhores eventos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Formulário de Contato */}
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Mail className="text-purple-600" size={20} /> Enviar Mensagem
          </h2>
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Assunto</label>
              <select className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:border-purple-500 bg-slate-50">
                <option>Dúvida sobre Créditos</option>
                <option>Problema Técnico</option>
                <option>Sugestão</option>
                <option>Outro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mensagem</label>
              <textarea 
                rows={5}
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:border-purple-500 bg-slate-50 resize-none"
                placeholder="Descreva como podemos ajudar..."
                required
              />
            </div>
            <button className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
              <Send size={18} /> Enviar Solicitação
            </button>
          </form>
        </div>

        {/* Links Rápidos e FAQ */}
        <div className="space-y-6">
          <div className="bg-purple-600 p-8 rounded-2xl text-white shadow-lg shadow-purple-200">
            <MessageCircle size={32} className="mb-4 opacity-80" />
            <h3 className="text-xl font-bold mb-2">WhatsApp Suporte</h3>
            <p className="text-purple-100 mb-6">Precisa de ajuda urgente? Fale diretamente com nosso time.</p>
            <button className="bg-white text-purple-700 px-6 py-2 rounded-lg font-bold hover:bg-purple-50 transition-colors w-full">
              Iniciar Conversa
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <HelpCircle size={20} className="text-slate-400" /> Perguntas Frequentes
            </h3>
            <div className="space-y-3">
              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-slate-700 flex justify-between items-center bg-slate-50 p-3 rounded-lg hover:bg-slate-100">
                  Como funcionam os créditos? <span className="text-slate-400 transition-transform group-open:rotate-180">▼</span>
                </summary>
                <p className="text-xs text-slate-500 p-3">Cada crédito ativa um jogo por 72 horas. Durante esse tempo, o uso é ilimitado.</p>
              </details>
              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-slate-700 flex justify-between items-center bg-slate-50 p-3 rounded-lg hover:bg-slate-100">
                  Posso personalizar a logo? <span className="text-slate-400 transition-transform group-open:rotate-180">▼</span>
                </summary>
                <p className="text-xs text-slate-500 p-3">Sim! Todos os jogos permitem upload de logo e mudança de cores.</p>
              </details>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}