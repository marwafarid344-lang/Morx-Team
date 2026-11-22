import { NextRequest, NextResponse } from 'next/server';
import { generateNewDailyWord } from '@/lib/wordle/wordle-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Cron trigger for 12:00 Wordle daily generation.
 * Generates a brand-new 5-letter word meeting NYT standards,
 * inserts it into wordle_words with unique id and creation_date.
 * Old words remain preserved in the database.
 */
export async function GET(request: NextRequest) {
  return handleGenerate(request);
}

export async function POST(request: NextRequest) {
  return handleGenerate(request);
}

async function handleGenerate(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const url = new URL(request.url);
  const keyParam = url.searchParams.get('key');
  const force = url.searchParams.get('force') === 'true';
  const customWord = url.searchParams.get('word');

  if (cronSecret && !force) {
    const isAuthorized =
      authHeader === `Bearer ${cronSecret}` || keyParam === cronSecret;
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid or missing CRON_SECRET' },
        { status: 401 }
      );
    }
  }

  try {
    const newWord = await generateNewDailyWord(customWord || undefined);
    return NextResponse.json({
      success: true,
      message: 'New daily Wordle word successfully generated and archived in wordle_words',
      data: {
        id: newWord.id,
        creation_date: newWord.creation_date,
        wordLength: newWord.word.length
      }
    });
  } catch (error: any) {
    console.error('[CRON Wordle Generation] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate word', details: error?.message },
      { status: 500 }
    );
  }
}
