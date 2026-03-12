export type DownloadableGame = {
  id?: string;
  name: string;
  type?: string;
  status?: string;
  user_id?: string;
  created_at?: string;
  config?: {
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
    questions?: Array<{
      id?: string;
      question: string;
      options: string[];
      correctIndex: number;
    }>;
    skipLeadGate?: boolean;
    [key: string]: unknown;
  };
};