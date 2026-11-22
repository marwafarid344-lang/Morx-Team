import fs from 'fs';
import path from 'path';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { TARGET_WORDS, isValidWord, evaluateGuess } from './words';
import { WordleWord, WordleSolve, TileState, GuessResponse } from './types';

const DATA_DIR = path.join(process.cwd(), 'data', 'wordle');
const WORDS_FILE = path.join(DATA_DIR, 'wordle_words.json');
const SOLVES_FILE = path.join(DATA_DIR, 'wordle_solves.json');

function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(WORDS_FILE)) {
    fs.writeFileSync(WORDS_FILE, JSON.stringify([]), 'utf8');
  }
  if (!fs.existsSync(SOLVES_FILE)) {
    fs.writeFileSync(SOLVES_FILE, JSON.stringify([]), 'utf8');
  }
}

function readLocalWords(): WordleWord[] {
  ensureStorage();
  try {
    const raw = fs.readFileSync(WORDS_FILE, 'utf8');
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
}

function writeLocalWord(entry: WordleWord) {
  ensureStorage();
  const list = readLocalWords();
  list.unshift(entry);
  fs.writeFileSync(WORDS_FILE, JSON.stringify(list, null, 2), 'utf8');
}

function readLocalSolves(): WordleSolve[] {
  ensureStorage();
  try {
    const raw = fs.readFileSync(SOLVES_FILE, 'utf8');
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
}

function writeLocalSolve(solve: WordleSolve) {
  ensureStorage();
  const list = readLocalSolves();
  list.unshift(solve);
  fs.writeFileSync(SOLVES_FILE, JSON.stringify(list, null, 2), 'utf8');
}

export function getTodayPeriodKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function generateId(prefix = 'wrd'): string {
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${ts}_${rnd}`;
}

/**
 * Generates a brand-new daily word and stores it in Supabase `wordle_words`
 */
export async function generateNewDailyWord(customWord?: string): Promise<WordleWord> {
  const id = generateId('wrd');
  let chosenWord: string;

  if (customWord && customWord.length === 5) {
    chosenWord = customWord.toUpperCase();
  } else {
    // Pick from authentic curated Wordle target vocabulary
    const randomIndex = Math.floor(Math.random() * TARGET_WORDS.length);
    chosenWord = (TARGET_WORDS[randomIndex] || 'SHINE').toUpperCase();
  }

  const creationDate = new Date().toISOString();
  const wordRecord: WordleWord = {
    id,
    word: chosenWord,
    creation_date: creationDate
  };

  // 1. Insert into Supabase table wordle_words
  try {
    const { error } = await supabase.from('wordle_words').insert({
      id: wordRecord.id,
      word: wordRecord.word,
      creation_date: wordRecord.creation_date
    });
    if (error) {
      console.warn('[WordleService] Supabase insert warning:', error.message);
    }
  } catch (err: any) {
    console.warn('[WordleService] Supabase connection error:', err?.message);
  }

  // 2. Also keep local persistent backup
  writeLocalWord(wordRecord);

  return wordRecord;
}

/**
 * Retrieves the current active word from Supabase `wordle_words`.
 * If no word exists for today, automatically generates one.
 */
export async function getTodayWord(): Promise<WordleWord> {
  let latestWord: WordleWord | null = null;

  // 1. Query Supabase wordle_words
  try {
    const { data, error } = await supabase
      .from('wordle_words')
      .select('id, word, creation_date')
      .order('creation_date', { ascending: false })
      .limit(1);

    if (!error && data && data.length > 0) {
      latestWord = data[0] as WordleWord;
    }
  } catch (err) {
    console.warn('[WordleService] Could not fetch latest word from Supabase:', err);
  }

  // 2. Fall back to local file if Supabase returned nothing
  if (!latestWord) {
    const localWords = readLocalWords();
    if (localWords.length > 0) {
      latestWord = localWords[0];
    }
  }

  const todayKey = getTodayPeriodKey();

  // If no word found or the latest word was generated before today, generate a new one
  if (!latestWord || getTodayPeriodKey(new Date(latestWord.creation_date)) !== todayKey) {
    latestWord = await generateNewDailyWord();
  }

  return latestWord;
}

/**
 * Validates and evaluates a guess against today's target word
 */
export async function processGuess(guess: string): Promise<GuessResponse> {
  if (!guess || guess.length !== 5) {
    return { valid: false, message: 'Not enough letters' };
  }

  const upperGuess = guess.toUpperCase();
  if (!isValidWord(upperGuess)) {
    return { valid: false, message: 'Not in word list' };
  }

  const dailyWord = await getTodayWord();
  const evaluation = evaluateGuess(upperGuess, dailyWord.word);
  const isWon = upperGuess === dailyWord.word;

  return {
    valid: true,
    isWon,
    evaluation: evaluation.map((state, i) => ({
      letter: upperGuess[i],
      state
    })),
    targetWord: isWon ? dailyWord.word : undefined
  };
}

/**
 * Records a real user's solve into Supabase `wordle_solves`
 */
export async function recordSolve(payload: {
  word_id: string;
  user_id?: string;
  user_name: string;
  user_avatar?: string;
  guesses: string[];
  grid_pattern: TileState[][];
  attempts: number;
}): Promise<WordleSolve> {
  const solveRecord: WordleSolve = {
    id: generateId('slv'),
    word_id: payload.word_id,
    date: getTodayPeriodKey(),
    user_id: payload.user_id,
    user_name: payload.user_name || 'Anonymous Player',
    user_avatar: payload.user_avatar || '',
    guesses: payload.guesses,
    grid_pattern: payload.grid_pattern,
    attempts: payload.attempts,
    solved_at: new Date().toISOString()
  };

  // 1. Insert into Supabase table wordle_solves
  try {
    const { error } = await supabase.from('wordle_solves').insert({
      id: solveRecord.id,
      word_id: solveRecord.word_id,
      date: solveRecord.date,
      user_id: solveRecord.user_id,
      user_name: solveRecord.user_name,
      user_avatar: solveRecord.user_avatar,
      guesses: solveRecord.guesses,
      grid_pattern: solveRecord.grid_pattern,
      attempts: solveRecord.attempts,
      solved_at: solveRecord.solved_at
    });
    if (error) {
      console.warn('[WordleService] Supabase solve insert warning:', error.message);
    }
  } catch (err: any) {
    console.warn('[WordleService] Supabase solve connection error:', err?.message);
  }

  // 2. Also save to local storage backup
  writeLocalSolve(solveRecord);

  return solveRecord;
}

/**
 * Fetches real solvers from Supabase `wordle_solves` for today's puzzle.
 * NO dummy or mock data.
 */
export async function getTodaySolvers(): Promise<WordleSolve[]> {
  const todayKey = getTodayPeriodKey();
  let solves: WordleSolve[] = [];

  // Query Supabase wordle_solves
  try {
    const { data, error } = await supabase
      .from('wordle_solves')
      .select('*')
      .eq('date', todayKey)
      .order('attempts', { ascending: true })
      .order('solved_at', { ascending: true });

    if (!error && data) {
      solves = data as WordleSolve[];
    }
  } catch (err) {
    console.warn('[WordleService] Could not fetch solvers from Supabase:', err);
  }

  // Fallback to local file only if Supabase returned nothing
  if (solves.length === 0) {
    const local = readLocalSolves();
    solves = local.filter(s => s.date === todayKey);
  }

  // Return ONLY real solves, NO dummy data
  return solves;
}
