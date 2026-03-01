import { useState } from "react";
import { GameBuilderLayout } from "../game-builder/GameBuilderLayout";
import pptxgen from "pptxgenjs";
import { Image, Plus, Trash2 } from "lucide-react";

export function MemoryEditor() {
  // 1. FONTE ÚNICA DA VERDADE
  const [gameData, setGameData] = useState({
    title: "Memória Corporativa",
    primaryColor: "#0ea5e9", // Azul Céu
    cardBackImage: "https://placehold.co/100x100/2f3542/ffffff?text=?", // Verso da carta
    pairs: [
      { id: 1, text: "Missão", image: "https://placehold.co/100x100/orange/white?text=Missão" },
      { id: 2, text: "Visão", image: "https://placehold.co/100x100/green/white?text=Visão" },
      { id: 3, text: "Valores", image: "https://placehold.co/100x100/purple/white?text=Valores" },
      { id: 4, text: "Meta", image: "https://placehold.co/100x100/red/white?text=Meta" }
    ]
  });

  const [isSaving, setIsSaving] = useState(false);

  // 2. DOWNLOAD OFFICE (Gera o Gabarito e as Cartas)
  const handleDownloadOffice = () => {
    const pres = new pptxgen();
    
    // Slide 1: Capa
    let slide1 = pres.addSlide();
    slide1.background = { color: gameData.primaryColor };
    slide1.addText(gameData.title, { x: 0, y: "45%", w: "100%", align: "center", fontSize: 44, color: "FFFFFF", bold: true });

    // Slide 2: O Tabuleiro (Gabarito)
    let slide2 = pres.addSlide();
    slide2.background = { color: "FFFFFF" };
    slide2.addText("Tabuleiro Completo (Gabarito)", { x: 0.5, y: 0.2, fontSize: 18, color: gameData.primaryColor });

    // Gera as cartas no slide (Grid 4x2 simples para exemplo)
    gameData.pairs.forEach((pair, index) => {
      const col = index % 4;
      const row = Math.floor(index / 4);
      // Carta A (Texto)
      slide2.addShape(pres.ShapeType.rect, { 
        x: 0.5 + (col * 2.2), y: 1 + (row * 2), w: 2, h: 1.5, 
        fill: { color: gameData.primaryColor } 
      });
      slide2.addText(pair.text, { x: 0.5 + (col * 2.2), y: 1 + (row * 2), w: 2, h: 1.5, align: "center", color: "FFFFFF" });
    });

    pres.writeFile({ fileName: `${gameData.title}.pptx` });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1000);
    alert("Jogo Salvo!");
  };

  const addPair = () => {
    const newId = gameData.pairs.length + 1;
    setGameData({
      ...gameData,
      pairs: [...gameData.pairs, { id: newId, text: `Item ${newId}`, image: "" }]
    });
  };

  const removePair = (index: number) => {
    const newPairs = [...gameData.pairs];
    newPairs.splice(index, 1);
    setGameData({ ...gameData, pairs: newPairs });
  };

  const updatePair = (index: number, field: string, value: string) => {
    const newPairs = [...gameData.pairs];
    // @ts-ignore
    newPairs[index][field] = value;
    setGameData({ ...gameData, pairs: newPairs });
  };

  return (
    <GameBuilderLayout
      title="Jogo da Memória"
      onSave={handleSave}
      onDownload={handleDownloadOffice}
      isSaving={isSaving}
      
      // PREVIEW (O Tabuleiro montado)
      preview={
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 p-4">
          <h1 className="text-2xl text-white font-bold mb-4">{gameData.title}</h1>
          <div className="grid grid-cols-4 gap-4 w-full max-w-2xl">
            {gameData.pairs.concat(gameData.pairs).map((card, i) => ( // Duplica para mostrar pares
              <div key={i} className="aspect-square bg-white rounded-lg shadow-lg flex items-center justify-center transform hover:scale-105 transition-all cursor-pointer border-4" style={{ borderColor: gameData.primaryColor }}>
                 {/* Simulação: Metade virada, metade fechada para ver o efeito */}
                 {i % 2 === 0 ? (
                   <span className="font-bold text-slate-700 text-xs text-center px-1">{card.text}</span>
                 ) : (
                   <div className="w-full h-full bg-slate-700 flex items-center justify-center text-white text-2xl font-bold">?</div>
                 )}
              </div>
            ))}
          </div>
          <p className="text-slate-400 text-xs mt-4">Preview: Cartas abertas e fechadas misturadas</p>
        </div>
      }
    >
      {/* FORMULÁRIO */}
      <div className="space-y-6">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
          <h3 className="font-bold text-slate-700">Geral</h3>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Título</label>
            <input type="text" value={gameData.title} onChange={(e) => setGameData({...gameData, title: e.target.value})} className="w-full p-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Cor das Cartas</label>
            <input type="color" value={gameData.primaryColor} onChange={(e) => setGameData({...gameData, primaryColor: e.target.value})} className="w-full h-10 cursor-pointer" />
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-700">Pares de Cartas ({gameData.pairs.length})</h3>
            <button onClick={addPair} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold flex items-center gap-1 hover:bg-green-200"><Plus size={14}/> Adicionar</button>
          </div>
          
          <div className="space-y-3">
            {gameData.pairs.map((pair, idx) => (
              <div key={pair.id} className="bg-white p-3 rounded-lg border border-slate-200 flex items-center gap-3">
                <span className="font-bold text-slate-300">#{idx + 1}</span>
                <div className="flex-1">
                  <input 
                    type="text" 
                    placeholder="Texto da carta" 
                    value={pair.text} 
                    onChange={(e) => updatePair(idx, 'text', e.target.value)}
                    className="w-full text-sm p-1 border-b border-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
                {/* Botão de Imagem (Simulado) */}
                <button className="p-2 text-slate-400 hover:text-purple-600 bg-slate-50 rounded"><Image size={16} /></button>
                <button onClick={() => removePair(idx)} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </GameBuilderLayout>
  );
}