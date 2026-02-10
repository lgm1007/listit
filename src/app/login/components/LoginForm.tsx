'use client'

import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
                router.push('/')
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

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    // 인증 완료 후 위에서 만든 callback 라우트로 돌아오기
                    redirectTo: `${window.location.origin}/auth/callback`,
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
        <div className="flex flex-col gap-4 w-full max-w-sm mx-auto p-6 bg-white shadow-md rounded-xl">
            <h1 className="text-2xl font-bold text-center text-gray-800">리스팃 로그인</h1>

            {errorMessage && (
                <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {errorMessage}
                </div>
            )}

            <form onSubmit={handleEmailLogin} className="flex flex-col gap-3">
                <input
                    type="email"
                    placeholder="이메일"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border p-3 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                />
                <input
                    type="password"
                    placeholder="비밀번호"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border p-3 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400"
                >
                    {loading ? '로그인 중...' : '이메일 로그인'}
                </button>
            </form>

            <div className="relative flex py-3 items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink mx-4 text-gray-400 text-sm">또는</span>
                <div className="flex-grow border-t border-gray-200"></div>
            </div>

            <button
                onClick={handleGoogleLogin}
                className="border border-gray-300 p-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition text-gray-700"
            >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                구글로 계속하기
            </button>
        </div>
    )
}