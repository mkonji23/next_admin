// api url: /api/download.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function POST(request: Request) {
    const body = await request.json();
    const { data, error } = await supabaseAdmin.storage.from(body?.bucket).download(body?.path);

    const arrayBuffer = await data?.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer!);
    const fileName = body.path.split('/').pop() || 'downloaded_file';
    return new Response(buffer, {
        status: 200,
        headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${fileName}"`
        }
    });
}
