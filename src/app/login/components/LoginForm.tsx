'use client'

import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'

/**
 * 사용자 로그인을 담당하는 클라이언트 컴포넌트
 */
export default function LoginForm() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)   // 에러 메시지 상태 관리

    const router = useRouter()
    // 클라이언트용 Supabase 객체 생성 (client.ts는 동기 방식)
    const supabase = createClient()

    // 현재 URL에서 'next' 파라미터 추출 (로그인 성공 후 돌아갈 페이지)
    const searchParams = useSearchParams()
    const nextParam = searchParams.get('next') || '/' // 없으면 메인으로

    // Open Redirect 방어: 내부 경로만 허용
    // - '/'로 시작해야 함 (상대 경로만 허용)
    // - '//'로 시작하면 프로토콜 상대 URL이므로 차단 (예: //attacker.com)
    // - '@' 문자가 포함되면 차단 (예: /login@attacker.com)
    const isSafePath = nextParam.startsWith('/') && !nextParam.startsWith('//') && !nextParam.includes('@')
    const next = isSafePath ? nextParam : '/'

    /**
     * 이메일과 비밀번호로 로그인 수행
     */
    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setErrorMessage(null)

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                setErrorMessage(`로그인 실패: ${error.message}`)
            } else {
                // 로그인 성공 시 메인 페이지로 이동하고 페이지를 새로고침하여 세션 반영
                router.push(next)
                router.refresh()
            }
        } finally {
            setLoading(false)
        }
    }

    /**
     * 구글 OAuth 로그인 시작
     */
    const handleGoogleLogin = async () => {
        setLoading(true)
        setErrorMessage(null)

        const redirectURL = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    // 인증 완료 후 위에서 만든 callback 라우트로 돌아오기
                    redirectTo: redirectURL,
                },
            })

            if (error) {
                setErrorMessage(`구글 로그인 에러: ${error.message}`)
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col gap-4 w-full max-w-sm mx-auto p-6 bg-card-bg shadow-xl rounded-2xl border border-border">
            <h1 className="text-2xl font-bold text-center text-main-text">리스팃 로그인</h1>

            {errorMessage && (
                <div className="bg-red-500/10 border border-red-500/50 text-error px-4 py-3 rounded-lg text-sm">
                    {errorMessage}
                </div>
            )}

            <form onSubmit={handleEmailLogin} className="flex flex-col gap-3">
                <input
                    type="email"
                    placeholder="이메일"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-main-bg border border-border p-3 rounded-lg text-main-text focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    required
                />
                <input
                    type="password"
                    placeholder="비밀번호"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-main-bg border border-border p-3 rounded-lg text-main-text focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    required
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-zinc-500 cursor-pointer"
                >
                    {loading ? '로그인 중...' : '이메일 로그인'}
                </button>
            </form>

            <div className="relative flex py-3 items-center">
                <div className="flex-grow border-t border-border"></div>
                <span className="flex-shrink mx-4 text-sub-text text-sm">또는</span>
                <div className="flex-grow border-t border-border"></div>
            </div>

            <button
                onClick={handleGoogleLogin}
                className="bg-main-bg border border-border p-3 rounded-lg flex items-center justify-center gap-2 hover:bg-zinc-200 transition text-main-text cursor-pointer"
            >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                구글로 계속하기
            </button>
        </div>
    )
}