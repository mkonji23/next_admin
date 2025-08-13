import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SECRET_API_KEY! // 서버 전용 비밀키
);
