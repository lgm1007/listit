'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'
import { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import ThemeToggle from '@/src/components/ThemeToggle'

interface HeaderProps {
    userProfile: {
        nickname: string | null
        avatar_url: string | null
    } | null
}

/**
 * 상단 내비게이션 바 컴포넌트
 * 로고, 글쓰기 버튼, 유저 정보(닉네임) 또는 로그인 버튼 표시
 */
export default function Header({ userProfile }: HeaderProps) {
    // 실시간 유저 상태 관리
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        // 1. 초기 세션 체크
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            setUser(session?.user ?? null)
            setLoading(false)
        }
        checkUser()

        // 2. 인증 상태 변경 감지 (로그인/로그아웃 시 즉시 반영)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
            setUser(session?.user ?? null)
            // 인증 상태가 변하면 로딩 상태 해제
            setLoading(false)
        })

        return () => subscription.unsubscribe()
    }, [supabase])

    /**
   * 로그아웃 핸들러
   * 세션 삭제, 메인 페이지로 이동하도록 처리
   */
    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut()

        if (error) {
            console.error('로그아웃 중 에러 발생:', error.message)
            return
        }

        // 페이지를 새로고침하고 메인 페이지로 이동
        router.push('/')
        router.refresh()
    }

    return (
        // sticky, top-0, z-50: 스크롤 시 헤더가 상단에 고정되도록 설정
        <header className="border-b border-gray-200 bg-main-bg sticky top-0 z-50 transition-colors">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                {/* 로고 영역 */}
                <Link href="/" className="flex items-center gap-2">
                    <Image
                        src="/logo.png"
                        alt="List-it 로고"
                        width={40}
                        height={40}
                        className="object-contain"
                    />
                    <span className="text-xl font-bold tracking-tighter text-main-text">리스팃</span>
                </Link>

                {/* 메뉴 영역 */}
                <nav className="flex items-center gap-6">
                    {/* 로딩 중일 때는 깜빡임 방지를 위해 아무것도 렌더링하지 않거나 스켈레톤을 둡니다. */}
                    {!loading && (
                        <>
                            {user ? (
                                <>
                                    <Link
                                        href="/write"
                                        className="text-sm font-medium text-sub-text hover:text-main-text transition"
                                    >
                                        글쓰기
                                    </Link>
                                    <Link
                                        href="/mypage"
                                        className="text-sm font-medium text-sub-text hover:text-main-text transition"
                                    >
                                        마이페이지
                                    </Link>

                                    {/* 유저 닉네임 칩 UI 유지 */}
                                    <div className="flex items-center gap-3 bg-card-bg px-3 py-1.5 rounded-full border border-border">
                                        {/* 아바타가 있다면 작게 보여주는 것도 좋겠네요! */}
                                        {userProfile?.avatar_url && (
                                            <div className="w-5 h-5 rounded-full overflow-hidden border border-border">
                                                <img src={userProfile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <span className="text-sm font-semibold text-main-text">
                                            {userProfile?.nickname || '사용자'}님
                                        </span>
                                        <button
                                            onClick={handleLogout}
                                            className="text-xs text-sub-text hover:text-error transition cursor-pointer hover:underline"
                                        >
                                            로그아웃
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <Link
                                    href="/login"
                                    className="bg-main-text text-main-bg px-5 py-2 rounded-full text-sm font-bold hover:opacity-90 transition shadow-sm"
                                >
                                    시작하기
                                </Link>
                            )}
                        </>
                    )}
                    <ThemeToggle />
                </nav>
            </div>
        </header>
    )
}