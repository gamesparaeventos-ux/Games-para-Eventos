import { useState } from "react";
import { GameBuilderLayout } from "../game-builder/GameBuilderLayout";
import pptxgen from "pptxgenjs";
import { Check, X } from "lucide-react"; // Ícones de Certo/Errado

export function TrueFalseEditor() {
  // 1. FONTE ÚNICA DA VERDADE
  const [gameData, setGameData] = useState({
    title: "Verdadeiro ou Falso",
    primaryColor: "#2563eb", // Azul padrão
    question: "O céu é verde?",
    isTrue: false // A resposta certa é Falso
  });

  const [isSaving, setIsSaving] = useState(false);

  // 2. DOWNLOAD PPTX
  const handleDownloadOffice = () => {
    const pres = new pptxgen();
    
    // Slide 1: Capa
    const slide1 = pres.addSlide();
    slide1.background = { color: gameData.primaryColor };
    slide1.addText(gameData.title, { 
      x: 0, y: "40%", w: "100%", align: "center", 
      fontSize: 44, color: "FFFFFF", bold: true 
    });

    // Slide 2: A Pergunta
    const slide2 = pres.addSlide();
    slide2.background = { color: "FFFFFF" };
    // Barra superior
    slide2.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 1.5, fill: { color: gameData.primaryColor } });
    slide2.addText(gameData.question, { x: 0.5, y: 0.5, w: "90%", fontSize: 32, color: "FFFFFF" });

    // Botões V ou F
    slide2.addShape(pres.ShapeType.rect, { x: 1, y: 3, w: 3, h: 2, fill: { color: "22c55e" } }); // Verde
    slide2.addText("VERDADEIRO", { x: 1, y: 3, w: 3, h: 2, color: "FFFFFF", bold: true });
    
    slide2.addShape(pres.ShapeType.rect, { x: 6, y: 3, w: 3, h: 2, fill: { color: "ef4444" } }); // Vermelho
    slide2.addText("FALSO", { x: 6, y: 3, w: 3, h: 2, color: "FFFFFF", bold: true });

    pres.writeFile({ fileName: `${gameData.title}.pptx` });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1000);
    alert("Salvo!");
  };

  return (
    <GameBuilderLayout
      title="Verdadeiro ou Falso"
      onSave={handleSave}
      onDownload={handleDownloadOffice}
      isSaving={isSaving}
      
      // PREVIEW (Direita)
      preview={
        <div className="w-full h-full flex flex-col font-sans transition-colors duration-300" style={{ backgroundColor: gameData.primaryColor }}>
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <h1 className="text-3xl font-bold text-white mb-8 drop-shadow-md text-center">{gameData.title}</h1>
            
            <div className="bg-white rounded-2xl p-8 shadow-2xl w-full max-w-md text-center mb-8">
              <span className="text-slate-400 text-xs font-bold tracking-widest uppercase">Afirmação</span>
              <p className="text-2xl font-bold text-slate-800 mt-2">{gameData.question}</p>
            </div>

            <div className="flex gap-6 w-full max-w-md">
              {/* Botão Verdadeiro */}
              <div className={`flex-1 p-4 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all border-b-4 ${gameData.isTrue ? 'bg-green-500 border-green-700 shadow-lg scale-105' : 'bg-green-500/50 border-green-700/50 opacity-60'}`}>
                <Check className="text-white w-8 h-8 mb-1" />
                <span className="text-white font-bold">VERDADEIRO</span>
              </div>

              {/* Botão Falso */}
              <div className={`flex-1 p-4 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all border-b-4 ${!gameData.isTrue ? 'bg-red-500 border-red-700 shadow-lg scale-105' : 'bg-red-500/50 border-red-700/50 opacity-60'}`}>
                <X className="text-white w-8 h-8 mb-1" />
                <span className="text-white font-bold">FALSO</span>
              </div>
            </div>
          </div>
        </div>
      }
    >
      {/* FORMULÁRIO (Esquerda) */}
      <div className="space-y-6">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
          <h3 className="font-bold text-slate-700">Configuração</h3>
          
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Título</label>
            <input 
              type="text" 
              value={gameData.title}
              onChange={(e) => setGameData({...gameData, title: e.target.value})}
              className="w-full p-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Cor de Fundo</label>
            <input 
              type="color" 
              value={gameData.primaryColor}
              onChange={(e) => setGameData({...gameData, primaryColor: e.target.value})}
              className="w-full h-10 cursor-pointer"
            />
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
          <h3 className="font-bold text-slate-700">Pergunta</h3>
          
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Afirmação</label>
            <textarea 
              value={gameData.question}
              onChange={(e) => setGameData({...gameData, question: e.target.value})}
              className="w-full p-2 border border-slate-300 rounded-lg"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Qual a resposta correta?</label>
            <div className="flex gap-2">
              <button 
                onClick={() => setGameData({...gameData, isTrue: true})}
                className={`flex-1 py-2 rounded-lg font-bold border transition-all ${gameData.isTrue ? 'bg-green-100 border-green-500 text-green-700' : 'bg-white border-slate-200 text-slate-400'}`}
              >
                É Verdadeiro
              </button>
              <button 
                onClick={() => setGameData({...gameData, isTrue: false})}
                className={`flex-1 py-2 rounded-lg font-bold border transition-all ${!gameData.isTrue ? 'bg-red-100 border-red-500 text-red-700' : 'bg-white border-slate-200 text-slate-400'}`}
              >
                É Falso
              </button>
            </div>
          </div>
        </div>
      </div>
    </GameBuilderLayout>
  );
}