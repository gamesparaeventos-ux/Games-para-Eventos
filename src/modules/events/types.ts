// Tabela 'games' (O Catálogo)
export interface Game {
  id: string;
  name: string;
  slug: string; // 'quiz', 'roleta', etc.
  description?: string;
  image_url?: string;
}

// Tabela 'events' (O Evento Pai)
export interface EventoBase {
  id: string;
  name: string;
  active?: boolean;
}

// Tabela 'event_games' (A principal que liga tudo)
export interface EventGame {
  id: string;
  event_id: string;
  game_id: string;
  status: 'active' | 'inactive' | 'draft';
  config: Record<string, unknown>;
  customization: Record<string, unknown>;
  created_at: string;
  
  // Relacionamentos (Joins)
  event?: EventoBase;
  game?: Game;
}