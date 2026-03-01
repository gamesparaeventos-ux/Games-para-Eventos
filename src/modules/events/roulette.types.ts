export interface RouletteConfig {
  title: string;
  description?: string;
  primaryColor: string;
  skipLeadGate: boolean;
  logoUrl?: string;
  backgroundImageUrl?: string;
  items: string[];
  // Campos obrigatórios para o design novo
  outerRimColor: string; 
  ledColor: string;      
}

export interface RouletteRunnerProps {
  config: RouletteConfig;
  mode: 'preview' | 'live';
  onComplete?: (prize: string) => void;
}

export const ROULETTE_PALETTE = [
  '#F43F5E', '#3B82F6', '#22C55E', '#EAB308',
  '#A855F7', '#F97316', '#06B6D4', '#EC4899',
];