import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { requireAuth } from '@/lib/middleware/auth'
import { getAiUsageStatus } from '@/lib/utils/aiUsage'

export async function GET(request: NextRequest) {
  // Require authentication
  const user = await requireAuth(request);
  
  if (user instanceof NextResponse) {
    return user; // Return 401 error
  }

  try {
    // Use authenticated user ID
    const userId = user.id;

    // Get usage status from shared utility
    const status = await getAiUsageStatus(userId)

    return NextResponse.json({
      success: true,
      data: status
    })

  } catch (error) {
    console.error('AI usage error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
