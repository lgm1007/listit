/**
 * 사용자가 페이지 이동 시마다 로그인 세션 갱신, 로그인이 필요한 페이지 접근 제어
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * 모든 요청에 대해 실행되며, Supabase 세션 확인/갱신
 * 또한 특정 경로(예: 글쓰기 페이지)에 대한 접근 권한 제어
 */
export async function middleware(request: NextRequest) {
    const response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // Supabase 서버 클라이언트 초기화
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    // 요청 객체에 쿠키 추가 (이후 서버 컴포넌트에서 읽을 수 있도록)
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    // 기존 응답 객체에 쿠키 추가
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // 현재 로그인된 사용자 정보 가져오기 (세션 갱신 포함)
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // [보안 로직 추가]
    // 로그인이 필요한 특정 경로(예: /write)에 비로그인 사용자가 접근하면 로그인 페이지로 리다이렉트
    if (!user && request.nextUrl.pathname.startsWith('/write')) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    return response
}

/**
 * 미들웨어가 실행될 경로 지정
 * 이미지, 파비콘 등 정적 파일에는 실행되지 않도록 설정
 */
export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}