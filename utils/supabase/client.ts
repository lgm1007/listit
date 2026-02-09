import { createBrowserClient } from '@supabase/ssr'

/**
 * 브라우저(클라이언트 컴포넌트)에서 사용할 Supabase 클라이언트 생성
 * 싱글톤 패턴처럼 활용하여 DB와 인증 기능에 접근 가능
 */
export const createClient = () =>
    createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )