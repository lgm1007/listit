'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

export default function SearchInput({ defaultValue }: { defaultValue: string }) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [text, setText] = useState(defaultValue)

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()

        // 현재 URL의 카테고리 상태를 유지하면서 검색어만 변경
        const params = new URLSearchParams(searchParams.toString())
        if (text) {
            params.set('query', text)
        } else {
            params.delete('query')
        }

        router.push(`/?${params.toString()}`)
    }

    return (
        <form onSubmit={handleSearch}>
            <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="어떤 리스트를 찾으시나요?"
                className="w-full px-6 py-4 bg-gray-100 border-none rounded-2xl focus:ring-2 focus:ring-black transition outline-none"
            />
        </form>
    )
}