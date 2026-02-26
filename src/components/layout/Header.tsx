'use client'

import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import ThemeToggle from '@/src/components/ThemeToggle'

interface HeaderProps {
    userProfile: {
        username: string | null
        avatar_url: string | null
    } | null
}

/**
 * 상단 내비게이션 바 컴포넌트
 * 로고, 글쓰기 버튼, 유저 정보(닉네임) 또는 로그인 버튼 표시
 */
export default function Header({ userProfile }: HeaderProps) {
    const supabase = createClient()
    const router = useRouter()

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
        <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
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
                    <span className="text-xl font-bold tracking-tighter text-gray-900">리스팃</span>
                </Link>

                {/* 메뉴 영역 */}
                <nav className="flex items-center gap-6">
                    {userProfile ? (
                        <>
                            <Link
                                href="/write"
                                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition"
                            >
                                글쓰기
                            </Link>
                            <div className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                                <span className="text-sm font-semibold text-gray-700">
                                    {userProfile.username || '사용자'}님
                                </span>
                                <button
                                    onClick={handleLogout}
                                    className="text-xs text-gray-400 hover:text-red-500 transition cursor-pointer hover:underline"
                                >
                                    로그아웃
                                </button>
                            </div>
                        </>
                    ) : (
                        <Link
                            href="/login"
                            className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition"
                        >
                            시작하기
                        </Link>
                    )}
                    <ThemeToggle />
                </nav>
            </div>
        </header>
    )
}