import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Download, Loader2, Gamepad2, ExternalLink } from 'lucide-react';

import type { DownloadableGame } from './downloads/types';
import { dispatchOfflineDownload } from './downloads/services/downloadDispatcher';
import {
  getGameType,
  getGameTypeName,
  isBalloonGame,
  isMemoryGame,
  isQuizGame,
  isRouletteGame,
} from './downloads/utils/gameType';

export function DownloadsPage() {
  const [games, setGames] = useState<DownloadableGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveGames();
  }, []);

  const fetchActiveGames = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setGames([]);
        return;
      }

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'draft')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setGames(((data as DownloadableGame[]) || []).filter(Boolean));
    } catch (error) {
      console.error('Erro ao buscar jogos:', error);
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  const openQuizOfficeMode = (game: DownloadableGame) => {
    try {
      const config = game.config || {};

      if (!config.questions || config.questions.length === 0) {
        alert('Este quiz não possui perguntas configuradas.');
        return;
      }

      const officeConfig = {
        ...config,
        title: config.title || game.name || 'Quiz',
        skipLeadGate: true,
      };

      localStorage.setItem('@quiz_office_config', JSON.stringify(officeConfig));

      const officeUrl = `${window.location.origin}/office/quiz`;
      window.open(officeUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Erro ao abrir modo office do quiz:', error);
      alert('Não foi possível abrir o modo office do quiz.');
    }
  };

  const openRouletteOfficeMode = (game: DownloadableGame) => {
    try {
      const config = game.config || {};

      if (!config.items || config.items.length === 0) {
        alert('Esta roleta não possui itens configurados.');
        return;
      }

      if (!game.id) {
        alert('Esta roleta não possui um identificador válido.');
        return;
      }

      const officeUrl = `${window.location.origin}/office/roulette/${game.id}`;
      window.open(officeUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Erro ao abrir modo office da roleta:', error);
      alert('Não foi possível abrir o modo office da roleta.');
    }
  };

  const openMemoryOfficeMode = (game: DownloadableGame) => {
    if (!game.id) {
      alert('Este jogo não possui um identificador válido.');
      return;
    }

    const officeUrl = `${window.location.origin}/office/memory/${game.id}`;
    window.open(officeUrl, '_blank', 'noopener,noreferrer');
  };

  const openBalloonOfficeMode = (game: DownloadableGame) => {
    if (!game.id) {
      alert('Este jogo não possui um identificador válido.');
      return;
    }

    const officeUrl = `${window.location.origin}/office/balloon/${game.id}`;
    window.open(officeUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDownload = (game: DownloadableGame) => {
    const type = getGameType(game);
    dispatchOfflineDownload(type, game);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in font-sans pb-20">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Downloads Offline</h1>

        <p className="text-slate-500">
          Versões otimizadas para Totems e Telas Gigantes.
        </p>
      </div>

      <div className="space-y-4">
        {games.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-100">
            <p className="text-slate-400">Nenhum jogo ativo.</p>
          </div>
        ) : (
          games.map((game, index) => (
            <div
              key={game.id || `${game.name}-${index}`}
              className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
                  <Download size={24} />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-800">{game.name}</h3>

                  <div className="flex gap-2 mt-1 flex-wrap">
                    <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded uppercase">
                      Ativo
                    </span>

                    <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded uppercase flex items-center gap-1">
                      <Gamepad2 size={10} /> {getGameTypeName(game)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                {isQuizGame(game) && (
                  <>
                    <button
                      onClick={() => handleDownload(game)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg"
                    >
                      <Download size={18} /> Baixar Quiz Offline
                    </button>

                    <button
                      onClick={() => openQuizOfficeMode(game)}
                      className="bg-slate-700 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg"
                    >
                      <ExternalLink size={18} /> Abrir Office
                    </button>
                  </>
                )}

                {isRouletteGame(game) && (
                  <>
                    <button
                      onClick={() => handleDownload(game)}
                      className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg"
                    >
                      <Download size={18} /> Baixar Roleta Offline
                    </button>

                    <button
                      onClick={() => openRouletteOfficeMode(game)}
                      className="bg-slate-700 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg"
                    >
                      <ExternalLink size={18} /> Abrir Office
                    </button>
                  </>
                )}

                {isMemoryGame(game) && (
                  <>
                    <button
                      onClick={() => handleDownload(game)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg"
                    >
                      <Download size={18} /> Baixar Memória Offline
                    </button>

                    <button
                      onClick={() => openMemoryOfficeMode(game)}
                      className="bg-slate-700 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg"
                    >
                      <ExternalLink size={18} /> Abrir Office
                    </button>
                  </>
                )}

                {isBalloonGame(game) && (
                  <>
                    <button
                      onClick={() => handleDownload(game)}
                      className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg"
                    >
                      <Download size={18} /> Baixar Balão Offline
                    </button>

                    <button
                      onClick={() => openBalloonOfficeMode(game)}
                      className="bg-slate-700 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg"
                    >
                      <ExternalLink size={18} /> Abrir Office
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}