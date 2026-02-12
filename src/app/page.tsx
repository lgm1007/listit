import { createClient } from '@/utils/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import SearchInput from '../components/home/SearchInput'

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
      list_items (image_url, order_no)
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

  const categories = ['전체', '여행', '데이트', '맛집', '문화·컨텐츠', '취미', '패션·뷰티', '기타']

  return (
    <main className="max-w-[1600px] mx-auto px-6 py-8">
      {/* 검색 섹션: 별도 클라이언트 컴포넌트로 분리 */}
      <section className="mb-10 space-y-6">
        <div className="max-w-2xl mx-auto">
          <SearchInput defaultValue={query} />
        </div>

        {/* 카테고리 필터링 버튼 */}
        <div className="flex flex-wrap justify-center gap-3">
          {categories.map((c) => (
            <Link
              key={c}
              href={{
                pathname: '/',
                query: {
                  category: c,
                  ...(query ? { query } : {}) // 검색어 유지
                }
              }}
              className={`px-5 py-2 rounded-full text-sm font-medium transition ${category === c
                ? 'bg-black text-white'
                : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-400'
                }`}
            >
              {c}
            </Link>
          ))}
        </div>
      </section>

      {/* 리스트 그리드 피드 */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {lists?.map((list) => {
          // profiles가 배열로 들어올 경우를 대비해 첫 번째 요소 가져오기, 객체라면 그대로 객체 사용
          const profileData = Array.isArray(list.profiles) ? list.profiles[0] : list.profiles;

          // 카테고리 별 기본 이미지 매핑용 객체
          const categoryPlaceholders: Record<string, string> = {
            '여행': '/placeholder_travel.png',
            '데이트': '/placeholder_date.png',
            '맛집': '/placeholder_food.png',
            '문화·컨텐츠': '/placeholder_content.png',
            '취미': '/placeholder_hobby.png',
            '패션·뷰티': '/placeholder_beauty.png',
            '기타': '/placeholder_guitar.png'
          };

          // order_no가 0인 이미지 찾기
          const representativeItem = list.list_items.find(item => item.order_no === 0)
          const thumbnail = representativeItem?.image_url || categoryPlaceholders[list.category || '기타']

          return (
            <Link key={list.id} href={`/list/${list.id}`} className="group cursor-pointer">
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100 mb-3">
                <Image
                  src={thumbnail}
                  alt={list.title}
                  fill
                  className="object-cover group-hover:scale-105 transition duration-300"
                />
              </div>
              <h3 className="font-bold text-gray-900 line-clamp-2 leading-tight group-hover:underline">
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
        <div className="text-center py-20 text-gray-400">
          찾으시는 리스트가 아직 없어요! 😅
        </div>
      )}
    </main>
  )
}