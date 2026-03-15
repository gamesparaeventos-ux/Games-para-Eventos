import type { DownloadableGame, GameType } from '../types';

const FALLBACK_GAME_TYPE: GameType = 'quiz';

const VALID_GAME_TYPES: readonly GameType[] = [
  'quiz',
  'roulette',
  'memory',
  'balloon',
];

function isValidGameType(value: string): value is GameType {
  return VALID_GAME_TYPES.includes(value as GameType);
}

export function getGameType(game: Pick<DownloadableGame, 'type' | 'config'>): GameType {
  const rawType = (game.type || game.config?.type || FALLBACK_GAME_TYPE)
    .toString()
    .toLowerCase()
    .trim();

  return isValidGameType(rawType) ? rawType : FALLBACK_GAME_TYPE;
}

export function getGameTypeName(game: Pick<DownloadableGame, 'type' | 'config'>): string {
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

export function isQuizGame(game: Pick<DownloadableGame, 'type' | 'config'>): boolean {
  return getGameType(game) === 'quiz';
}

export function isRouletteGame(game: Pick<DownloadableGame, 'type' | 'config'>): boolean {
  return getGameType(game) === 'roulette';
}

export function isMemoryGame(game: Pick<DownloadableGame, 'type' | 'config'>): boolean {
  return getGameType(game) === 'memory';
}

export function isBalloonGame(game: Pick<DownloadableGame, 'type' | 'config'>): boolean {
  return getGameType(game) === 'balloon';
}