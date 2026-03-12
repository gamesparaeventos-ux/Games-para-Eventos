type QuizDownloadGame = {
  config?: {
    questions?: unknown[];
  };
};

export function validateQuizDownload(game: QuizDownloadGame) {
  const questions = game.config?.questions;

  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return {
      valid: false,
      message: 'Este quiz não possui perguntas configuradas.',
    };
  }

  return { valid: true };
}