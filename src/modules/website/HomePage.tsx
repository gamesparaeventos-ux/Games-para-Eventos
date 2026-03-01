import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Gamepad2, Zap, Layout, WifiOff, DollarSign, CheckCircle2, ChevronDown, ChevronUp,
  ArrowRight, Brain, Target, Gift, Menu, X, Palette, MonitorSmartphone, Rocket, Coins, Ghost, ShieldAlert
} from 'lucide-react';

// --- COMPONENTE DE FUNDO ANIMADO "GAMER" ---
const AnimatedBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none -z-20">
    {/* Luzes de fundo */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] opacity-50 animate-pulse-soft"></div>
    <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-pink-500/20 rounded-full blur-[120px] opacity-40 animate-pulse-soft" style={{animationDelay: '1s'}}></div>

    {/* Ícones Flutuantes */}
    <div className="absolute top-20 left-[10%] text-purple-300/40 animate-float-slow">
      <Gamepad2 size={64} className="animate-spin-slow" style={{animationDuration: '20s'}} />
    </div>
    <div className="absolute top-40 right-[15%] text-pink-300/40 animate-float-medium" style={{animationDelay: '0.5s'}}>
      <Rocket size={48} className="-rotate-45" />
    </div>
    <div className="absolute bottom-40 left-[20%] text-yellow-300/30 animate-float-fast" style={{animationDelay: '1s'}}>
      <Coins size={56} />
    </div>
    <div className="absolute bottom-20 right-[25%] text-cyan-300/30 animate-float-slow" style={{animationDelay: '1.5s'}}>
      <Ghost size={72} />
    </div>
    <div className="absolute top-32 left-[50%] text-red-300/20 animate-float-medium" style={{animationDelay: '2s'}}>
      <Target size={40} />
    </div>
  </div>
);

