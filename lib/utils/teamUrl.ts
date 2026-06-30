// Updated for Supabase
import crypto from 'crypto';
import { supabaseAdmin as supabase } from '../supabase';

/**
 * Generates a random 16-digit team URL
 * @returns A promise that resolves to a unique 16-digit string
 */
export async function generateTeamUrl(): Promise<string> {
  let teamUrl: string;
  let isUnique = false;

  while (!isUnique) {
    // Generate 16-digit random number
    const randomNumber = crypto.randomInt(1000000000000000, 10000000000000000);
    teamUrl = randomNumber.toString();

    // Check if this URL already exists in the database
    const { data: existingTeam } = await supabase
      .from('teams')
      .select('team_url')
      .eq('team_url', teamUrl)
      .single();

    if (!existingTeam) {
      isUnique = true;
      return teamUrl;
    }
  }

  throw new Error('Failed to generate unique team URL');
}

/**
 * Generates a random project URL (similar to team URL)
 * @returns A promise that resolves to a unique 16-digit string
 */
export async function generateProjectUrl(): Promise<string> {
  let projectUrl: string;
  let isUnique = false;

  while (!isUnique) {
    // Generate 16-digit random number
    const randomNumber = crypto.randomInt(1000000000000000, 10000000000000000);
    projectUrl = randomNumber.toString();

    // Check if this URL already exists in the database
    const { data: existingProject } = await supabase
      .from('projects')
      .select('project_url')
      .eq('project_url', projectUrl)
      .single();

    if (!existingProject) {
      isUnique = true;
      return projectUrl;
    }
  }

  throw new Error('Failed to generate unique project URL');
}
