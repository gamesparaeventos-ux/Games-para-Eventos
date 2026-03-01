// src/modules/events/balloon.types.ts

export interface BalloonColor {
  id: string;
  label: string;
  hex: string;
}

export const ALL_BALLOON_COLORS: BalloonColor[] = [
  { id: 'red', label: 'VERMELHO', hex: '#ef4444' },
  { id: 'blue', label: 'AZUL', hex: '#3b82f6' },
  { id: 'green', label: 'VERDE', hex: '#22c55e' },
  { id: 'yellow', label: 'AMARELO', hex: '#eab308' },
  { id: 'purple', label: 'ROXO', hex: '#a855f7' },
  { id: 'pink', label: 'ROSA', hex: '#ec4899' },
];

export interface BalloonConfig {
  title: string;
  description?: string;
  primaryColor: string;
  skipLeadGate: boolean;
  logoUrl?: string;
  backgroundImageUrl?: string;
  balloonLogoUrl?: string;
  balloonCount: number; // Quantidade de balões simultâneos
  speed: number;       // Velocidade de subida
  duration: number;    // Tempo total de jogo
  activeColors: string[]; // Array de hexadecimais
}

export interface BalloonRunnerProps {
  config: BalloonConfig;
  mode: 'preview' | 'live';
  onComplete?: (score: number) => void;
}