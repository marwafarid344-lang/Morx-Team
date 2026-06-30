import { createClient } from '@supabase/supabase-js';

// Admin client with service role key for API routes
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      fetch: (url, options = {}) => {
        return fetch(url, {
          ...options,
          // Increase timeout to 30 seconds
          signal: AbortSignal.timeout(30000)
        });
      }
    },
    db: {
      schema: 'public'
    }
  }
);

// Re-export for convenience
export { supabaseAdmin as supabase };
