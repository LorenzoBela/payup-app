import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// Client for server-side operations
export const supabaseAdmin = (() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // Only create the client if we have the keys (prevents build time errors in some contexts, though typical server usage ensures variables)
    if (!supabaseUrl || !supabaseServiceKey) {
        // In edge cases or build time, we might not want to throw immediately if not used, 
        // but generally for admin usage we expect it to be present.
        // We'll let it throw natural validation errors if accessed.
    }

    return createClient<Database>(
        supabaseUrl,
        supabaseServiceKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );
})();
