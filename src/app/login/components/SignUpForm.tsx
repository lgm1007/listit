'use client'

import { createClient } from '@/utils/supabase/client'
import { useState } from 'react'

/**
 * 사용자가 이메일과 비밀번호를 입력하여 새로운 계정 생성하는 컴포넌트
 */
export default function SignUpForm() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    const supabase = createClient()

    /**
     * Supabase Auth를 통해 회원가입 요청
     * 가입 후 이메일 인증이 활성화되어 있다면 인증 메일이 발송됨
     */
    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                // 회원가입 완료 후 돌아올 주소
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        })

        if (error) {
            alert(`회원가입 에러: ${error.message}`)
        } else {
            alert('회원가입 확인 메일을 보냈습니다. 이메일 함을 확인해주세요!')
        }
        setLoading(false)
    }

    return (
        <form onSubmit={handleSignUp} className="flex flex-col gap-2 w-full max-w-sm mx-auto p-4 border rounded-lg mt-4">
            <h2 className="text-xl font-bold mb-4">새 계정 만들기</h2>
            <input
                type="email"
                placeholder="이메일 주소"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border p-2 rounded text-black"
                required
            />
            <input
                type="password"
                placeholder="비밀번호 (6자 이상)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border p-2 rounded text-black"
                required
            />
            <button
                type="submit"
                disabled={loading}
                className="bg-green-600 text-white p-2 rounded hover:bg-green-700 disabled:bg-gray-400"
            >
                {loading ? '처리 중...' : '회원가입'}
            </button>
        </form>
    )
}