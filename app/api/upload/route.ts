// api url: /api/download.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function POST(request: Request) {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = formData.get('bucket') as string;
    const path = formData.get('path') as string;
    const { data, error } = await supabaseAdmin.storage
        .from(bucket)
        .upload(path, file, { cacheControl: '3600', upsert: false });
    if (error) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
}
