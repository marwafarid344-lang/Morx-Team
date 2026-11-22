import { NextRequest, NextResponse } from 'next/server';
import { getTodayWord } from '@/lib/wordle/wordle-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const todayWord = await getTodayWord();
    const url = new URL(request.url);
    const includeHint = url.searchParams.get('hint') === 'true';

    // Calculate Wordle day number from epoch
    const epoch = new Date('2021-06-19T00:00:00Z').getTime();
    const current = new Date(todayWord.creation_date).getTime();
    const dayNumber = Math.max(1, Math.floor((current - epoch) / (1000 * 60 * 60 * 24)));

    let clue = undefined;
    if (includeHint) {
      clue = `First letter is "${todayWord.word[0]}" and it contains ${
        new Set(todayWord.word.split('')).size
      } unique letters.`;
    }

    return NextResponse.json({
      success: true,
      data: {
        id: todayWord.id,
        creation_date: todayWord.creation_date,
        day_number: dayNumber,
        clue
      }
    });
  } catch (error: any) {
    console.error('[API Wordle Daily Word] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve daily word', details: error?.message },
      { status: 500 }
    );
  }
}
