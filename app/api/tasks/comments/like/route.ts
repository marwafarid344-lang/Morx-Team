import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

/**
 * Like/Unlike a comment (toggle)
 */
export async function POST(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const body = await request.json();
    const { comment_id } = body;
    const authUserId = user.id;

    if (!comment_id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'comment_id is required' },
        { status: 400 }
      );
    }

    // Check if user already liked this comment - Using auth_user_id
    const { data: existingLike } = await supabase
      .from('comment_likes')
      .select('like_id')
      .eq('comment_id', comment_id)
      .eq('auth_user_id', authUserId)
      .single();

    let liked = false;

    if (existingLike) {
      // User already liked - UNLIKE
      await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', comment_id)
        .eq('auth_user_id', authUserId);

      // Decrement likes counter
      const { data: comment } = await supabase
        .from('task_comments')
        .select('likes')
        .eq('comment_id', comment_id)
        .single();

      const currentLikes = comment?.likes || 0;
      await supabase
        .from('task_comments')
        .update({ likes: Math.max(0, currentLikes - 1) })
        .eq('comment_id', comment_id);

      liked = false;
    } else {
      // User hasn't liked - LIKE
      await supabase
        .from('comment_likes')
        .insert({
          comment_id,
          auth_user_id: authUserId
        });

      // Increment likes counter
      const { data: comment } = await supabase
        .from('task_comments')
        .select('likes')
        .eq('comment_id', comment_id)
        .single();

      const currentLikes = comment?.likes || 0;
      await supabase
        .from('task_comments')
        .update({ likes: currentLikes + 1 })
        .eq('comment_id', comment_id);

      liked = true;
    }

    // Get updated likes count
    const { data: updated } = await supabase
      .from('task_comments')
      .select('likes')
      .eq('comment_id', comment_id)
      .single();

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        liked,
        likes: updated?.likes || 0
      }
    });

  } catch (error) {
    console.error('Like comment error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Check if user has liked a comment
 */
export async function GET(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('comment_id');
    const authUserId = user.id;

    if (!commentId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'comment_id is required' },
        { status: 400 }
      );
    }

    // Check if user liked this comment
    const { data: existingLike } = await supabase
      .from('comment_likes')
      .select('like_id')
      .eq('comment_id', commentId)
      .eq('auth_user_id', authUserId)
      .single();

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        liked: !!existingLike
      }
    });

  } catch (error) {
    console.error('Check like status error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
