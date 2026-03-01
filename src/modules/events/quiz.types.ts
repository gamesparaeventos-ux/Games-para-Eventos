// ARQUIVO: src/modules/events/quiz.types.ts
export interface QuizOption {
  text: string;
}

export interface QuizQuestion {
  id?: string;
  question: string;
  options: string[]; 
  correctIndex: number;
}

export interface QuizConfig {
  title: string;
  description?: string;
  primaryColor: string;
  logoUrl?: string;
  backgroundImageUrl?: string;
  skipLeadGate: boolean;
  questions: QuizQuestion[];
}