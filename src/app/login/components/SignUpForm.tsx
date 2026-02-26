'use client'

import { createClient } from '@/utils/supabase/client'
import { useState, useRef } from 'react'

/**
 * 사용자가 이메일과 비밀번호를 입력하여 새로운 계정 생성하는 컴포넌트
 */
export default function SignUpForm() {
    const [email, setEmail] = useState('')
    const passwordRef = useRef<HTMLInputElement>(null) // useRef로 리렌더링 방지 및 평문 노출 방지
    const confirmPasswordRef = useRef<HTMLInputElement>(null)
    const [loading, setLoading] = useState(false)   // 비동기 작업이 진행 중인지 여부 boolean 상태값
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    const supabase = createClient()

    // 비밀번호 정책: 영문자 + 숫자 조합 필수, 특수기호 선택
    const PASSWORD_MIN_LENGTH = 8
    const HAS_LETTER = /[a-zA-Z]/       // 영문자(대소문자 구분 없이) 최소 1자
    const HAS_NUMBER = /[0-9]/          // 숫자 최소 1자

    /**
     * Supabase Auth를 통해 회원가입 요청
     * 가입 후 이메일 인증이 활성화되어 있다면 인증 메일이 발송됨
     */
    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrorMessage(null)

        const password = passwordRef.current?.value || ''
        const confirmPassword = confirmPasswordRef.current?.value || ''

        // 비밀번호 정책 검증
        if (password.length < PASSWORD_MIN_LENGTH) {
            setErrorMessage(`비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`)
            return
        }

        if (!HAS_LETTER.test(password)) {
            setErrorMessage('비밀번호에 영문자가 최소 1자 포함되어야 합니다.')
            return
        }

        if (!HAS_NUMBER.test(password)) {
            setErrorMessage('비밀번호에 숫자가 최소 1자 포함되어야 합니다.')
            return
        }

        // 비밀번호 일치 여부 확인
        if (password !== confirmPassword) {
            setErrorMessage('비밀번호가 일치하지 않습니다.')
            return
        }

        // 유효성 검사 통과 후 로딩 시작
        setLoading(true)
        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    // 회원가입 완료 후 돌아올 주소
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            })

            if (error) {
                setErrorMessage(`회원가입 에러: ${error.message}`)
            } else {
                setSuccessMessage('회원가입 확인 메일을 보냈습니다. 이메일 함을 확인해주세요')
            }
        } finally {
            // 로딩 종료
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSignUp} className="flex flex-col gap-2 w-full max-w-sm mx-auto p-4 border border-border bg-card-bg rounded-lg mt-4">
            <h2 className="text-xl font-bold mb-2 text-main-text">새 계정 만들기</h2>

            {errorMessage && (
                <div className="bg-red-500/10 border border-red-500/50 text-error px-4 py-2 rounded-lg text-sm">
                    {errorMessage}
                </div>
            )}

            {successMessage && (
                <div className="bg-green-500/10 border border-green-500/50 text-success px-4 py-2 rounded-lg text-sm">
                    {successMessage}
                </div>
            )}

            <input
                type="email"
                placeholder="이메일 주소"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-main-bg border border-border p-3 rounded text-main-text focus:outline-none focus:ring-2 focus:ring-green-500"
                required
            />
            <input
                type="password"
                placeholder="비밀번호 (영문 + 숫자 조합, 8자 이상)"
                ref={passwordRef}
                className="bg-main-bg border border-border p-3 rounded text-main-text focus:outline-none focus:ring-2 focus:ring-green-500"
                required
                autoComplete="new-password" // 기존 비밀번호 자동완성 방지 및 새 비밀번호 저장 제안 받기
            />
            <input
                type="password"
                placeholder="비밀번호 확인"
                ref={confirmPasswordRef}
                className="bg-main-bg border border-border p-3 rounded text-main-text focus:outline-none focus:ring-2 focus:ring-green-500"
                required
                autoComplete="new-password"
            />
            <button
                type="submit"
                disabled={loading}  // 비동기 응답을 기다리는 동안 버튼 비활성화
                className="bg-green-600 text-white p-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-zinc-500 mt-2 cursor-pointer"
            >
                {loading ? '처리 중...' : '회원가입'}
            </button>
        </form>
    )
}