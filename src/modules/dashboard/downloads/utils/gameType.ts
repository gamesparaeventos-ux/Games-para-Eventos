type DownloadGame = {
  type?: string;
  config?: {
    type?: string;
  };
};

export function getGameType(game: DownloadGame): string {
  return (game.type || game.config?.type || 'quiz').toLowerCase();
}

export function getGameTypeName(game: DownloadGame): string {
  const type = getGameType(game);

  switch (type) {
    case 'quiz':
      return 'QUIZ';
    case 'roulette':
      return 'ROLETA';
    case 'balloon':
      return 'BALÃO';
    case 'memory':
      return 'MEMÓRIA';
    default:
      return 'JOGO';
  }
}

export function isQuizGame(game: DownloadGame): boolean {
  return getGameType(game) === 'quiz';
}

export function isRouletteGame(game: DownloadGame): boolean {
  return getGameType(game) === 'roulette';
}

export function isMemoryGame(game: DownloadGame): boolean {
  return getGameType(game) === 'memory';
}

export function isBalloonGame(game: DownloadGame): boolean {
  return getGameType(game) === 'balloon';
}