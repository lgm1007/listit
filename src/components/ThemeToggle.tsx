'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

/**
 * 테마 토글 버튼
 * @returns 
 */
export default function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    // 클라이언트 사이드에서만 렌더링되도록 처리 (Hydration 에러 방지)
    useEffect(() => setMounted(true), [])

    if (!mounted) return <div className="w-9 h-9" /> // 빈 공간 유지

    return (
        <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg bg-gray-100 dark:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Toggle Dark Mode"
        >
            {theme === 'dark' ? (
                <span className="text-yellow-400">☀️</span>
            ) : (
                <span className="text-gray-700">🌙</span>
            )}
        </button>
    )
}