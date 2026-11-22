import { NextRequest, NextResponse } from 'next/server';
import { processGuess } from '@/lib/wordle/wordle-service';
import { requireAuth } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Enforce authentication: only logged in users can play and submit guesses
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          message: 'Sign in required. Please log in to play Morx Wordle.'
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { guess } = body;

    if (!guess || typeof guess !== 'string') {
      return NextResponse.json(
        { success: false, valid: false, message: 'Invalid guess parameter' },
        { status: 400 }
      );
    }

    const result = await processGuess(guess);

    if (!result.valid) {
      return NextResponse.json({
        success: false,
        valid: false,
        message: result.message
      });
    }

    return NextResponse.json({
      success: true,
      valid: true,
      isWon: result.isWon,
      evaluation: result.evaluation,
      targetWord: result.targetWord
    });
  } catch (error: any) {
    console.error('[API Wordle Guess] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to evaluate guess', details: error?.message },
      { status: 500 }
    );
  }
}
