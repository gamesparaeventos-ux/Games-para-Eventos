import type { DownloadableGame } from '../types'
import { generateBalloonOfflineHTML } from '../generators/balloonOfflineGenerator'
import { downloadFile } from './downloadFile'

export function handleBalloonOfflineDownload(game: DownloadableGame) {
  try {

    const html = generateBalloonOfflineHTML(game)

    const filename =
      game.name.toLowerCase().replace(/\s+/g, '-') +
      '-balao-offline.html'

    downloadFile(filename, html)

  } catch (error) {

    console.error('Erro ao gerar balão offline:', error)

    alert('Não foi possível gerar o arquivo offline do balão.')

  }
}