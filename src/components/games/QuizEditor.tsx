import { useState } from "react";
import { GameBuilderLayout } from "../game-builder/GameBuilderLayout"; 
// Removi o 'Play' que não estava sendo usado
import pptxgen from "pptxgenjs"; 

export function QuizEditor() {
  // 1. FONTE ÚNICA DA VERDADE (Single Source of Truth)
  const [gameData, setGameData] = useState({
    title: "Show do Milhão",
    primaryColor: "#7c3aed", // Roxo padrão
    question: "Qual a capital do Brasil?",
    correctAnswer: "Brasília",
    wrongAnswer1: "Rio de Janeiro",
    wrongAnswer2: "São Paulo"
  });

  const [isSaving, setIsSaving] = useState(false);

  // 2. FUNÇÃO DE DOWNLOAD (Usa o gameData direto)
  const handleDownloadOffice = () => {
    const pres = new pptxgen();
    
    // Slide 1: Capa
    let slide1 = pres.addSlide();
    slide1.background = { color: gameData.primaryColor }; 
    slide1.addText(gameData.title, { 
      x: 0, y: "40%", w: "100%", align: "center", 
      fontSize: 44, color: "FFFFFF", bold: true 
    });

    // Slide 2: Pergunta
    let slide2 = pres.addSlide();
    slide2.background = { color: "FFFFFF" };
    // Barra de título com a cor escolhida
    slide2.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 1.5, fill: { color: gameData.primaryColor } });
    slide2.addText(gameData.question, { x: 0.5, y: 0.5, w: "90%", fontSize: 32, color: "FFFFFF" });

    pres.writeFile({ fileName: `${gameData.title}.pptx` });
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simula salvamento no banco
    setTimeout(() => setIsSaving(false), 1000);
    alert("Jogo salvo no banco!");
  };

  return (
    <GameBuilderLayout
      title="Quiz"
      onSave={handleSave}
      onDownload={handleDownloadOffice}
      isSaving={isSaving}
      
      // LADO DIREITO: PREVIEW (Lê gameData)
      preview={
        <div className="w-full h-full flex flex-col font-sans">
          {/* Simulação do Slide de Capa ou Jogo Ativo */}
          <div 
            className="flex-1 flex flex-col items-center justify-center text-white transition-colors duration-300"
            style={{ backgroundColor: gameData.primaryColor }}
          >
            <h1 className="text-4xl font-bold mb-8 drop-shadow-md">{gameData.title}</h1>
            
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20 w-3/4 max-w-lg shadow-xl">
              <span className="text-xs uppercase tracking-widest opacity-70 mb-2 block">Pergunta Atual</span>
              <p className="text-xl font-medium">{gameData.question}</p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 w-3/4 max-w-lg">
               <div className="bg-white text-slate-800 p-3 rounded-lg font-bold text-center shadow-lg border-b-4 border-slate-200">{gameData.correctAnswer}</div>
               <div className="bg-white text-slate-800 p-3 rounded-lg font-bold text-center shadow-lg border-b-4 border-slate-200">{gameData.wrongAnswer1}</div>
               <div className="bg-white text-slate-800 p-3 rounded-lg font-bold text-center shadow-lg border-b-4 border-slate-200">{gameData.wrongAnswer2}</div>
            </div>
          </div>
        </div>
      }
    >
      
      {/* LADO ESQUERDO: FORMULÁRIO (Atualiza gameData) */}
      <div className="space-y-6">
        
        {/* Bloco 1: Aparência */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
          <h3 className="font-bold text-slate-700 flex items-center gap-2">
            <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
            Aparência
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Título do Jogo</label>
            <input 
              type="text" 
              value={gameData.title}
              onChange={(e) => setGameData({...gameData, title: e.target.value})}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Cor Principal</label>
            <div className="flex flex-wrap gap-3">
               {['#7c3aed', '#ef4444', '#22c55e', '#3b82f6', '#f59e0b', '#000000'].map(color => (
                 <button
                   key={color}
                   onClick={() => setGameData({...gameData, primaryColor: color})}
                   className={`w-10 h-10 rounded-full shadow-sm transition-transform hover:scale-110 ${gameData.primaryColor === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`}
                   style={{ backgroundColor: color }}
                 />
               ))}
            </div>
            <input 
              type="color"
              className="mt-3 w-full h-10 cursor-pointer"
              value={gameData.primaryColor}
              onChange={(e) => setGameData({...gameData, primaryColor: e.target.value})}
            />
          </div>
        </div>

        {/* Bloco 2: Conteúdo */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
          <h3 className="font-bold text-slate-700 flex items-center gap-2">
            <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
            Pergunta & Respostas
          </h3>
          
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Pergunta</label>
            <textarea 
              value={gameData.question}
              onChange={(e) => setGameData({...gameData, question: e.target.value})}
              className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 gap-3">
             <div>
               <label className="block text-xs font-bold text-green-600 mb-1 uppercase">Resposta Certa</label>
               <input 
                 type="text" 
                 value={gameData.correctAnswer}
                 onChange={(e) => setGameData({...gameData, correctAnswer: e.target.value})}
                 className="w-full p-2 border border-green-200 bg-green-50 rounded-lg focus:outline-none"
               />
             </div>
             <div>
               <label className="block text-xs font-bold text-red-500 mb-1 uppercase">Alternativa Errada 1</label>
               <input 
                 type="text" 
                 value={gameData.wrongAnswer1}
                 onChange={(e) => setGameData({...gameData, wrongAnswer1: e.target.value})}
                 className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none"
               />
             </div>
             <div>
               <label className="block text-xs font-bold text-red-500 mb-1 uppercase">Alternativa Errada 2</label>
               <input 
                 type="text" 
                 value={gameData.wrongAnswer2}
                 onChange={(e) => setGameData({...gameData, wrongAnswer2: e.target.value})}
                 className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none"
               />
             </div>
          </div>
        </div>

      </div>
    </GameBuilderLayout>
  );
}