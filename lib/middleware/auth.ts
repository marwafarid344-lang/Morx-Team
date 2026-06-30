import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabaseAdmin as supabase } from '@/lib/supabase';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string; // UUID - ALWAYS a UUID, never numeric
    email: string;
    name: string;
  };
}

export async function requireAuth(request: NextRequest) {
  
  const session = await getServerSession(authOptions);
  
  // Check NextAuth session first
  if (session?.user) {
    const potentialId = (session.user as any).auth_user_id || (session.user as any).id;
    

    // Valid UUID check: Must have dashes and be long enough
    if (potentialId && typeof potentialId === 'string' && potentialId.includes('-') && potentialId.length >= 32) {
      return {
        id: potentialId,
        email: session.user.email || '',
        name: session.user.name || '',
      };
    }
  }

  // Fallback: Check for custom morx_session cookie
  const morxSession = request.cookies.get('morx_session');
  
  if (morxSession) {
    try {
      const userData = JSON.parse(decodeURIComponent(morxSession.value));
      
      // If we have auth_user_id (UUID), use it
      if (userData?.auth_user_id && typeof userData.auth_user_id === 'string' && userData.auth_user_id.includes('-')) {
        return {
          id: userData.auth_user_id,
          email: userData.email || '',
          name: `${userData.first_name || userData.firstName || ''} ${userData.last_name || userData.lastName || ''}`.trim(),
        };
      }

      // SELF-HEALING: If we have an email but no valid auth_user_id, fetch it from DB
      if (userData?.email) {
        const { data: dbUser } = await supabase
          .from('users')
          .select('auth_user_id, first_name, last_name, profile_image, plan, created_at')
          .eq('email', userData.email)
          .single();

        if (dbUser?.auth_user_id) {
          const healedUser = {
            id: dbUser.auth_user_id,
            email: userData.email,
            name: `${dbUser.first_name || ''} ${dbUser.last_name || ''}`.trim(),
            // Meta-info for withAuth to update cookie
            _healed: true,
            _fullData: {
              auth_user_id: dbUser.auth_user_id,
              first_name: dbUser.first_name,
              last_name: dbUser.last_name,
              email: userData.email,
              profile_image: dbUser.profile_image,
              created_at: dbUser.created_at,
              isLoggedIn: true
            }
          };
          return healedUser;
        }
      }
    } catch (e) {
    }
  }

  return NextResponse.json(
    { success: false, error: 'Unauthorized - Please login again' },
    { status: 401 }
  );
}

/**
 * Higher-order function to wrap API handlers with authentication
 */
export function withAuth(
  handler: (
    request: NextRequest,
    context: any,
    user: any
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: any) => {
    const user = await requireAuth(request);

    if (user instanceof NextResponse) {
      return user; // Return the error response
    }

    const response = await handler(request, context, user);

    // If session was self-healed, persist the result back to the cookie
    if ((user as any)._healed && (user as any)._fullData) {
      response.cookies.set('morx_session', JSON.stringify((user as any)._fullData), {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 1 week
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
    }

    return response;
  };
}
