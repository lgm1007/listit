'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function LikeButton({ listId }: { listId: string }) {
    const supabase = createClient()
    const [isLiked, setIsLiked] = useState(false)
    const [likeCount, setLikeCount] = useState(0)

    useEffect(() => {
        const fetchLikeData = async () => {
            const userPromise = supabase.auth.getUser()
            // 좋아요 개수 확인
            const countPromise = supabase
                .from('likes')
                .select('*', { count: 'exact' })
                .eq('list_id', listId)

            // 사용자 정보 가져오기 & 좋아요 개수 확인은 서로 의존성이 없으므로 Promise.all로 병렬 실행
            const [{ data: { user } }, { count }] = await Promise.all([userPromise, countPromise])

            setLikeCount(count || 0)

            if (user) {
                // 내가 좋아요 했는지 확인
                const { data } = await supabase
                    .from('likes')
                    .select('*')
                    .eq('list_id', listId)
                    .eq('user_id', user.id)
                    .single()
                if (data) setIsLiked(true)
            }
        }
        fetchLikeData()
    }, [listId])

    const toggleLike = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return alert('로그인이 필요합니다.')

        if (isLiked) {
            await supabase.from('likes').delete().eq('list_id', listId).eq('user_id', user.id)
            setLikeCount(prev => prev - 1)
        } else {
            await supabase.from('likes').insert({ list_id: listId, user_id: user.id })
            setLikeCount(prev => prev + 1)
        }
        setIsLiked(!isLiked)
    }

    return (
        <button
            onClick={toggleLike}
            className={`flex flex-col items-center gap-2 transition-transform active:scale-90 cursor-pointer group`}
        >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all ${isLiked ? 'bg-red-50 border-red-500 text-red-500' : 'bg-white border-gray-200 text-gray-400'
                }`}>
                <span className="text-3xl">{isLiked ? '❤️' : '🤍'}</span>
            </div>
            <span className="font-bold text-gray-600">{likeCount}</span>
        </button>
    )
}