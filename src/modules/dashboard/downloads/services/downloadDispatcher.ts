import type { DownloadableGame } from "../types";

import { handleQuizOfflineDownload } from "./quizDownloadService";
import { handleRouletteOfflineDownload } from "./rouletteDownloadService";
import { handleMemoryOfflineDownload } from "./memoryDownloadService";
import { handleBalloonOfflineDownload } from "./balloonDownloadService";

type DownloadHandler = (game: DownloadableGame) => void;

const handlers: Record<string, DownloadHandler> = {
  quiz: handleQuizOfflineDownload,
  roulette: handleRouletteOfflineDownload,
  memory: handleMemoryOfflineDownload,
  balloon: handleBalloonOfflineDownload,
};

export function dispatchOfflineDownload(type: string, game: DownloadableGame) {
  const handler = handlers[type];

  if (!handler) {
    console.error("Tipo de jogo sem download configurado:", type);
    alert("Este jogo ainda não possui download offline.");
    return;
  }

  handler(game);
}