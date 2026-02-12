import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import LikeButton from '@/src/components/list/LikeButton'
import CommentSection from '@/src/components/list/CommentSection'

export default async function ListDetailPage({ params }: { params: { id: string } }) {
    const { id } = await params
    const supabase = await createClient()

    // 1. 리스트 상세 데이터 가져오기 (Join 활용)
    const { data: list, error } = await supabase
        .from('lists')
        .select(`
      *,
      profiles (username, avatar_url),
      list_items (*)
    `)
        .eq('id', id)
        .single()

    if (error || !list) return notFound()

    // 2. 아이템 정렬 (order_no 순)
    const sortedItems = list.list_items.sort((a: any, b: any) => a.order_no - b.order_no)

    return (
        <main className="max-w-3xl mx-auto px-6 py-12">
            {/* 헤더 섹션 */}
            <header className="mb-12 text-center">
                <span className="inline-block px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-bold mb-4">
                    {list.category}
                </span>
                <h1 className="text-4xl font-black mb-6 leading-tight">{list.title}</h1>
                <div className="flex items-center justify-center gap-3 text-sm text-gray-600">
                    <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden relative">
                        {list.profiles?.avatar_url && (
                            <Image src={list.profiles.avatar_url} alt="avatar" fill className="object-cover" />
                        )}
                    </div>
                    <span className="font-semibold">{list.profiles?.username}</span>
                    <span className="text-gray-300">|</span>
                    <span>{new Date(list.created_at).toLocaleDateString()}</span>
                </div>
            </header>

            {/* 리스트 아이템 섹션 */}
            <section className="space-y-16 mb-20">
                {sortedItems.map((item: any, index: number) => (
                    <div key={item.id} className="group">
                        <div className="flex items-center gap-4 mb-6">
                            <span className="flex-none w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-black text-lg">
                                {index + 1}
                            </span>
                            <h2 className="text-2xl font-bold">{item.title}</h2>
                        </div>

                        {item.image_url && (
                            <div className="relative aspect-video rounded-3xl overflow-hidden mb-6 bg-gray-50 border border-gray-100">
                                <Image src={item.image_url} alt={item.title} fill className="object-cover" />
                            </div>
                        )}

                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap pl-14">
                            {item.content}
                        </p>
                    </div>
                ))}
            </section>

            <hr className="border-gray-100 mb-10" />

            {/* 소셜 액션 섹션 (좋아요/공유 등) */}
            <section className="flex flex-col items-center gap-8 mb-20">
                <LikeButton listId={id} />
            </section>

            {/* 댓글 섹션 */}
            <section>
                <CommentSection listId={id} />
            </section>
        </main>
    )
}