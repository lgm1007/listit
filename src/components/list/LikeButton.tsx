'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { handleAuthError } from '@/utils/authErrorHandler'
import AuthModal from '@/src/components/AuthModal'

export default function LikeButton({ listId }: { listId: string }) {
    const supabase = createClient()
    const router = useRouter()

    const [isLiked, setIsLiked] = useState(false)
    const [likeCount, setLikeCount] = useState(0)
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

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
        // 비로그인 시 처리
        if (!user) {
            setIsAuthModalOpen(true)
            return
        }

        let result
        if (isLiked) {
            result = await supabase.from('likes').delete().eq('list_id', listId).eq('user_id', user.id)
        } else {
            result = await supabase.from('likes').insert({ list_id: listId, user_id: user.id })
        }

        if (result.error) {
            const handler = handleAuthError(result.error, router, `/list/${listId}`)
            if (handler) return // 로그인 페이지로 리다이렉팅 했으므로 종료

            alert('좋아요 처리 중 오류가 발생했습니다.')
            return
        }

        setIsLiked(!isLiked)
        setLikeCount(prev => isLiked ? prev - 1 : prev + 1)
    }

    return (
        <>
            <button
                onClick={toggleLike}
                className={`flex flex-col items-center gap-2 transition-transform active:scale-90 cursor-pointer group`}
            >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all ${isLiked ? 'bg-red-100 border-red-500 text-red-500' : 'bg-main-bg border-gray-200 text-sub-text'
                    }`}>
                    <span className="text-3xl">{isLiked ? '❤️' : '🤍'}</span>
                </div>
                <span className="font-bold text-gray-600">{likeCount}</span>
            </button>

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                nextPath={`/list/${listId}`}
            />
        </>
    )
}