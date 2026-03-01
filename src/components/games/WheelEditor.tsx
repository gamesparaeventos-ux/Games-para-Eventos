import { useState } from "react";
import { GameBuilderLayout } from "../game-builder/GameBuilderLayout";
import pptxgen from "pptxgenjs";
import { Plus, Trash2 } from "lucide-react";

export function WheelEditor() {
  // 1. FONTE ÚNICA DA VERDADE
  const [gameData, setGameData] = useState({
    title: "Roleta da Sorte",
    primaryColor: "#e11d48", // Rosa avermelhado
    slices: [
      { text: "Ganhou 1 Crédito", color: "#fca5a5" },
      { text: "Tente de Novo", color: "#e2e8f0" },
      { text: "Prêmio Surpresa", color: "#fcd34d" },
      { text: "Perdeu a Vez", color: "#94a3b8" },
      { text: "Vale um Brinde", color: "#86efac" },
      { text: "Responda a Pergunta", color: "#93c5fd" }
    ]
  });

  const [isSaving, setIsSaving] = useState(false);

  // 2. DOWNLOAD OFFICE
  const handleDownloadOffice = () => {
    const pres = new pptxgen();
    
    // Slide 1: A Roleta
    const slide = pres.addSlide();
    slide.background = { color: "FFFFFF" };
    slide.addText(gameData.title, { x: 0, y: 0.5, w: "100%", align: "center", fontSize: 40, color: gameData.primaryColor, bold: true });

    // Desenhar a roleta no PPT é complexo, então geramos uma lista visual das opções
    // e instruímos que a animação funciona melhor na Web.
    slide.addText("Opções da Roleta:", { x: 1, y: 1.5, fontSize: 18, color: "333333" });
    
    gameData.slices.forEach((slice, index) => {
      slide.addShape(pres.ShapeType.rect, { x: 1, y: 2 + (index * 0.6), w: 0.5, h: 0.4, fill: { color: slice.color.replace('#', '') } });
      slide.addText(slice.text, { x: 1.6, y: 2 + (index * 0.6), fontSize: 16 });
    });

    pres.writeFile({ fileName: `${gameData.title}.pptx` });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1000);
    alert("Roleta Salva!");
  };

  const addSlice = () => {
    setGameData({
      ...gameData,
      slices: [...gameData.slices, { text: "Nova Opção", color: "#e2e8f0" }]
    });
  };

  const updateSlice = (index: number, text: string) => {
    const newSlices = [...gameData.slices];
    newSlices[index].text = text;
    setGameData({ ...gameData, slices: newSlices });
  };

  const updateSliceColor = (index: number, color: string) => {
    const newSlices = [...gameData.slices];
    newSlices[index].color = color;
    setGameData({ ...gameData, slices: newSlices });
  };

  const removeSlice = (index: number) => {
    const newSlices = [...gameData.slices];
    newSlices.splice(index, 1);
    setGameData({ ...gameData, slices: newSlices });
  };

  return (
    <GameBuilderLayout
      title="Roleta de Prêmios"
      onSave={handleSave}
      onDownload={handleDownloadOffice}
      isSaving={isSaving}
      
      // PREVIEW (A Roleta Desenhada com CSS)
      preview={
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 overflow-hidden">
          <h1 className="text-3xl font-bold mb-8" style={{ color: gameData.primaryColor }}>{gameData.title}</h1>
          
          {/* A Roleta em CSS Puro (Conic Gradient) */}
          <div className="relative w-64 h-64 rounded-full shadow-2xl border-4 border-white ring-8 ring-slate-200 flex items-center justify-center transform hover:rotate-12 transition-transform duration-700"
               style={{
                 background: `conic-gradient(${gameData.slices.map((s, i) => 
                   `${s.color} ${(i / gameData.slices.length) * 100}% ${((i + 1) / gameData.slices.length) * 100}%`
                 ).join(', ')})`
               }}
          >
            {/* O miolo da roleta */}
            <div className="w-16 h-16 bg-white rounded-full shadow-inner flex items-center justify-center z-10">
              <span className="text-slate-400 font-bold text-xs">GIRAR</span>
            </div>
            
            {/* A Seta Indicadora */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-slate-800 drop-shadow-lg z-20"></div>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-2 max-w-md">
            {gameData.slices.map((s, i) => (
              <span key={i} className="px-2 py-1 rounded text-xs font-bold text-slate-700 border" style={{ backgroundColor: s.color }}>
                {s.text}
              </span>
            ))}
          </div>
        </div>
      }
    >
      {/* FORMULÁRIO */}
      <div className="space-y-6">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
          <h3 className="font-bold text-slate-700">Configuração</h3>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Título</label>
            <input type="text" value={gameData.title} onChange={(e) => setGameData({...gameData, title: e.target.value})} className="w-full p-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Cor Principal</label>
            <input type="color" value={gameData.primaryColor} onChange={(e) => setGameData({...gameData, primaryColor: e.target.value})} className="w-full h-10 cursor-pointer" />
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-700">Fatias da Roleta</h3>
            <button onClick={addSlice} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-bold flex items-center gap-1 hover:bg-purple-200"><Plus size={14}/> Add</button>
          </div>
          
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {gameData.slices.map((slice, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input type="color" value={slice.color} onChange={(e) => updateSliceColor(idx, e.target.value)} className="w-8 h-8 rounded cursor-pointer border-none" />
                <input type="text" value={slice.text} onChange={(e) => updateSlice(idx, e.target.value)} className="flex-1 text-sm p-1 border rounded" />
                <button onClick={() => removeSlice(idx)} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </GameBuilderLayout>
  );
}