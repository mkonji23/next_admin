import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { code } = await request.json();

        if (!code) {
            return NextResponse.json({ error: 'Code is required' }, { status: 400 });
        }

        // NEXT_PUBLIC_ prefixes are used to share these between client and server if needed
        const KAKAO_CLIENT_ID = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID || '82c0e86b245749f7ba36a73a6a908a73';
        const KAKAO_CLIENT_SECRET = process.env.NEXT_PUBLIC_KAKAO_CLIENT_SECRET || ''; // This stays on the server
        const KAKAO_REDIRECT_URI =
            process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI || 'http://localhost:4000/auth/kakao/callback';

        const params = new URLSearchParams();
        params.append('grant_type', 'authorization_code');
        params.append('client_id', KAKAO_CLIENT_ID);
        params.append('redirect_uri', KAKAO_REDIRECT_URI);
        params.append('code', code);

        if (KAKAO_CLIENT_SECRET) {
            params.append('client_secret', KAKAO_CLIENT_SECRET);
        }

        const response = await fetch('https://kauth.kakao.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
            },
            body: params.toString()
        });

        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Kakao Token Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
