import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Lazy-loaded client to prevent build-time initialization errors
let _supabaseAdmin: SupabaseClient<Database> | null = null;

// Client for server-side operations (lazy-loaded)
export const supabaseAdmin = new Proxy({} as SupabaseClient<Database>, {
  get(_, prop) {
    if (!_supabaseAdmin) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Missing Supabase environment variables');
      }
      
      _supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
    }
    return (_supabaseAdmin as unknown as Record<string, unknown>)[prop as string];
  }
});

// Client for client-side operations (with user context)
export const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
};

