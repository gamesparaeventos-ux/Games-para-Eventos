// ADICIONADO 'type' AQUI NA PRIMEIRA LINHA
import type { ReactNode } from "react"; 
import { Eye, Save, Download, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom"; 

interface GameBuilderLayoutProps {
  title: string;
  onSave: () => void;
  onDownload: () => void;
  isSaving?: boolean;
  children: ReactNode; 
  preview: ReactNode;  
}

export function GameBuilderLayout({ 
  title, 
  onSave, 
  onDownload,
  isSaving, 
  children, 
  preview 
}: GameBuilderLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Barra de Topo */}
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-slate-600">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Eye className="text-purple-600" />
            Editando: {title}
          </h1>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={onDownload}
            className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg flex items-center gap-2 border border-slate-200"
          >
            <Download size={18} />
            Baixar (Office)
          </button>
          <button 
            onClick={onSave}
            disabled={isSaving}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-md transition-all flex items-center gap-2"
          >
            <Save size={18} />
            {isSaving ? "Salvando..." : "Salvar Jogo"}
          </button>
        </div>
      </header>

      {/* Área de Trabalho Dividida */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* LADO ESQUERDO: Configuração (Formulário) */}
        <div className="w-1/2 p-6 overflow-y-auto border-r border-slate-200 bg-white custom-scrollbar">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-6 border-b pb-2">
              Painel de Configuração
            </h2>
            {children}
          </div>
        </div>

        {/* LADO DIREITO: Preview (O que você vê é o que você baixa) */}
        <div className="w-1/2 bg-slate-100 p-8 flex flex-col items-center justify-center relative">
          <div className="absolute top-4 right-4 bg-purple-900/90 text-white text-[10px] px-3 py-1 rounded-full uppercase font-bold tracking-wide backdrop-blur-md shadow-lg">
            Preview em Tempo Real
          </div>
          
          {/* A Moldura do Jogo */}
          <div className="w-full aspect-video bg-white rounded-xl shadow-2xl overflow-hidden border-4 border-slate-800 ring-4 ring-slate-200/50 transform transition-all duration-300">
            {preview}
          </div>
          
          <p className="mt-6 text-slate-400 text-xs text-center flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            O arquivo baixado será idêntico a esta tela.
          </p>
        </div>

      </div>
    </div>
  );
}