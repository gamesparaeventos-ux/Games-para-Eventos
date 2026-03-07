import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Trophy, CheckCircle, XCircle } from "lucide-react";

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
}

interface QuizGameProps {
  questions?: Question[];
  logoUrl?: string;
  backgroundUrl?: string;
  primaryColor?: string;
  onFinish?: (score: number, total: number) => void;
  onExit?: () => void;
}

const defaultQuestions: Question[] = [
  { question: "Qual é a capital do Brasil?", options: ["São Paulo", "Rio", "Brasília", "Salvador"], correctIndex: 2 }
];

const LABELS = ["A", "B", "C", "D"];

const QuizGame = ({ questions = defaultQuestions, logoUrl, backgroundUrl, onFinish, onExit }: QuizGameProps) => {
  const processedQuestions = useMemo(() => {
    return questions.map((q) => {
      const correctAnswer = q.options[q.correctIndex] || q.options[0];
      const uniqueOptions = q.options.filter((opt, idx, arr) => opt && arr.indexOf(opt) === idx).slice(0, 4);
      while (uniqueOptions.length < 4) uniqueOptions.push(`Opção ${uniqueOptions.length + 1}`);
      
      const shuffled = [...uniqueOptions];
      for (let i = shuffled.length - 1; i > 0; i--) {
        // eslint-disable-next-line react-hooks/purity
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      return {
        question: q.question,
        options: shuffled.map((text, idx) => ({
          label: LABELS[idx],
          text,
          isCorrect: text === correctAnswer,
        }))
      };
    });
  }, [questions]);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [gamePhase, setGamePhase] = useState<"playing" | "finished">("playing");
  const [timeLeft, setTimeLeft] = useState(15);

  const handleSelectAnswer = useCallback((index: number) => {
    if (selectedIdx !== null) return;
    setSelectedIdx(index);
    
    let isCorrect = false;
    if (index >= 0) {
       isCorrect = processedQuestions[currentIdx].options[index].isCorrect;
       if (isCorrect) setScore(s => s + 1);
    }

    setTimeout(() => {
      if (currentIdx + 1 >= processedQuestions.length) {
        setGamePhase("finished");
        onFinish?.(score + (isCorrect ? 1 : 0), processedQuestions.length);
      } else {
        setCurrentIdx(p => p + 1);
        setSelectedIdx(null);
        setTimeLeft(15);
      }
    }, 1500);
  }, [selectedIdx, currentIdx, processedQuestions, score, onFinish]);

  useEffect(() => {
    if (gamePhase !== "playing" || selectedIdx !== null) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { handleSelectAnswer(-1); return 15; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gamePhase, selectedIdx, handleSelectAnswer]);

  const currentQ = processedQuestions[currentIdx];

  if (gamePhase === "finished") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-purple-600" style={backgroundUrl ? { backgroundImage: `url(${backgroundUrl})`, backgroundSize: 'cover' } : {}}>
        <div className="bg-white p-10 rounded-3xl text-center shadow-2xl max-w-md w-full animate-bounce-in">
          <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 text-yellow-600"><Trophy size={48}/></div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Fim de Jogo!</h1>
          <p className="text-2xl font-bold text-purple-600 mb-6">{score}/{processedQuestions.length} Acertos</p>
          <div className="flex gap-2">
             <button onClick={() => { setCurrentIdx(0); setScore(0); setGamePhase("playing"); }} className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-bold">Jogar Novamente</button>
             {onExit && <button onClick={onExit} className="px-4 py-3 bg-slate-200 text-slate-700 rounded-xl font-bold">Sair</button>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-6 bg-purple-600 font-sans" style={backgroundUrl ? { backgroundImage: `url(${backgroundUrl})`, backgroundSize: 'cover' } : {}}>
      <div className="flex justify-between items-center mb-6 text-white">
        {logoUrl && <img src={logoUrl} className="h-10 object-contain" alt="Logo" />}
        <div className="bg-white/20 px-4 py-2 rounded-xl font-bold text-sm">Pergunta {currentIdx + 1}/{processedQuestions.length}</div>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg ${timeLeft <= 5 ? 'bg-red-500 animate-pulse' : 'bg-white/20'}`}>{timeLeft}</div>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full">
        <div className="bg-white rounded-2xl p-8 mb-6 shadow-xl text-center">
          <h2 className="text-2xl font-bold text-slate-900">{currentQ.question}</h2>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {currentQ.options.map((opt, idx) => {
            let statusClass = "bg-white text-slate-800 border-2 border-transparent";
            if (selectedIdx !== null) {
              if (opt.isCorrect) statusClass = "bg-green-500 text-white border-green-600";
              else if (selectedIdx === idx) statusClass = "bg-red-500 text-white border-red-600";
              else statusClass = "bg-white/50 text-slate-400";
            }
            return (
              <button key={idx} onClick={() => handleSelectAnswer(idx)} disabled={selectedIdx !== null} className={`p-4 rounded-xl font-bold text-lg text-left flex items-center gap-4 transition-all shadow-lg ${statusClass}`}>
                <span className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center text-sm">{opt.label}</span>
                <span className="flex-1">{opt.text}</span>
                {selectedIdx !== null && opt.isCorrect && <CheckCircle />}
                {selectedIdx === idx && !opt.isCorrect && <XCircle />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default QuizGame;