// Tabela 'games' (O Catálogo)
export interface Game {
  id: string;
  name: string;
  slug: string; // 'quiz', 'roleta', etc.
  description?: string;
  image_url?: string; // Adicionado para evitar erro se estiver faltando
}

// Tabela 'events' (O Evento Pai)
export interface EventoBase {
  id: string;
  name: string;
  active?: boolean; // '?' significa opcional
}

// Tabela 'event_games' (A principal que liga tudo)
export interface EventGame {
  id: string;
  event_id: string;
  game_id: string;
  status: 'active' | 'inactive' | 'draft';
  config: any;        // Aceita qualquer JSON
  customization: any; // Aceita qualquer JSON
  created_at: string;
  
  // Relacionamentos (Joins)
  event?: EventoBase;
  game?: Game;
}