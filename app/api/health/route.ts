import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Health check endpoint to test Supabase connection
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Test basic connection
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('auth_user_id')
      .limit(1)
      .single();

    const responseTime = Date.now() - startTime;

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      return NextResponse.json({
        status: 'error',
        message: 'Database connection failed',
        error: {
          message: error.message,
          code: error.code,
          details: error.details
        },
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    return NextResponse.json({
      status: 'healthy',
      message: 'Supabase connection successful',
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'error',
      message: 'Connection test failed',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.constructor.name : typeof error,
        stack: error instanceof Error ? error.stack : undefined
      },
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
