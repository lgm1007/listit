import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import LikeButton from '@/src/components/list/LikeButton'
import CommentSection from '@/src/components/list/CommentSection'
import ImageSlider from '@/src/components/list/ImageSlider'

export default async function ListDetailPage({ params }: { params: { id: string } }) {
    const { id } = await params
    const supabase = await createClient()

    // 1. 리스트 상세 데이터 가져오기 (Join 활용)
    const { data: list, error } = await supabase
        .from('lists')
        .select(`
          *,
          profiles (nickname, avatar_url),
          list_items (
            *,
            item_images (*) 
          )
        `)
        .eq('id', id)
        .single()

    if (error || !list) return notFound()

    // 2. 아이템 정렬 (order_no 순)
    const sortedItems = [...list.list_items].sort((a, b) => a.order_no - b.order_no)

    return (
        <main className="max-w-3xl mx-auto px-6 py-12">
            {/* 헤더 섹션 (기존과 동일) */}
            <header className="mb-12 text-center">
                <span className="inline-block px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-bold mb-4">
                    {list.category}
                </span>
                <h1 className="text-4xl text-main-text font-black mb-6 leading-tight">{list.title}</h1>
                <div className="flex items-center justify-center gap-3 text-sm text-gray-600">
                    <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden relative">
                        {list.profiles?.avatar_url && (
                            <Image src={list.profiles.avatar_url} alt="avatar" fill className="object-cover" />
                        )}
                    </div>
                    <span className="font-semibold text-sub-text">{list.profiles?.nickname}</span>
                    <span className="text-gray-300">|</span>
                    <span className="text-sub-text">{new Date(list.created_at).toLocaleDateString()}</span>
                </div>
            </header>

            {/* 리스트 아이템 섹션 */}
            <section className="space-y-24 mb-20">
                {sortedItems.map((item, index: number) => {
                    // 해당 아이템의 이미지들 정렬
                    const itemImages = [...(item.item_images || [])].sort((a, b) => a.order_no - b.order_no)

                    return (
                        <div key={item.id} className="group">
                            <div className="flex items-center gap-4 mb-6">
                                <span className="flex-none w-10 h-10 bg-main-text text-main-bg rounded-full flex items-center justify-center font-black text-lg shadow-lg">
                                    {index + 1}
                                </span>
                                <h2 className="text-2xl text-main-text font-bold tracking-tight">{item.title}</h2>
                            </div>

                            {/* 슬라이더 적용 */}
                            <ImageSlider images={itemImages} title={item.title} />

                            <p className="text-main-text leading-relaxed whitespace-pre-wrap pl-0 md:pl-14 text-lg">
                                {item.content}
                            </p>
                        </div>
                    )
                })}
            </section>

            <hr className="border-border mb-10" />

            <section className="flex flex-col items-center gap-8 mb-20">
                <LikeButton listId={id} />
            </section>

            <section>
                <CommentSection listId={id} />
            </section>
        </main>
    )
}