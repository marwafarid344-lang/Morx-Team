import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';
import { decodeContent } from '@/lib/utils/contentEncoding';

export async function GET(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('user_id') || user.id;

    // 1. Fetch user skills
    let { data: skills, error: skillsError } = await supabase
      .from('user_skills')
      .select('*')
      .eq('auth_user_id', targetUserId);

    if (skillsError) throw skillsError;

    // 2. Fetch User DNA for confidence score weightings
    const { data: dna } = await supabase
      .from('user_dna')
      .select('deadline_reliability, preferred_role')
      .eq('auth_user_id', targetUserId)
      .single();

    const reliability = dna?.deadline_reliability || 70;

    // If no skills exist, seed default skills based on role
    if (!skills || skills.length === 0) {
      const defaultRole = dna?.preferred_role || 'Developer';
      let seedSkills = ['Collaboration', 'Problem Solving'];
      
      if (defaultRole.toLowerCase().includes('design')) {
        seedSkills.push('UI/UX Design', 'CSS/Figma');
      } else if (defaultRole.toLowerCase().includes('backend') || defaultRole.toLowerCase().includes('data')) {
        seedSkills.push('Databases', 'API Integration', 'Node.js');
      } else {
        seedSkills.push('Frontend Dev', 'React/Next.js', 'JavaScript');
      }

      const seedRows = seedSkills.map(s => ({
        auth_user_id: targetUserId,
        skill_name: s,
        experience_points: 150,
        level: 1,
        confidence_score: Math.min(100, Math.max(30, 45 + Math.round((reliability - 50) * 0.5)))
      }));

      await supabase.from('user_skills').insert(seedRows);
      skills = seedRows;
    }

    // 3. Generate Skill progression history & timelines (synthesized for cost efficiency)
    const timeline = skills.map((s, idx) => ({
      date: new Date(Date.now() - (4 - idx) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      skill: s.skill_name,
      xp_gained: 50,
      total_xp: s.experience_points
    }));

    // Find hidden talents (skills with high levels but outside target role)
    const primaryRoleWord = (dna?.preferred_role || 'Developer').split(' ')[0].toLowerCase();
    const hiddenTalents = skills
      .filter(s => {
        const name = s.skill_name.toLowerCase();
        // If it does not belong to primary role but level is decent
        return !name.includes(primaryRoleWord) && s.experience_points >= 100;
      })
      .map(s => s.skill_name);

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        skills,
        timeline,
        hidden_talents: hiddenTalents.slice(0, 2),
        global_confidence: Math.round(reliability)
      }
    });

  } catch (error: any) {
    console.error('User skills error:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// POST endpoint to manually or automatically award XP to a user's skills
export async function POST(request: NextRequest) {
  const user = await requireAuth(request);
  if (user instanceof NextResponse) return user;

  try {
    const body = await request.json();
    const { task_title, task_desc } = body;
    const userId = user.id;

    if (!task_title) {
      return NextResponse.json<ApiResponse>({ success: false, error: 'task_title is required' }, { status: 400 });
    }

    // Determine skill category from keywords
    let skillAwarded = 'Collaboration';
    const decodedTitle = decodeContent(task_title);
    const decodedDesc = decodeContent(task_desc || '');
    const text = `${decodedTitle} ${decodedDesc}`.toLowerCase();

    if (text.includes('design') || text.includes('ui') || text.includes('figma') || text.includes('css') || text.includes('theme') || text.includes('style')) {
      skillAwarded = 'UI/UX Design';
    } else if (text.includes('database') || text.includes('sql') || text.includes('api') || text.includes('backend') || text.includes('route') || text.includes('post')) {
      skillAwarded = 'API & Backend';
    } else if (text.includes('react') || text.includes('next') || text.includes('component') || text.includes('page') || text.includes('state')) {
      skillAwarded = 'Frontend Dev';
    } else if (text.includes('test') || text.includes('bug') || text.includes('fix') || text.includes('debug')) {
      skillAwarded = 'Problem Solving';
    }

    // Upsert skill
    const { data: existingSkill } = await supabase
      .from('user_skills')
      .select('*')
      .eq('auth_user_id', userId)
      .eq('skill_name', skillAwarded)
      .single();

    const currentXp = existingSkill?.experience_points || 0;
    const currentLevel = existingSkill?.level || 1;
    const newXp = currentXp + 100;
    
    // Level up check
    const newLevel = Math.floor(newXp / 300) + 1;

    // Calculate confidence score (factoring in some DNA reliability if exists)
    const { data: dna } = await supabase
      .from('user_dna')
      .select('deadline_reliability')
      .eq('auth_user_id', userId)
      .single();

    const reliability = dna?.deadline_reliability || 70;
    const confidence = Math.min(100, Math.max(30, 45 + Math.round((reliability - 50) * 0.5) + newLevel * 5));

    const updatedSkill = {
      auth_user_id: userId,
      skill_name: skillAwarded,
      experience_points: newXp,
      level: newLevel,
      confidence_score: confidence,
      updated_at: new Date().toISOString()
    };

    await supabase.from('user_skills').upsert(updatedSkill);

    // Also award Gamification XP!
    const { data: gamification } = await supabase
      .from('user_gamification')
      .select('*')
      .eq('auth_user_id', userId)
      .single();

    const currentGlobalXp = gamification?.xp || 0;
    const currentGlobalLevel = gamification?.level || 1;
    const newGlobalXp = currentGlobalXp + 50; // 50 XP per completed task
    const newGlobalLevel = Math.floor(newGlobalXp / 500) + 1;

    await supabase.from('user_gamification').upsert({
      auth_user_id: userId,
      xp: newGlobalXp,
      level: newGlobalLevel,
      updated_at: new Date().toISOString()
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: `Successfully awarded 100 XP to skill "${skillAwarded}" and 50 XP globally!`,
      data: {
        skill: updatedSkill,
        level_up: newLevel > currentLevel || newGlobalLevel > currentGlobalLevel
      }
    });

  } catch (error: any) {
    console.error('Award skills error:', error);
    return NextResponse.json<ApiResponse>({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
