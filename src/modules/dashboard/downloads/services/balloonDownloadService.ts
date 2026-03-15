import type { DownloadableGame } from '../types';
import { generateBalloonOfflineHTML } from '../generators/balloonOfflineGenerator';
import { downloadFile } from './downloadFile';
import { buildOfflineFileName } from '../utils/fileName';

export function handleBalloonOfflineDownload(game: DownloadableGame) {
  try {
    const fileContent = generateBalloonOfflineHTML(game);
    const filename = buildOfflineFileName(game.name, 'balao-offline');

    downloadFile(filename, fileContent);
  } catch (error) {
    console.error('Erro ao gerar balão offline:', error);
    alert('Não foi possível gerar o arquivo offline do balão.');
  }
}