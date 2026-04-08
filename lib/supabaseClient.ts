import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SECRET_API_KEY || 'placeholder-key';

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
