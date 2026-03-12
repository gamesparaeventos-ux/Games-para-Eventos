import type { DownloadableGame } from '../types';
import { downloadFile } from './downloadFile';
import { buildOfflineFileName } from '../utils/fileName';
import { generateRouletteOfflineHTML } from '../generators/rouletteOfflineGenerator';

export function handleRouletteOfflineDownload(game: DownloadableGame) {
  try {
    const config = game.config || {};

    if (!config.items || config.items.length === 0) {
      alert('Esta roleta não possui itens configurados.');
      return;
    }

    const fileContent = generateRouletteOfflineHTML(game);
    const filename = buildOfflineFileName(game.name, 'roleta-offline');

    downloadFile(filename, fileContent);
  } catch (error) {
    console.error('Erro ao gerar roleta offline:', error);
    alert('Não foi possível gerar o arquivo offline da roleta.');
  }
}