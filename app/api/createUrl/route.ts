// api url: /api/download.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const bucket = searchParams.get('bucket') || '';
    const path = searchParams.get('path') || '';
    const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUrl(`${path}`, 60);
    return NextResponse.json(data ?? []);
}
