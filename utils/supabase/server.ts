/**
 * 서버 컴포넌트, API 라우트, 미들웨어에서 사용할 Supabase 클라이언트 설정
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * 서버 컴포넌트 및 서버 액션에서 사용할 Supabase 클라이언트 생성
 * 쿠키를 통해 사용자의 세션 관리
 */
export const createClient = async () => {
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // 서버 컴포넌트에서 쿠키를 수정하려고 할 때 발생하는 에러는 무시
                        // 이 처리는 미들웨어에서 별도로 수행됨
                    }
                },
            },
        }
    )
}