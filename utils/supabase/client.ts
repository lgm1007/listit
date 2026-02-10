import { createBrowserClient } from '@supabase/ssr'

/**
 * 브라우저(클라이언트 컴포넌트)에서 사용할 Supabase 클라이언트 생성 (싱글톤으로 유지)
 * 호출할 때마다 새 클라이언트를 생성하면 상태 유실 가능성
 */
export const createClient = (() => {
    let client: ReturnType<typeof createBrowserClient>
    return () => {
        // Supabase Client가 이미 생성되어 있으면 재사용
        if (!client) {
            client = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            )
        }
        return client
    }
})()