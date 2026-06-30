import { PlanType } from '@/lib/types';

/**
 * Plan member limits configuration
 * Maps each plan to the maximum number of members allowed per team
 */
export const PLAN_LIMITS: Record<PlanType, number> = {
  free: 15,
  starter: 50,
  professional: 80,
  enterprise: Infinity, // Unlimited
};

/**
 * Plan AI daily request limits configuration
 * Maps each plan to the maximum number of AI requests allowed per day
 */
export const AI_DAILY_LIMITS: Record<PlanType, number> = {
  free: 5,
  starter: 10,
  professional: 20,
  enterprise: Infinity, // Unlimited
};

/**
 * Plan border colors for profile images
 * Maps each plan to its designated border color
 */
export const PLAN_BORDER_COLORS: Record<PlanType, string | null> = {
  free: '#36e399', // No border for free plan
  starter: '#EAB308', // Yellow (Tailwind yellow-500)
  professional: '#3B82F6', // Blue (Tailwind blue-500)
  enterprise: '#EF4444', // Red (Tailwind red-500)
};

/**
 * Get the member limit for a given plan
 * @param plan - The subscription plan type
 * @returns Maximum number of members allowed
 */
export function getPlanLimit(plan: PlanType | undefined | null): number {
  return PLAN_LIMITS[plan || 'free'];
}

/**
 * Get the AI daily request limit for a given plan
 * @param plan - The subscription plan type
 * @returns Maximum number of AI requests allowed per day
 */
export function getAiDailyLimit(plan: PlanType | undefined | null): number {
  return AI_DAILY_LIMITS[plan || 'free'];
}

/**
 * Get the border color for a given plan
 * @param plan - The subscription plan type
 * @returns Border color hex string or null for no border
 */
export function getPlanBorderColor(plan: PlanType | undefined | null): string | null {
  return PLAN_BORDER_COLORS[plan || 'free'];
}

/**
 * Check if a team can accept more members based on owner's plan
 * @param currentMemberCount - Current number of team members
 * @param ownerPlan - The team owner's subscription plan
 * @returns Boolean indicating if more members can join
 */
export function canAddMember(currentMemberCount: number, ownerPlan: PlanType | undefined | null): boolean {
  const limit = getPlanLimit(ownerPlan);
  return currentMemberCount < limit;
}
