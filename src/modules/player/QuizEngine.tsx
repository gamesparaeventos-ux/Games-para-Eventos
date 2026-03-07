import { useEffect, useState, useCallback, useMemo } from "react";
import { Timer, Trophy, RotateCcw } from "lucide-react";

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
}

interface QuizConfig {
  title: string;
  questions: Question[];
  primaryColor?: string;
  logoUrl?: string;
  backgroundImageUrl?: string;
}

interface Props {
  config: QuizConfig;
  mode?: "live" | "preview";
}

export function QuizEngine({ config, mode = "live" }: Props) {
  // CORREÇÃO: Removido Math.random() que é uma função impura.
  // Usamos o tamanho das perguntas como chave para resetar o preview se o config mudar.
  const stableKey = useMemo(() => {
    return mode === "preview" ? `preview-${config.questions.length}` : "live";
  }, [mode, config.questions.length]);

  return <QuizCore key={stableKey} config={config} mode={mode} />;
}

function QuizCore({ config, mode }: Props) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [gameState, setGameState] = useState<"playing" | "result">("playing");

  const primary = config.primaryColor || "#8b5cf6";

  const nextQuestion = useCallback(() => {
    if (currentQuestion + 1 < config.questions.length) {
      setCurrentQuestion((c) => c + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setTimeLeft(15);
    } else {
      setGameState("result");
    }
  }, [config.questions.length, currentQuestion]);

  // Função centralizada para lidar com a resposta
  const handleAnswer = useCallback((index: number | null) => {
    if (isAnswered) return;

    setSelectedOption(index);
    setIsAnswered(true);

    const isCorrect = index !== null && index === config.questions[currentQuestion]?.correctIndex;

    if (isCorrect) {
      setScore((s) => s + 100 + timeLeft * 10);
    }

    setTimeout(nextQuestion, 1200);
  }, [isAnswered, config.questions, currentQuestion, timeLeft, nextQuestion]);

  // Efeito do Cronômetro - CORRIGIDO para evitar cascading renders
  useEffect(() => {
    if (mode === "preview" || gameState !== "playing" || isAnswered) return;

    if (timeLeft <= 0) {
      // O SEGREDO: setTimeout 0 tira a execução do ciclo de render atual
      const timeoutId = setTimeout(() => {
        handleAnswer(null);
      }, 0);
      return () => clearTimeout(timeoutId);
    }

    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, isAnswered, gameState, mode, handleAnswer]);

  const restartGame = () => {
    setCurrentQuestion(0);
    setScore(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setTimeLeft(15);
    setGameState("playing");
  };

  if (!config.questions || config.questions.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-white p-6 text-center">
        Adicione perguntas no editor para visualizar.
      </div>
    );
  }

  const question = config.questions[currentQuestion];
  const progress = ((currentQuestion + (gameState === "result" ? 1 : 0)) / config.questions.length) * 100;

  if (gameState === "result") {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-black text-white p-6">
        <Trophy size={60} className="text-yellow-400 mb-6" />
        <h1 className="text-3xl font-bold mb-4">Fim de Jogo</h1>
        <div className="text-5xl font-black mb-8">{score}</div>
        <button
          onClick={restartGame}
          className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-bold hover:scale-105 transition"
        >
          <RotateCcw size={18} /> Reiniciar
        </button>
      </div>
    );
  }

  return (
    <div
      className="w-full h-full flex flex-col overflow-hidden"
      style={{
        backgroundColor: primary,
        backgroundImage: config.backgroundImageUrl ? `url(${config.backgroundImageUrl})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}
    >
      <div className="p-4 flex justify-between text-white font-bold drop-shadow-md">
        <div>{score} pts</div>
        {mode === "live" && (
          <div className="flex items-center gap-2">
            <Timer size={18} /> {timeLeft}s
          </div>
        )}
      </div>

      <div className="w-full h-2 bg-black/30">
        <div
          className="h-full bg-yellow-400 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-6 w-full mb-6 text-center shadow-xl">
          <h2 className="text-xl font-bold text-black">{question.question}</h2>
        </div>

        <div className="grid gap-3 w-full">
          {question.options.map((opt, idx) => {
            let btnClass = "bg-white text-black hover:bg-slate-50";
            if (isAnswered) {
              if (idx === question.correctIndex) btnClass = "bg-green-500 text-white";
              else if (idx === selectedOption) btnClass = "bg-red-500 text-white opacity-70";
              else btnClass = "bg-white opacity-40";
            }
            return (
              <button
                key={idx}
                disabled={isAnswered}
                onClick={() => handleAnswer(idx)}
                className={`w-full py-4 px-4 rounded-xl font-bold transition shadow-md active:scale-95 ${btnClass}`}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {mode === "preview" && (
          <button onClick={restartGame} className="mt-8 text-white underline text-sm opacity-70 hover:opacity-100">
            Reiniciar Preview
          </button>
        )}
      </div>
    </div>
  );
}