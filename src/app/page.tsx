import { createClient } from '@/utils/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import SearchInput from '../components/home/SearchInput'
import { CATEGORY_NAMES, CATEGORY_IMAGE } from '../constants/categories'

/**
 * 메인 페이지: 리스트 검색, 카테고리 필터링, 그리드 피드 제공
 */
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; category?: string }>
}) {
  const { query: searchQuery, category: selectedCategory } = await searchParams
  const supabase = await createClient()

  const query = searchQuery || ''
  const category = selectedCategory || '전체'

  // 1. Supabase 쿼리 빌드
  let dbQuery = supabase
    .from('lists')
    .select(`
      id,
      title,
      category,
      profiles (username),
      list_items (
        order_no,
        item_images (
          image_url,
          order_no
        )
      )
    `)
    .order('created_at', { ascending: false })

  // 2. 검색어 필터링 (TODO: 나중에 OpenSearch로 확장 가능)
  if (query) {
    dbQuery = dbQuery.ilike('title', `%${query}%`)
  }

  // 3. 카테고리 필터링
  if (category !== '전체') {
    dbQuery = dbQuery.eq('category', category)
  }

  const { data: lists, error } = await dbQuery

  return (
    <main className="max-w-[1600px] mx-auto px-6 py-8">
      {/* 검색 섹션: 별도 클라이언트 컴포넌트로 분리 */}
      <section className="mb-10 space-y-6">
        <div className="max-w-2xl mx-auto">
          <SearchInput defaultValue={query} />
        </div>

        {/* 카테고리 필터링 버튼 */}
        <div className="flex flex-wrap justify-center gap-3">
          {CATEGORY_NAMES.map((cat) => (
            <Link
              key={cat}
              href={{
                pathname: '/',
                query: {
                  category: cat,
                  ...(query ? { query } : {}) // 검색어 유지
                }
              }}
              className={`px-5 py-2 rounded-full text-sm font-medium transition ${category === cat
                ? 'bg-main-text text-main-bg'
                : 'bg-main-bg border border-border text-main-text hover:border-sub-text'
                }`}
            >
              {cat}
            </Link>
          ))}
        </div>
      </section>

      {/* 리스트 그리드 피드 */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {lists?.map((list) => {
          const profileData = Array.isArray(list.profiles) ? list.profiles[0] : list.profiles;

          /**
           * 썸네일 결정 로직:
           * 1. 리스트의 첫 번째 아이템(list_items의 order_no === 0)을 찾습니다.
           * 2. 그 아이템의 첫 번째 이미지(item_images의 order_no === 0)를 찾습니다.
           */
          const firstItem = list.list_items.find(item => item.order_no === 0)
          const firstImage = firstItem?.item_images?.find(img => img.order_no === 0)

          const thumbnail = firstImage?.image_url || CATEGORY_IMAGE[list.category || '기타']

          return (
            <Link key={list.id} href={`/list/${list.id}`} className="group cursor-pointer">
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100 mb-3">
                <Image
                  src={thumbnail}
                  alt={list.title}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 20vw, 15vw"
                  className="object-cover group-hover:scale-105 transition duration-300"
                />
              </div>
              <h3 className="font-bold text-sub-text line-clamp-2 leading-tight group-hover:underline">
                {list.title}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                by {profileData?.username || '익명'}
              </p>
            </Link>
          )
        })}
      </section>

      {lists?.length === 0 && (
        <div className="text-center py-20 text-border">
          찾으시는 리스트가 아직 없어요! 😅
        </div>
      )}
    </main>
  )
}