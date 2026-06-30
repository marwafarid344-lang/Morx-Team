import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { supabaseAdmin as supabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

// Force read env vars
const googleClientId = process.env.GOOGLE_CLIENT_ID ?? '';
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET ?? '';
const nextAuthSecret = process.env.NEXTAUTH_SECRET;

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', credentials.email)
            .single();

          if (error || !user || !user.password) {
            return null;
          }

          // Must have auth_user_id - this is the UUID we use everywhere
          if (!user.auth_user_id) {
            return null;
          }

          // Verify password (SHA-256 + bcrypt)
          const sha256Hash = crypto.createHash('sha256').update(credentials.password).digest('hex');
          const isValidPassword = await bcrypt.compare(
            sha256Hash,
            user.password
          );

          if (!isValidPassword) {
            return null;
          }

          // Return auth_user_id (UUID) as the id - NEVER numeric user_id
          return {
            id: user.auth_user_id,  // UUID!
            email: user.email,
            name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
          };
        } catch (error) {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }: any) {
      if (account?.provider === 'google' && profile?.email) {
        try {
          // Check if user exists
          const { data: existingUser } = await supabase
            .from('users')
            .select('auth_user_id')
            .eq('email', profile.email)
            .single();

          if (!existingUser) {
            // New user via Google - store temp session and redirect to complete profile
            // Generate a UUID for the new user (will be their auth_user_id)
            const tempAuthUserId = crypto.randomUUID();
            
            const tempSession = {
              email: profile.email,
              tempFirstName: (profile.name as string || '').split(' ')[0] || '',
              tempLastName: (profile.name as string || '').split(' ').slice(1).join(' ') || '',
              profileImage: (profile as any).picture || '',
              auth_user_id: tempAuthUserId,  // Generate UUID for new user
              isTemporary: true
            };

            // Set cookie for complete-profile page
            const cookieStore = cookies();
            cookieStore.set('morx_temp_session', JSON.stringify(tempSession), {
              httpOnly: false,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 300 // 5 minutes
            });

            return '/complete-profile';
          }
          return true;
        } catch (error) {
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }: any) {
      if (user) {
        token.id = user.id;  // This is already auth_user_id (UUID) from authorize()
      }
      
      // Always ensure we have latest fields in the token if we have an email
      if (token.email) {
        const { data: dbUser } = await supabase
          .from('users')
          .select('auth_user_id, first_name, last_name, profile_image, study_level, department, faculty')
          .eq('email', token.email)
          .single();

        if (dbUser && dbUser.auth_user_id) {
          token.id = dbUser.auth_user_id;  // UUID - NEVER numeric user_id
          token.firstName = dbUser.first_name;
          token.lastName = dbUser.last_name;
          token.profileImage = dbUser.profile_image;
          token.study_level = dbUser.study_level;
          token.department = dbUser.department;
          token.faculty = dbUser.faculty;
        }
      }
      
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        (session.user as any).id = token.id;  // auth_user_id (UUID)
        (session.user as any).auth_user_id = token.id;  // Also add as auth_user_id for clarity
        (session.user as any).firstName = token.firstName;
        (session.user as any).lastName = token.lastName;
        (session.user as any).profileImage = token.profileImage;
        (session.user as any).study_level = token.study_level;
        (session.user as any).department = token.department;
        (session.user as any).faculty = token.faculty;
      }
      return session;
    },
  },
  pages: {
    signIn: '/signin',
    error: '/signin',
  },
  session: {
    strategy: 'jwt' as const,
  },
  secret: nextAuthSecret,
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
