'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'

export default function CommentSection({ listId }: { listId: string }) {
    const supabase = createClient()
    const [comments, setComments] = useState<any[]>([])
    const [newComment, setNewComment] = useState('')
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

    // 수정 모드 상태
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editContent, setEditContent] = useState('')

    const fetchComments = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUserId(user?.id || null)

        const { data } = await supabase
            .from('comments')
            .select('*, profiles(username, avatar_url)')
            .eq('list_id', listId)
            .order('created_at', { ascending: true })
        if (data) setComments(data)
    }

    useEffect(() => { fetchComments() }, [listId])

    // 댓글 등록
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!currentUserId) return alert('로그인이 필요합니다.')
        if (!newComment.trim()) return

        const { error } = await supabase.from('comments').insert({
            list_id: listId,
            user_id: currentUserId,
            content: newComment
        })

        if (!error) {
            setNewComment('')
            fetchComments()
        }
    }

    // 댓글 삭제
    const handleDelete = async (commentId: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return

        const { error } = await supabase
            .from('comments')
            .delete()
            .eq('id', commentId)
            .eq('user_id', currentUserId)
        if (error) alert('삭제 실패: ' + error.message)
        else fetchComments()
    }

    // 댓글 수정 저장
    const handleUpdate = async (commentId: string) => {
        if (!editContent.trim()) return

        const { error } = await supabase
            .from('comments')
            .update({ content: editContent })
            .eq('id', commentId)
            .eq('user_id', currentUserId)

        if (error) {
            alert('수정 실패: ' + error.message)
        } else {
            setEditingId(null)
            fetchComments()
        }
    }

    return (
        <div className="space-y-8">
            <h3 className="text-xl font-bold italic">Comments ({comments.length})</h3>

            {/* 등록 폼 */}
            <form onSubmit={handleSubmit} className="flex gap-4">
                <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="리스트에 대한 생각을 남겨보세요!"
                    className="flex-grow p-4 bg-gray-50 rounded-xl focus:ring-2 focus:ring-black outline-none border-none transition"
                />
                <button className="px-6 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition cursor-pointer">등록</button>
            </form>

            {/* 댓글 목록 */}
            <div className="space-y-8">
                {comments.map(comment => (
                    <div key={comment.id} className="flex gap-4 group">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex-none overflow-hidden relative border border-gray-50">
                            {comment.profiles?.avatar_url ? (
                                <Image
                                    src={comment.profiles.avatar_url}
                                    alt={`${comment.profiles.username}의 아바타`}
                                    fill
                                    className="object-cover"
                                    sizes="40px"
                                />
                            ) : (
                                // 이미지가 없을 때 보여줄 기본 UI
                                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                    </svg>
                                </div>
                            )}
                        </div>

                        <div className="flex-grow">
                            <div className="flex justify-between items-center mb-1">
                                <div className="flex gap-2 items-center">
                                    <span className="font-bold text-sm">{comment.profiles?.username}</span>
                                    <span className="text-[10px] text-gray-400">
                                        {new Date(comment.created_at).toLocaleDateString()}
                                    </span>
                                </div>

                                {/* 본인 댓글일 때 & 수정 중이 아닐 때만 수정/삭제 버튼 노출 */}
                                {currentUserId === comment.user_id && editingId !== comment.id && (
                                    <div className="flex gap-3 text-xs text-gray-400">
                                        <button
                                            onClick={() => { setEditingId(comment.id); setEditContent(comment.content); }}
                                            className="hover:text-black transition cursor-pointer"
                                        >수정</button>
                                        <button
                                            onClick={() => handleDelete(comment.id)}
                                            className="hover:text-red-500 transition cursor-pointer"
                                        >삭제</button>
                                    </div>
                                )}
                            </div>

                            {/* 수정 중 여부에 따른 댓글 수정 폼 렌더링 */}
                            {editingId === comment.id ? (
                                <div className="mt-2 space-y-2">
                                    <textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="w-full p-3 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-black"
                                        rows={3}
                                    />
                                    <div className="flex gap-2 justify-end">
                                        <button onClick={() => setEditingId(null)} className="px-3 py-1 text-xs text-gray-500 cursor-pointer">취소</button>
                                        <button onClick={() => handleUpdate(comment.id)} className="px-3 py-1 text-xs bg-black text-white rounded-md cursor-pointer">저장</button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                                    {comment.content}
                                </p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}