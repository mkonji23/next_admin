// api url: /api/listBuckets.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const bucket = searchParams.get('bucket') || '';
    const path = searchParams.get('path') || '';
    const { data } = await supabaseAdmin.storage.from(bucket).list(path);
    console.log('res', data);
    return NextResponse.json(data ?? []);
}
