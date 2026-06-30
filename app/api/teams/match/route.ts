import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

export async function GET(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('team_id');

    if (!teamId) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'team_id is required' }, { status: 400 });
    }

    // 1. Fetch team details
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select('team_id, team_name, required_skills, description, created_by')
      .eq('team_id', teamId)
      .single();

    if (teamError || !team) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Team not found' }, { status: 404 });
    }

    // 2. Fetch current team members to check previous collaboration and roles
    const { data: currentMembers } = await supabase
      .from('team_members')
      .select('auth_user_id, role')
      .eq('team_id', teamId);

    const memberIds = currentMembers?.map((m: any) => m.auth_user_id) || [];

    // 3. Fetch all other users (candidates)
    const { data: candidates, error: candidatesError } = await supabase
      .from('users')
      .select('auth_user_id, first_name, last_name, email, profile_image, skills, is_available')
      .neq('auth_user_id', user.id) // exclude current user if needed, or keep
      .limit(10); // get a list of potential candidates for match preview

    if (candidatesError) throw candidatesError;

    // 4. Fetch DNA profiles for candidates and current team members to compute balance
    const candidateIds = candidates?.map((c: any) => c.auth_user_id) || [];
    
    let candidateDnas: Record<string, any> = {};
    if (candidateIds.length > 0) {
      const { data: dnas } = await supabase
        .from('user_dna')
        .select('*')
        .in('auth_user_id', candidateIds);

      dnas?.forEach((d: any) => {
        candidateDnas[d.auth_user_id] = d;
      });
    }

    // Compute matches
    const matches = candidates?.map((candidate: any) => {
      const dna = candidateDnas[candidate.auth_user_id] || {
        leadership_score: 50,
        execution_speed: 55,
        consistency: 60,
        deadline_reliability: 65,
        collaboration_score: 50,
        learning_speed: 60,
        preferred_working_hours: { start: '09:00', end: '17:00' },
        communication_style: 'Collaborative',
        preferred_role: 'Developer',
        preferred_technologies: []
      };

      // Match skills
      const teamReqSkills = Array.isArray(team.required_skills) 
        ? team.required_skills 
        : (typeof team.required_skills === 'string' ? JSON.parse(team.required_skills || '[]') : []);
      
      const candidateSkills = Array.isArray(candidate.skills)
        ? candidate.skills
        : (typeof candidate.skills === 'string' ? JSON.parse(candidate.skills || '[]') : []);

      const matchingSkills = candidateSkills.filter((s: string) => 
        teamReqSkills.some((req: string) => req.toLowerCase() === s.toLowerCase())
      );

      const skillsScore = teamReqSkills.length > 0 
        ? (matchingSkills.length / teamReqSkills.length) * 100 
        : 60; // baseline if team doesn't list skills

      // Availability Score
      const availabilityScore = candidate.is_available ? 100 : 30;

      // Reliability Score
      const reliabilityScore = dna.deadline_reliability;

      // Collaboration & Working Hours Score
      const collaborationScore = dna.collaboration_score;

      // Compatibility calculations
      const rawScore = (skillsScore * 0.35) + (availabilityScore * 0.20) + (reliabilityScore * 0.25) + (collaborationScore * 0.20);
      const compatibilityScore = Math.min(100, Math.max(30, Math.round(rawScore)));

      // Strengths, Weaknesses, Risks, Reasons
      const strengths: string[] = [];
      const weaknesses: string[] = [];
      const risks: string[] = [];
      const reasons: string[] = [];

      // Strengths & Reasons
      if (matchingSkills.length > 0) {
        strengths.push(`Matches critical skills: ${matchingSkills.join(', ')}`);
        reasons.push(`Possesses ${matchingSkills.length} required skill(s) for the team.`);
      }
      if (dna.deadline_reliability > 80) {
        strengths.push(`High deadline reliability (${Math.round(dna.deadline_reliability)}%)`);
        reasons.push("Outstanding record for completing tasks on schedule.");
      }
      if (dna.execution_speed > 80) {
        strengths.push(`Fast execution speed (${Math.round(dna.execution_speed)}%)`);
      }
      if (dna.leadership_score > 75) {
        strengths.push("Strong leadership qualities");
      }

      // Weaknesses & Risks
      if (matchingSkills.length === 0 && teamReqSkills.length > 0) {
        weaknesses.push("Does not possess the specified core required skills");
        risks.push("May require onboarding and learning time for team tech stack.");
      }
      if (dna.deadline_reliability < 60) {
        weaknesses.push("Historically slower task completion times");
        risks.push("Risk of missed sprint milestones based on reliability records.");
      }
      if (!candidate.is_available) {
        weaknesses.push("Currently marked as not available for new teams");
        risks.push("Potential scheduling conflicts due to existing commitments.");
      }
      if (dna.consistency < 55) {
        weaknesses.push("Variable weekly contribution patterns");
      }

      // Default elements if lists are empty
      if (strengths.length === 0) strengths.push("Adaptable generalist work style");
      if (weaknesses.length === 0) weaknesses.push("None identified");
      if (risks.length === 0) risks.push("Low-risk profile");
      if (reasons.length === 0) reasons.push("General profile aligns with standard collaborative practices.");

      return {
        candidate: {
          auth_user_id: candidate.auth_user_id,
          first_name: candidate.first_name,
          last_name: candidate.last_name,
          email: candidate.email,
          profile_image: candidate.profile_image,
          preferred_role: dna.preferred_role
        },
        compatibility_score: compatibilityScore,
        reasons: reasons.slice(0, 3),
        risks: risks.slice(0, 2),
        strengths: strengths.slice(0, 3),
        weaknesses: weaknesses.slice(0, 2)
      };
    }) || [];

    // Sort by compatibility score descending
    matches.sort((a: any, b: any) => b.compatibility_score - a.compatibility_score);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: matches
    });

  } catch (error: any) {
    console.error('Smart matching error:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
