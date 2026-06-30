import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const body = await request.json();
    const { project_id, reviewee_id, ratings } = body;
    const reviewerId = user.id;

    if (!project_id || !reviewee_id || !ratings) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Missing required parameters' }, { status: 400 });
    }

    if (reviewerId === reviewee_id) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'You cannot rate yourself' }, { status: 400 });
    }

    // 1. Verify that both users are on the same team/project (Fake rating prevention)
    const { data: project } = await supabase
      .from('projects')
      .select('team_id')
      .eq('project_id', project_id)
      .single();

    if (!project) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Project not found' }, { status: 404 });
    }

    const { data: reviewerMembership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', project.team_id)
      .eq('auth_user_id', reviewerId)
      .single();

    const { data: revieweeMembership } = await supabase
      .from('team_members')
      .select('role')
      .eq('team_id', project.team_id)
      .eq('auth_user_id', reviewee_id)
      .single();

    if (!reviewerMembership || !revieweeMembership) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'Both reviewer and reviewee must belong to the project team' }, { status: 403 });
    }

    // Extract rating parameters (1-5 range)
    const { leadership, communication, reliability, quality, problem_solving, teamwork } = ratings;

    // 2. Insert or update teammate rating
    const ratingData = {
      project_id,
      reviewer_id: reviewerId,
      reviewee_id: reviewee_id,
      leadership: Math.max(1, Math.min(5, leadership || 3)),
      communication: Math.max(1, Math.min(5, communication || 3)),
      reliability: Math.max(1, Math.min(5, reliability || 3)),
      quality: Math.max(1, Math.min(5, quality || 3)),
      problem_solving: Math.max(1, Math.min(5, problem_solving || 3)),
      teamwork: Math.max(1, Math.min(5, teamwork || 3))
    };

    const { error: ratingError } = await supabase
      .from('teammate_ratings')
      .upsert(ratingData, { onConflict: 'project_id,reviewer_id,reviewee_id' });

    if (ratingError) throw ratingError;

    // 3. Evolve User DNA with verified teammate rating (Weighted moving average)
    const { data: existingDna } = await supabase
      .from('user_dna')
      .select('*')
      .eq('auth_user_id', reviewee_id)
      .single();

    if (existingDna) {
      const scaleRating = (val: number) => val * 20; // convert 1-5 to 0-100 scale

      const updatedDna = {
        auth_user_id: reviewee_id,
        leadership_score: Math.round((existingDna.leadership_score * 0.7) + (scaleRating(ratingData.leadership) * 0.3)),
        communication_style: ratingData.communication >= 4 ? 'Expressive' : existingDna.communication_style,
        deadline_reliability: Math.round((existingDna.deadline_reliability * 0.7) + (scaleRating(ratingData.reliability) * 0.3)),
        collaboration_score: Math.round((existingDna.collaboration_score * 0.7) + (scaleRating(ratingData.teamwork) * 0.3)),
        consistency: Math.round((existingDna.consistency * 0.8) + (scaleRating(ratingData.quality) * 0.2)),
        updated_at: new Date().toISOString()
      };

      await supabase.from('user_dna').upsert(updatedDna);
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Teammate rating submitted and DNA evolved successfully!'
    });

  } catch (error: any) {
    console.error('Teammate rating error:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
