// api url: /api/listBuckets.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function GET() {
    const { data } = await supabaseAdmin.storage.listBuckets();
    return NextResponse.json(data ?? []);
}
