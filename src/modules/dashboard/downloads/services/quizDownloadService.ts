import type { DownloadableGame } from '../types';
import { generateQuizOfflineHTML } from '../generators/quizOfflineGenerator';
import { validateQuizDownload } from '../validators/quizDownloadValidator';
import { downloadFile } from './downloadFile';
import { buildOfflineFileName } from '../utils/fileName';

export function handleQuizOfflineDownload(game: DownloadableGame) {
  try {
    const validation = validateQuizDownload(game);

    if (!validation.valid) {
      alert(validation.message);
      return;
    }

    const fileContent = generateQuizOfflineHTML(game);
    const filename = buildOfflineFileName(game.name, 'quiz-offline');

    downloadFile(filename, fileContent);
  } catch (error) {
    console.error('Erro ao gerar quiz offline:', error);
    alert('Não foi possível gerar o arquivo offline do quiz.');
  }
}