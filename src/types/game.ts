export interface Country {
  code: string; // ADM0_A3 code (e.g., 'FRA', 'USA')
  name: string;
  aliases: string[];
  capital: string;
  flag: string;
  continent: string;
  lat: number;
  lng: number;
  altitude: number;
  trivia: string;
}

export type GameMode = 'countries' | 'capitals' | 'flags' | 'blitz';
export type InputType = 'type' | 'mcq';
export type GameStatus = 'landing' | 'playing' | 'gameover';

export interface GameSettings {
  mode: GameMode;
  inputType: InputType;
  continent: string; // 'all' | 'Africa' | 'Americas' | 'Asia' | 'Europe' | 'Oceania'
  durationSeconds: number; // e.g. 900 for 15 mins, 300 for 5 mins, 0 for unlimited
}

export interface AnswerRecord {
  countryCode: string;
  status: 'correct' | 'revealed' | 'skipped';
  attempts: number;
  timestamp: number;
}

export interface ActiveTrivia {
  country: Country;
  text: string;
  id: string;
}
