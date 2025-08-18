// api url: /api/listBuckets.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function POST(request: Request) {
    const body = await request.json();
    console.log('body', body);
    // const { data, error } = await supabaseAdmin
    // .storage
    // .from(body?.bucket)
    // .upload('public/avatar1.png', body.file, {
    //     cacheControl: '3600',
    //     upsert: false
    // })
    return NextResponse.json(body ?? []);
}