export function HomePage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setFaqOpen(faqOpen === index ? null : index);
  };

  // Função de Âncora (Scroll Suave na mesma página)
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      // Ajuste de offset por causa do menu fixo
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
  
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen font-sans text-slate-600 bg-slate-950 selection:bg-purple-500/30 selection:text-purple-200 overflow-x-hidden relative">
      
      <AnimatedBackground />

      {/* --- NAVBAR --- */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Logo (Botão Home) */}
          <button 
            onClick={() => { navigate('/'); window.scrollTo(0, 0); }} 
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 text-white p-2.5 rounded-xl group-hover:shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-shadow">
              <Gamepad2 size={24} className="group-hover:rotate-12 transition-transform" />
            </div>
            <span className="text-xl font-black text-white tracking-tight">Games Para Eventos</span>
          </button>

          {/* Menu Desktop (Âncoras) */}
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-300">
            <button onClick={() => scrollToSection('home')} className="hover:text-white transition-colors">Início</button>
            <button onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition-colors">Como Funciona</button>
            <button onClick={() => scrollToSection('catalog')} className="hover:text-white transition-colors">Catálogo</button>
            <button onClick={() => scrollToSection('pricing')} className="hover:text-white transition-colors">Preços</button>
            <button onClick={() => scrollToSection('faq')} className="hover:text-white transition-colors">FAQ</button>
          </div>

          {/* Botões CTA e Área Admin */}
          <div className="hidden md:flex items-center gap-6">
            
            {/* NOVO BOTÃO: ÁREA DO ADMIN */}
            <button onClick={() => navigate('/admin/login')} className="flex items-center gap-1.5 text-purple-400 font-bold hover:text-purple-300 transition-colors text-sm">
              <ShieldAlert size={16} /> Área do Admin
            </button>

            <button onClick={() => navigate('/login')} className="text-white font-bold hover:text-purple-300 transition-colors text-sm">
              Entrar
            </button>
            <button onClick={() => navigate('/login')} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg shadow-purple-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0 text-sm relative overflow-hidden group">
              <span className="relative z-10">Começar Agora</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
            </button>
          </div>

          {/* Mobile Toggle */}
          <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-900 border-t border-white/10 p-6 flex flex-col gap-4 shadow-xl absolute w-full animate-fade-in z-50">
            <button onClick={() => scrollToSection('home')} className="text-left font-bold py-2 text-white">Início</button>
            <button onClick={() => scrollToSection('how-it-works')} className="text-left font-bold py-2 text-white">Como Funciona</button>
            <button onClick={() => scrollToSection('catalog')} className="text-left font-bold py-2 text-white">Catálogo</button>
            <button onClick={() => scrollToSection('pricing')} className="text-left font-bold py-2 text-white">Preços</button>
            
            {/* NOVO BOTÃO: ÁREA DO ADMIN (Mobile) */}
            <button onClick={() => navigate('/admin/login')} className="flex items-center gap-2 text-left font-bold py-2 text-purple-400">
              <ShieldAlert size={18} /> Área do Admin
            </button>

            <button onClick={() => navigate('/login')} className="text-left font-bold py-2 text-white border-t border-white/10 mt-2 pt-4">Entrar</button>
            <button onClick={() => navigate('/login')} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-bold mt-2">Começar Agora</button>
          </div>
        )}
      </nav>

      {/* --- HERO SECTION --- */}
      <section id="home" className="pt-36 pb-24 px-6 relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          
          <div className="text-center md:text-left z-10 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-purple-900/50 border border-purple-500/30 px-4 py-1.5 rounded-full text-purple-200 font-bold text-xs uppercase tracking-wide mb-8 backdrop-blur-sm">
              <Zap size={14} className="fill-purple-400 text-purple-400 animate-pulse" /> Plataforma Nº1 em Jogos Interativos
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-white leading-none mb-6 tracking-tight">
              Crie Experiências <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 animate-pulse-soft">Inesquecíveis</span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-xl leading-relaxed">
              Transforme seu evento com jogos personalizados que rodam 
              <strong className="text-white ml-1">100% offline</strong>. 
              Engaje o público e capture leads de forma divertida.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4 animate-fade-in-up animation-delay-200">
              <button onClick={() => navigate('/login')} className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-2xl font-black text-lg shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 group">
                <Rocket size={24} className="group-hover:animate-rocket-launch" />
                COMEÇAR AGORA
              </button>
              <button onClick={() => scrollToSection('catalog')} className="text-slate-400 font-bold hover:text-white transition-colors">
                Ver Catálogo
              </button>
            </div>
          </div>

          {/* Ilustração 3D Animada */}
          <div className="relative h-[400px] md:h-[500px] animate-float-slow hidden md:block">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-500/30 rounded-full blur-[100px] animate-pulse-soft"></div>
            
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-slate-800 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
               <Gamepad2 size={300} strokeWidth={1} className="fill-slate-900/80" />
            </div>

            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-pink-500 animate-rocket-launch origin-bottom">
               <div className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 w-20 h-32 bg-gradient-to-t from-transparent to-orange-500 blur-md animate-pulse"></div>
               <Rocket size={200} className="fill-pink-600 drop-shadow-[0_0_30px_rgba(236,72,153,0.6)]" />
            </div>
          </div>
        </div>

        {/* Feature Pills */}
        <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto animate-fade-in-up animation-delay-300">
          {[
            { icon: Zap, label: 'Setup Instantâneo' },
            { icon: Palette, label: '100% Personalizável' },
            { icon: WifiOff, label: 'Funciona Offline' },
            { icon: DollarSign, label: 'Sem Mensalidade' },
          ].map((feature, idx) => (
            <div key={idx} className="bg-slate-900/50 border border-white/10 p-4 rounded-2xl shadow-sm flex flex-col items-center gap-3 hover:bg-slate-800/50 hover:border-purple-500/50 transition-all group cursor-default">
              <div className="w-12 h-12 bg-purple-900/50 text-purple-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                <feature.icon size={24} />
              </div>
              <span className="font-bold text-slate-200 text-sm">{feature.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* --- SEPARADOR ONDULADO --- */}
      <div className="w-full overflow-hidden leading- rotate-180">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[60px] fill-white">
              <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
          </svg>
      </div>

      {/* --- CATALOG SECTION (ATUALIZADA COM 3 JOGOS E CTA NOVO) --- */}
      <section id="catalog" className="py-24 bg-white relative">
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
              Escolha Seu <span className="text-purple-600">Desafio</span>
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto text-lg">Jogos projetados para máxima interação e captura de leads.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                icon: Brain, 
                title: 'Quiz Interativo', 
                desc: 'Teste conhecimentos com perguntas e respostas. Ideal para treinamento e engajamento.',
                tags: ['Educativo', 'Gamificado'],
                gradient: 'from-purple-500 to-indigo-600',
                shadow: 'hover:shadow-purple-500/30'
              },
              { 
                icon: Ghost, // Ícone atualizado para Memória (antes era Target/Balão)
                title: 'Jogo da Memória', 
                desc: 'Desafie a memória dos participantes com cards personalizados da sua marca.',
                tags: ['Interativo', 'Personalizável'],
                gradient: 'from-pink-500 to-orange-500',
                shadow: 'hover:shadow-pink-500/30'
              },
              { 
                icon: Gift, 
                title: 'Roleta de Prêmios', 
                desc: 'Sorteie prêmios de forma emocionante e interativa em seus eventos.',
                tags: ['Sorteio', 'Premiação'],
                gradient: 'from-green-400 to-cyan-500',
                shadow: 'hover:shadow-cyan-500/30'
              }
            ].map((game, idx) => (
              <div key={idx} className={`bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-lg ${game.shadow} hover:-translate-y-3 hover:border-transparent transition-all duration-300 flex flex-col items-center text-center group relative overflow-hidden animate-fade-in-up`} style={{animationDelay: `${idx * 150}ms`}}>
                
                <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>

                <div className={`w-20 h-20 bg-gradient-to-br ${game.gradient} rounded-3xl flex items-center justify-center text-white mb-6 shadow-md group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                  <game.icon size={40} className="drop-shadow-sm" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">{game.title}</h3>
                <p className="text-slate-500 mb-6 text-sm leading-relaxed font-medium">{game.desc}</p>
                
                <div className="flex gap-2 mb-8">
                  {game.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider rounded-full border border-slate-200">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-auto w-full">
                  <button onClick={() => navigate('/login')} className={`w-full py-4 bg-gradient-to-r ${game.gradient} text-white rounded-2xl font-bold transition-all shadow-md hover:shadow-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-2 group-hover:tracking-wide`}>
                    CRIAR AGORA <ArrowRight size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- COMO FUNCIONA (REPLICADO DO PRINT) --- */}
      <section id="how-it-works" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black text-slate-900 mb-4">Como Funciona</h2>
            <p className="text-slate-500">Em 6 passos simples você terá seu jogo pronto</p>
          </div>

          <div className="relative">
             {/* Linha Roxa Conectora (Desktop) */}
             <div className="hidden md:block absolute top-[2.5rem] left-0 w-full h-[2px] bg-purple-100 -z-10"></div>

             <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
                {[
                  { step: 1, title: 'Escolha o jogo', desc: 'Selecione o jogo ideal para seu evento' },
                  { step: 2, title: 'Personalize', desc: 'Adicione sua marca e configure' },
                  { step: 3, title: 'Pague R$ 97', desc: 'Pagamento único por evento' },
                  { step: 4, title: 'Gere ativação', desc: 'Receba seu código de ativação' },
                  { step: 5, title: 'Baixe', desc: 'Download do jogo em HTML' },
                  { step: 6, title: 'Use offline', desc: 'Pronto para rodar sem internet' }
                ].map((item) => (
                  <div key={item.step} className="flex flex-col items-center text-center group">
                    <div className="w-20 h-20 bg-white border-2 border-purple-100 rounded-2xl flex items-center justify-center text-2xl font-black text-purple-600 mb-6 shadow-sm group-hover:scale-110 group-hover:border-purple-300 transition-all z-10">
                      {item.step}
                    </div>
                    <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed max-w-[150px]">{item.desc}</p>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </section>

      {/* --- PRICING SECTION (REPLICADO DO PRINT) --- */}
      <section id="pricing" className="py-24 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6 flex justify-center">
          <div className="bg-white p-12 rounded-[2rem] shadow-xl border border-slate-100 text-center max-w-sm w-full relative group hover:-translate-y-2 transition-transform duration-500">
            {/* Efeito de Borda Topo */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-[2rem]"></div>
            
            <p className="text-slate-500 text-sm font-medium mb-4 uppercase tracking-wide">Investimento único</p>
            
            <div className="flex items-center justify-center gap-1 mb-2 text-slate-900">
              <span className="text-2xl font-bold text-slate-400 mt-2">R$</span>
              <span className="text-7xl font-black text-purple-600">97</span>
            </div>
            <p className="text-slate-400 text-sm mb-10 font-medium">por evento</p>

            <ul className="space-y-4 text-left mb-10 pl-4">
              {[
                'Jogo profissional',
                'Personalização completa',
                'Funciona offline',
                'Download ilimitado',
                'Sem mensalidade'
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 text-slate-600 font-medium">
                  <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                    <CheckCircle2 size={12} strokeWidth={3} />
                  </div>
                  {item}
                </li>
              ))}
            </ul>

            <button onClick={() => navigate('/login')} className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-purple-200 transition-all hover:scale-105 active:scale-95">
              Quero Começar Agora
            </button>
          </div>
        </div>
      </section>

      {/* --- FAQ --- */}
      <section id="faq" className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Perguntas Frequentes</h2>
            <p className="text-slate-500">Tire suas dúvidas sobre nossa plataforma</p>
          </div>

          <div className="space-y-4">
            {[
              { q: "Como funciona o download do jogo?", a: "Após personalizar e ativar o jogo, você baixa um único arquivo HTML que contém tudo. Basta abrir este arquivo no navegador (Chrome, Edge) do seu totem ou computador e usar." },
              { q: "Posso usar o jogo em mais de um evento?", a: "Cada ativação (R$ 97) vale para um evento específico. Você pode usar em quantos dispositivos quiser dentro desse mesmo evento." },
              { q: "Preciso de internet para rodar o jogo?", a: "Não! Essa é nossa principal vantagem. O jogo roda 100% offline. A internet só é necessária se você quiser capturar leads e sincronizá-los na nuvem." },
              { q: "Como personalizo o jogo?", a: "Através do nosso painel intuitivo. Você pode alterar cores, fazer upload da sua logo, imagem de fundo, editar textos, perguntas (no Quiz) e prêmios (na Roleta)." }
            ].map((item, idx) => (
              <div key={idx} className="border border-slate-200 rounded-2xl overflow-hidden hover:border-purple-200 transition-colors">
                <button 
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between p-6 bg-white hover:bg-slate-50 transition-colors text-left"
                >
                  <span className="font-bold text-slate-800">{item.q}</span>
                  {faqOpen === idx ? <ChevronUp className="text-purple-600" /> : <ChevronDown className="text-slate-400" />}
                </button>
                {faqOpen === idx && (
                  <div className="p-6 pt-0 bg-white text-slate-600 leading-relaxed border-t border-slate-100">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CTA GAMER FOOTER --- */}
      <section className="py-32 relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/circuit-board.png')] opacity-10"></div>
        <div className="absolute bottom-0 left-0 w-full h-[300px] bg-gradient-to-t from-purple-900/50 to-transparent"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10 px-6">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl flex items-center justify-center text-white mx-auto mb-8 shadow-[0_0_40px_rgba(168,85,247,0.6)] animate-float-medium">
            <Gamepad2 size={64} />
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight drop-shadow-lg">
            Pronto para o próximo nível?
          </h2>
          <p className="text-purple-200 mb-12 text-xl max-w-2xl mx-auto">
            Crie sua conta gratuita agora e comece a personalizar seus jogos em minutos.
          </p>
          <button onClick={() => navigate('/login')} className="bg-white text-slate-900 px-12 py-6 rounded-2xl font-black text-xl shadow-2xl hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all hover:-translate-y-1 hover:scale-105 flex items-center justify-center gap-3 mx-auto group relative overflow-hidden">
            <span className="relative z-10 flex items-center gap-2">CRIAR CONTA GRÁTIS <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform"/></span>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-pink-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-slate-950 text-slate-500 py-8 px-6 border-t border-white/5 text-center text-sm font-bold">
        <p>© 2024 Games Para Eventos. Feito para engajar.</p>
      </footer>

    </div>
  );
}