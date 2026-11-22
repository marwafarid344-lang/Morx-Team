import { NextRequest, NextResponse } from 'next/server';
import { getTodaySolvers, recordSolve } from '@/lib/wordle/wordle-service';
import { requireAuth } from '@/lib/middleware/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const solvers = await getTodaySolvers();
    return NextResponse.json({
      success: true,
      data: solvers
    });
  } catch (error: any) {
    console.error('[API Wordle Solvers] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load solvers', details: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Enforce authentication: only logged in users can record solves
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Sign in required to record solve.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { word_id, user_name, user_avatar, guesses, grid_pattern, attempts } = body;

    if (!word_id || !user_name || !guesses || !grid_pattern || !attempts) {
      return NextResponse.json(
        { success: false, error: 'Missing required solve details' },
        { status: 400 }
      );
    }

    const savedSolve = await recordSolve({
      word_id,
      user_id: authResult.id,
      user_name: authResult.name || user_name,
      user_avatar,
      guesses,
      grid_pattern,
      attempts
    });

    return NextResponse.json({
      success: true,
      data: savedSolve
    });
  } catch (error: any) {
    console.error('[API Wordle Solvers] POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record solve', details: error?.message },
      { status: 500 }
    );
  }
}
