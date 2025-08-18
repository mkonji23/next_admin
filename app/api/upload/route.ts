// api url: /api/download.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function POST(request: Request) {
    const req = await request.json();
    console.log('req', req);
    const { data, error } = await supabaseAdmin.storage
        .from(req?.bucket)
        .upload(req?.path, req?.file, { cacheControl: '3600', upsert: false });
    return NextResponse.json(data ?? []);
}
