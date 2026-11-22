export type TileState = 'correct' | 'present' | 'absent' | 'empty' | 'tbd';

export type KeyState = 'correct' | 'present' | 'absent' | 'default';

export interface WordleWord {
  id: string;
  word: string;
  creation_date: string;
}

export interface WordleSolve {
  id: string;
  word_id: string;
  date: string;
  user_id?: string;
  user_name: string;
  user_avatar?: string;
  guesses: string[];
  grid_pattern: TileState[][];
  attempts: number;
  solved_at: string;
}

export interface DailyWordResponse {
  id: string;
  creation_date: string;
  day_number: number;
  clue?: string;
}

export interface GuessEvaluation {
  letter: string;
  state: TileState;
}

export interface GuessResponse {
  valid: boolean;
  message?: string;
  isWon?: boolean;
  isGameOver?: boolean;
  evaluation?: GuessEvaluation[];
  targetWord?: string; // only returned when game over or won
}

export interface WordleStats {
  played: number;
  winPercentage: number;
  currentStreak: number;
  maxStreak: number;
  guessDistribution: Record<number, number>;
  lastPlayedDate?: string;
}
