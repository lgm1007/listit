import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * 소셜 로그인 또는 이메일 인증 후 리다이렉트 시 실행되는 핸들러
 */
export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)

    // Next.js 15 이상 환경에서는 searchParams를 다룰 때 런타임 에러 방지를 위해 명시적으로 값을 추출함
    const code = searchParams.get('code')
    const nextParam = searchParams.get('next') ?? '/'

    // Open Redirect 방어: 내부 경로만 허용
    // - '/'로 시작해야 함 (상대 경로만 허용)
    // - '//'로 시작하면 프로토콜 상대 URL이므로 차단 (예: //attacker.com)
    // - '@' 문자가 포함되면 차단 (예: /login@attacker.com)
    const isSafePath = nextParam.startsWith('/') && !nextParam.startsWith('//') && !nextParam.includes('@')
    const next = isSafePath ? nextParam : '/'

    if (code) {
        // server.ts에서 만든 비동기 createClient await로 호출
        const supabase = await createClient()

        // 인증 코드를 세션으로 교환
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // 인증 실패 시 로그인 페이지로 리다이렉트
    return NextResponse.redirect(`${origin}/login?message=auth-failed`)
}