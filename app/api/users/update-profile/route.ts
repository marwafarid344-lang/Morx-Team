import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * Update user profile - uses authenticated user's ID from session
 */
export async function PUT(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const body = await request.json();
    const { first_name, last_name, password, governorate, study_level, department, faculty, bio, skills, is_available, links, searching_teams_subjects } = body;

    if (!first_name || !last_name) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: 'first_name and last_name are required' },
        { status: 400 }
      );
    }

    // Build update object
    const updates: Record<string, any> = {
      first_name,
      last_name
    };

    if (password && password.trim() !== '') {
      const sha256Hash = crypto.createHash('sha256').update(password).digest('hex');
      const hashedPassword = await bcrypt.hash(sha256Hash, 10);
      updates.password = hashedPassword;
    }
    
    if (study_level !== undefined) {
      updates.study_level = study_level;
    }
    
    if (department !== undefined) {
      updates.department = department;
    }

    if (faculty !== undefined) {
      updates.faculty = faculty;
    }

    if (governorate !== undefined) {
      updates.governorate = governorate;
    }

    if (bio !== undefined) {
      updates.bio = bio;
    }

    if (skills !== undefined) {
      updates.skills = skills;
    }

    if (is_available !== undefined) {
      updates.is_available = is_available;
    }

    if (links !== undefined) {
      // Merge links safely: avoid overwriting existing links with empty/undefined values
      try {
        const { data: existingUserLinks } = await supabase
          .from('users')
          .select('links')
          .eq('auth_user_id', user.id)
          .single();

        const existingLinks = (existingUserLinks && existingUserLinks.links) ? existingUserLinks.links : {};
        const mergedLinks: Record<string, any> = { ...existingLinks };

        if (links && typeof links === 'object') {
          // Only copy non-empty string values from incoming links to avoid accidental deletion
          ['github', 'linkedin', 'facebook', 'whatsapp'].forEach((k) => {
            if (Object.prototype.hasOwnProperty.call(links, k) && links[k]) {
              mergedLinks[k] = links[k];
            }
          });
        }

        updates.links = mergedLinks;
      } catch (e) {
        // If merge fails for any reason, fall back to storing provided links object
        updates.links = links;
      }
    }

    if (searching_teams_subjects !== undefined) {
      updates.searching_teams_subjects = searching_teams_subjects;
    }

    // console.log('[Update Profile] Updates to apply:', updates);

    // Execute update using auth_user_id from session
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('auth_user_id', user.id)
      .select('auth_user_id, first_name, last_name, email, profile_image, governorate, study_level, department, faculty, bio, skills, is_available, links, searching_teams_subjects, created_at')
      .single();

    if (updateError) throw updateError;

    // Create notification for profile update
    const changedFields = [];
    if (first_name || last_name) changedFields.push('name');
    if (password && password.trim() !== '') changedFields.push('password');
    if (study_level !== undefined) changedFields.push('study level');
    if (department !== undefined) changedFields.push('department');
    if (faculty !== undefined) changedFields.push('faculty');

    try {
      await supabase.from('notifications').insert({
        auth_user_id: user.id,
        title: '👤 Profile Updated',
        message: `Your profile has been updated successfully.`,
        type: 'profile_update',
        is_read: false
      });
    } catch (e) {
      // Notification creation is optional
    }

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    // console.error('Update profile error:', error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
