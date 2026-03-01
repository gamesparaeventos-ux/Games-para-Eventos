// src/modules/events/memory.types.ts

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface MemoryConfig {
  title: string;
  description?: string;
  primaryColor: string;
  skipLeadGate: boolean;
  logoUrl?: string;
  backgroundImageUrl?: string;
  difficulty: DifficultyLevel;
  images: string[]; // URLs das cartas
}

export interface MemoryRunnerProps {
  config: MemoryConfig;
  mode: 'preview' | 'live';
  onComplete?: (stats: { moves: number; time: number }) => void;
}

// Configuração estática das dificuldades (compartilhada)
export const DIFFICULTY_CONFIG = {
  easy: { pairs: 6, label: "Fácil", cols: 4, description: "6 Pares (12 Cartas)" },
  medium: { pairs: 10, label: "Médio", cols: 5, description: "10 Pares (20 Cartas)" },
  hard: { pairs: 15, label: "Difícil", cols: 6, description: "15 Pares (30 Cartas)" },
};