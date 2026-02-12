'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function CommentSection({ listId }: { listId: string }) {
    const supabase = createClient()
    const [comments, setComments] = useState<any[]>([])
    const [newComment, setNewComment] = useState('')

    const fetchComments = async () => {
        const { data } = await supabase
            .from('comments')
            .select('*, profiles(username)')
            .eq('list_id', listId)
            .order('created_at', { descending: true })
        if (data) setComments(data)
    }

    useEffect(() => { fetchComments() }, [listId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return alert('로그인이 필요합니다.')

        const { error } = await supabase.from('comments').insert({
            list_id: listId,
            user_id: user.id,
            content: newComment
        })

        if (!error) {
            setNewComment('')
            fetchComments()
        }
    }

    return (
        <div className="space-y-8">
            <h3 className="text-xl font-bold italic">Comments ({comments.length})</h3>

            <form onSubmit={handleSubmit} className="flex gap-4">
                <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="리스트에 대한 코멘트를 남겨보세요!"
                    className="flex-grow p-4 bg-gray-50 rounded-xl focus:ring-2 focus:ring-black outline-none border-none"
                />
                <button className="px-6 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition">등록</button>
            </form>

            <div className="space-y-6">
                {comments.map(comment => (
                    <div key={comment.id} className="flex gap-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex-none" />
                        <div>
                            <div className="flex gap-2 items-center mb-1">
                                <span className="font-bold text-sm">{comment.profiles?.username}</span>
                                <span className="text-[10px] text-gray-400">{new Date(comment.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-gray-600 text-sm leading-relaxed">{comment.content}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}