import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

/**
 * POST /api/templates/[templateId]/rate - Rate a template (1-5 stars)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const templateId = parseInt(params.templateId);
    const body = await request.json();
    const { rating, review } = body;
    const authUserId = user.id;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Verify template exists
    const { data: template, error: templateError } = await supabase
      .from('task_templates')
      .select('template_id')
      .eq('template_id', templateId)
      .single();

    if (templateError || !template) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    // Check if user already rated this template
    const { data: existingRating } = await supabase
      .from('template_ratings')
      .select('rating_id')
      .eq('template_id', templateId)
      .eq('auth_user_id', authUserId)
      .single();

    if (existingRating) {
      // Update existing rating
      const { error: updateError } = await supabase
        .from('template_ratings')
        .update({ rating, review: review || null })
        .eq('rating_id', existingRating.rating_id);

      if (updateError) throw updateError;
    } else {
      // Insert new rating
      const { error: insertError } = await supabase
        .from('template_ratings')
        .insert({
          template_id: templateId,
          auth_user_id: authUserId,
          rating,
          review: review || null,
        });

      if (insertError) throw insertError;
    }

    // Manually update the average rating (in case trigger is missing)
    const { data: ratings } = await supabase
      .from('template_ratings')
      .select('rating')
      .eq('template_id', templateId);

    if (ratings && ratings.length > 0) {
      const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
      await supabase
        .from('task_templates')
        .update({ rating_avg: Math.round(avgRating * 100) / 100 })
        .eq('template_id', templateId);
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: existingRating ? 'Rating updated' : 'Rating submitted',
      data: { rating },
    });
  } catch (error: any) {
    console.error('Error rating template:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: error.message || 'Failed to rate template' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/templates/[templateId]/rate - Get user's rating for a template
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const templateId = parseInt(params.templateId);
    const authUserId = user.id;

    // Get user's rating for this template
    const { data: ratingData } = await supabase
      .from('template_ratings')
      .select('rating, review')
      .eq('template_id', templateId)
      .eq('auth_user_id', authUserId)
      .single();

    return NextResponse.json<ApiResponse>({
      success: true,
      data: ratingData || { rating: null, review: null },
    });
  } catch (error: any) {
    console.error('Error fetching rating:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: error.message || 'Failed to fetch rating' },
      { status: 500 }
    );
  }
}
