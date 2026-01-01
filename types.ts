
export enum Chronology {
  MEGALITHIC = 'Megalithic',
  SANGAM = 'Sangam Age',
  EARLY_HISTORIC = 'Early Historic',
  MEDIEVAL = 'Medieval',
  UNKNOWN = 'Unknown Period'
}

export interface Artifact {
  name: string;
  material: string;
  category: 'pottery' | 'bead' | 'tool' | 'coin' | 'ornament' | 'other';
  description: string;
}

export interface Site {
  id: string;
  name: string;
  location: { lat: number; lng: number; district: string };
  chronology: Chronology[];
  description: string;
  artifacts: Artifact[];
  structures: string[];
  embedding?: number[]; // Mock embedding representation
}

export interface SimilarityResult {
  sourceId: string;
  targetId: string;
  score: number;
  explanation: string;
  sharedEntities: string[];
}

export interface AnalysisState {
  isProcessing: boolean;
  currentStep: 'ingestion' | 'ner' | 'embedding' | 'similarity' | 'idle';
  progress: number;
}
