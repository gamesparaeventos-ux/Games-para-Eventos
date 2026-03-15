export type GameType = 'quiz' | 'roulette' | 'memory' | 'balloon';

export type DownloadableQuestion = {
  id?: string;
  question: string;
  options: string[];
  correctIndex: number;
};

export type DownloadableGameConfig = {
  type?: string;
  backgroundImageUrl?: string;
  primaryColor?: string;
  outerRimColor?: string;
  ledColor?: string;
  logoUrl?: string;
  title?: string;
  description?: string;
  duration?: number;
  difficulty?: string;
  images?: string[];
  items?: string[];
  balloonLogoUrl?: string;
  balloonCount?: number;
  speed?: number;
  activeColors?: string[];
  questions?: DownloadableQuestion[];
  skipLeadGate?: boolean;
  [key: string]: unknown;
};

export type DownloadableGame = {
  id?: string;
  name: string;
  type?: string;
  status?: string;
  user_id?: string;
  created_at?: string;
  config?: DownloadableGameConfig;
};