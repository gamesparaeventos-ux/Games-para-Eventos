import type { DownloadableGame } from '../types';
import { downloadFile } from './downloadFile';
import { buildOfflineFileName } from '../utils/fileName';
import { generateMemoryOfflineHTML } from '../generators/memoryOfflineGenerator';

export function handleMemoryOfflineDownload(game: DownloadableGame) {

  try {

    const config = game.config || {};

    const difficulty = config.difficulty || 'easy';

    const requiredImages =
      difficulty === 'hard'
        ? 15
        : difficulty === 'medium'
        ? 10
        : 6;

    if (!config.images || config.images.length < requiredImages) {
      alert('Este jogo da memória não possui imagens suficientes para a dificuldade configurada.');
      return;
    }

    const fileContent = generateMemoryOfflineHTML(game);

    const filename = buildOfflineFileName(game.name, 'memoria-offline');

    downloadFile(filename, fileContent);

  } catch (error) {

    console.error('Erro ao gerar memória offline:', error);

    alert('Não foi possível gerar o arquivo offline da memória.');

  }
}