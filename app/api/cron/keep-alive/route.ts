import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function pingDatabase(request: NextRequest) {
  const startTime = Date.now();

  // Check optional CRON_SECRET if configured in environment variables
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const url = new URL(request.url);
  const keyParam = url.searchParams.get('key');

  if (cronSecret) {
    const isAuthorized =
      authHeader === `Bearer ${cronSecret}` || keyParam === cronSecret;

    if (!isAuthorized) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: 'Unauthorized: Invalid or missing CRON_SECRET',
        },
        { status: 401 }
      );
    }
  }

  try {
    // Perform a lightweight count query to generate Supabase DB activity
    const { count, error } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true });

    const durationMs = Date.now() - startTime;

    if (error) {
      console.error('[CRON Keep-Alive] Supabase ping error:', error.message);
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `Database ping failed: ${error.message}`,
          data: {
            durationMs,
            timestamp: new Date().toISOString(),
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Database keep-alive ping successful. Supabase project will stay active.',
      data: {
        timestamp: new Date().toISOString(),
        durationMs,
        recordsChecked: count ?? 0,
      },
    });
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    console.error('[CRON Keep-Alive] Unexpected error:', err);

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: err?.message || 'Unexpected server error while pinging database',
        data: {
          durationMs,
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return pingDatabase(request);
}

export async function POST(request: NextRequest) {
  return pingDatabase(request);
}
