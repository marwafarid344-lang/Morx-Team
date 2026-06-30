import { createClient } from '@supabase/supabase-js'
import { getAiDailyLimit } from '@/lib/constants/plans'
import { PlanType } from '@/lib/types'

// ─── Types ──────────────────────────────────────────────

export interface AiUsageResult {
  allowed: boolean
  remaining: number
  unlimited: boolean
  plan: string
  limit: number
  used: number
  error?: string
}

export interface AiUsageStatus {
  used: number
  limit: number
  remaining: number
  date: string
  plan: string
  unlimited: boolean
}

// ─── Helpers ────────────────────────────────────────────

/** Get today's date key (YYYY-MM-DD) */
function getTodayKey(): string {
  return new Date().toISOString().split('T')[0]
}

/** Create a Supabase admin client, or null if not configured */
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) return null
  return createClient(supabaseUrl, supabaseKey)
}

// ─── Public API ─────────────────────────────────────────

/**
 * Check if the user is allowed to make an AI request and increment their usage.
 * Use this in any AI endpoint that consumes a credit.
 *
 * @param userId - The authenticated user's auth_user_id
 * @returns AiUsageResult with allowed status, remaining credits, plan info
 */
export async function checkAndIncrementAiUsage(userId: string): Promise<AiUsageResult> {
  const supabase = getSupabaseClient()

  if (!supabase) {
    // No Supabase configured — allow with free tier defaults
    const defaultLimit = getAiDailyLimit(null)
    return {
      allowed: true,
      remaining: defaultLimit,
      unlimited: false,
      plan: 'free',
      limit: defaultLimit,
      used: 0,
    }
  }

  const today = getTodayKey()

  // Get user's plan
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('plan')
    .eq('auth_user_id', userId)
    .single()

  if (userError && userError.code !== 'PGRST116') {
    console.error('Error fetching user plan:', userError)
  }

  const userPlan = (userData as any)?.plan || 'free'
  const dailyLimit = getAiDailyLimit(userPlan as PlanType)
  const isUnlimited = dailyLimit === Infinity

  // Get current usage
  const { data: usage, error: usageError } = await supabase
    .from('ai_usage')
    .select('request_count')
    .eq('user_id', userId)
    .eq('date', today)
    .single()

  if (usageError && usageError.code !== 'PGRST116') {
    console.error('Error checking AI usage:', usageError)
  }

  const currentCount = (usage as any)?.request_count || 0

  // Enterprise / unlimited — always allow, still track for analytics
  if (isUnlimited) {
    if (usage) {
      await supabase
        .from('ai_usage')
        .update({ request_count: currentCount + 1 } as any)
        .eq('user_id', userId)
        .eq('date', today)
    } else {
      await supabase
        .from('ai_usage')
        .insert({ user_id: userId, date: today, request_count: 1 } as any)
    }
    return {
      allowed: true,
      remaining: -1,
      unlimited: true,
      plan: userPlan,
      limit: -1,
      used: currentCount + 1,
    }
  }

  // Check if limit reached
  if (currentCount >= dailyLimit) {
    const planName = userPlan.charAt(0).toUpperCase() + userPlan.slice(1)
    return {
      allowed: false,
      remaining: 0,
      unlimited: false,
      plan: userPlan,
      limit: dailyLimit,
      used: currentCount,
      error: `Daily limit reached (${dailyLimit} requests for ${planName} plan). Upgrade your plan for more requests!`,
    }
  }

  // Allowed — increment
  if (usage) {
    await supabase
      .from('ai_usage')
      .update({ request_count: currentCount + 1 } as any)
      .eq('user_id', userId)
      .eq('date', today)
  } else {
    await supabase
      .from('ai_usage')
      .insert({ user_id: userId, date: today, request_count: 1 } as any)
  }

  return {
    allowed: true,
    remaining: dailyLimit - currentCount - 1,
    unlimited: false,
    plan: userPlan,
    limit: dailyLimit,
    used: currentCount + 1,
  }
}

/**
 * Get the user's current AI usage status (read-only, does NOT increment).
 * Use this for dashboards / settings pages.
 *
 * @param userId - The authenticated user's auth_user_id
 * @returns AiUsageStatus with current usage info
 */
export async function getAiUsageStatus(userId: string): Promise<AiUsageStatus> {
  const supabase = getSupabaseClient()
  const today = getTodayKey()

  if (!supabase) {
    const defaultLimit = getAiDailyLimit(null)
    return {
      used: 0,
      limit: defaultLimit,
      remaining: defaultLimit,
      date: today,
      plan: 'free',
      unlimited: false,
    }
  }

  // Get user's plan
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('plan')
    .eq('auth_user_id', userId)
    .single()

  if (userError && userError.code !== 'PGRST116') {
    console.error('Error fetching user plan:', userError)
  }

  const userPlan = (userData as any)?.plan || 'free'
  const dailyLimit = getAiDailyLimit(userPlan as PlanType)
  const isUnlimited = dailyLimit === Infinity

  // Get current usage
  const { data: usage, error: usageError } = await supabase
    .from('ai_usage')
    .select('request_count')
    .eq('user_id', userId)
    .eq('date', today)
    .single()

  if (usageError && usageError.code !== 'PGRST116') {
    console.error('Error checking AI usage:', usageError)
  }

  const used = (usage as any)?.request_count || 0
  const remaining = isUnlimited ? -1 : Math.max(0, dailyLimit - used)

  return {
    used,
    limit: isUnlimited ? -1 : dailyLimit,
    remaining,
    date: today,
    plan: userPlan,
    unlimited: isUnlimited,
  }
}
