import { useEffect, useState } from 'react';
import { Timer, CheckCircle, XCircle, Trophy, AlertCircle, Loader2 } from 'lucide-react';
import type { QuizConfig } from '../events/quiz.types';

interface QuizRunnerProps {
  config?: QuizConfig;
  mode: 'preview' | 'live' | 'office';
  onComplete?: (score: number) => void;
}

type OfflineWindow = Window & {
  __OFFLINE_CONFIG__?: unknown;
};

function isQuizConfig(value: unknown): value is QuizConfig {
  if (!value || typeof value !== 'object') return false;

  const config = value as Partial<QuizConfig>;

  return (
    typeof config.title === 'string' &&
    typeof config.primaryColor === 'string' &&
    typeof config.skipLeadGate === 'boolean' &&
    Array.isArray(config.questions)
  );
}

function getOfflineQuizConfig(): QuizConfig | undefined {
  const offlineValue = (window as OfflineWindow).__OFFLINE_CONFIG__;
  return isQuizConfig(offlineValue) ? offlineValue : undefined;
}

export function QuizRunner({ config, mode, onComplete }: QuizRunnerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [gameStatus, setGameStatus] = useState<'playing' | 'finished'>('playing');

  const finalConfig = config ?? getOfflineQuizConfig();

  const questions = finalConfig?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progress = totalQuestions > 0 ? (currentQuestionIndex / totalQuestions) * 100 : 0;

  const nextQuestion = () => {
    if (currentQuestionIndex + 1 < totalQuestions) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setTimeLeft(15);
    } else {
      setGameStatus('finished');
      if (onComplete) onComplete(score);
    }
  };

  useEffect(() => {
    if (gameStatus === 'finished' || !currentQuestion) return;
    if (isAnswered) return;

    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearTimeout(timerId);
    } else {
      setIsAnswered(true);
      setTimeout(nextQuestion, 2000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, isAnswered, gameStatus, currentQuestion]);

  if (!finalConfig && mode === 'office') {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-indigo-950 text-white">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p className="font-bold">Carregando dados do evento local...</p>
      </div>
    );
  }

  const handleOptionClick = (optionIndex: number) => {
    if (isAnswered || !currentQuestion) return;
    setSelectedOption(optionIndex);
    setIsAnswered(true);

    if (optionIndex === currentQuestion.correctIndex) {
      setScore((prev) => prev + 100 + timeLeft * 10);
    }
    setTimeout(nextQuestion, 2000);
  };

  if (!currentQuestion || totalQuestions === 0) {
    return (
      <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center text-slate-400 bg-slate-100 rounded-3xl border-2 border-dashed border-slate-300 p-8">
        <AlertCircle size={48} className="mb-4 opacity-50" />
        <p className="font-bold text-center">Configuração do Quiz inválida ou vazia.</p>
      </div>
    );
  }

  if (gameStatus === 'finished') {
    return (
      <div
        className="w-full h-full min-h-[400px] rounded-3xl flex flex-col items-center justify-center p-8 text-center animate-fade-in relative overflow-hidden"
        style={{
          backgroundColor: finalConfig?.primaryColor || '#312e81',
          backgroundImage: finalConfig?.backgroundImageUrl
            ? `url(${finalConfig.backgroundImageUrl})`
            : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-black/40 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          {finalConfig?.logoUrl && (
            <img
              src={finalConfig.logoUrl}
              alt="Logo"
              className="h-16 object-contain mb-6 drop-shadow-lg"
            />
          )}

          <div className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center mb-6 shadow-lg animate-bounce">
            <Trophy size={48} className="text-yellow-900" />
          </div>

          <h2 className="text-2xl font-black text-white mb-2">FIM DE JOGO!</h2>
          <div className="text-5xl font-black text-white mb-8">{score}</div>

          {(mode === 'preview' || mode === 'office') && (
            <button
              onClick={() => {
                setGameStatus('playing');
                setCurrentQuestionIndex(0);
                setScore(0);
                setTimeLeft(15);
                setIsAnswered(false);
                setSelectedOption(null);
              }}
              className="px-6 py-2 bg-white/90 text-slate-700 font-bold rounded-lg hover:bg-white transition-colors text-sm"
            >
              Jogar Novamente
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full h-full flex flex-col relative overflow-hidden font-sans shadow-2xl"
      style={{
        backgroundColor: finalConfig?.primaryColor || '#312e81',
        backgroundImage: finalConfig?.backgroundImageUrl
          ? `url(${finalConfig.backgroundImageUrl})`
          : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="absolute inset-0 bg-black/45 pointer-events-none" />

      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, #fff 1%, transparent 1%)',
          backgroundSize: '30px 30px'
        }}
      />

      {finalConfig?.logoUrl && (
        <div className="relative z-10 flex justify-center pt-4 px-4">
          <img
            src={finalConfig.logoUrl}
            alt="Logo"
            className="h-14 max-w-[180px] object-contain drop-shadow-lg"
          />
        </div>
      )}

      <div className="p-4 flex justify-between items-center relative z-10">
        <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-white font-bold flex items-center gap-2 border border-white/20 text-sm">
          <Trophy size={16} className="text-yellow-400" /> {score}
        </div>
        <div
          className={`px-4 py-2 rounded-full font-bold flex items-center gap-2 border transition-colors text-sm ${
            timeLeft <= 5 ? 'bg-red-500/20 border-red-500 text-red-200 animate-pulse' : 'bg-white/10 border-white/20 text-white'
          }`}
        >
          <Timer size={16} /> {timeLeft}s
        </div>
      </div>

      <div className="w-full h-1 bg-indigo-900/50 mt-2 relative z-10">
        <div className="h-full bg-yellow-400 transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10 w-full max-w-lg mx-auto overflow-y-auto">
        <div className="bg-white rounded-2xl p-6 shadow-xl w-full mb-4 text-center min-h-[100px] flex items-center justify-center border-b-4 border-indigo-200">
          <h2 className="text-lg font-bold text-indigo-900 leading-tight">{currentQuestion.question}</h2>
        </div>

        <div className="grid grid-cols-1 gap-2 w-full pb-4">
          {currentQuestion.options.map((optionText, idx) => {
            let btnClass = 'bg-white text-indigo-900 border-indigo-100 hover:bg-indigo-50';

            if (isAnswered) {
              if (idx === currentQuestion.correctIndex) btnClass = 'bg-green-500 text-white border-green-600';
              else if (idx === selectedOption) btnClass = 'bg-red-500 text-white border-red-600 opacity-50';
              else btnClass = 'bg-white text-slate-300 border-transparent opacity-40 grayscale';
            } else if (selectedOption === idx) {
              btnClass = 'bg-yellow-400 text-yellow-900 border-yellow-500';
            }

            return (
              <button
                key={idx}
                disabled={isAnswered}
                onClick={() => handleOptionClick(idx)}
                className={`relative w-full py-3 px-4 rounded-xl text-sm font-bold text-left transition-all duration-200 border-b-4 shadow-sm ${btnClass}`}
              >
                <div className="flex justify-between items-center">
                  <span>{optionText}</span>
                  {isAnswered && idx === currentQuestion.correctIndex && <CheckCircle size={16} />}
                  {isAnswered && idx === selectedOption && idx !== currentQuestion.correctIndex && <XCircle size={16} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}