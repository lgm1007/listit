'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { uploadImage } from '@/utils/supabase/storage'
import { saveList } from './action'
import { compressImage } from '@/utils/imageControl'

interface ListItemInput {
    title: string
    content: string
    image: File | null
    previewUrl: string
}

/**
 * 리스트와 하위 리스트 아이템들을 한꺼번에 등록하는 페이지
 */
export default function WritePage() {
    const router = useRouter()
    const supabase = createClient()

    // 1. 메인 리스트 상태
    const [title, setTitle] = useState('')
    const [category, setCategory] = useState('기타')
    const [description, setDescription] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // 2. 하위 리스트 아이템 상태 (기본 1개 포함)
    const [items, setItems] = useState<ListItemInput[]>([
        { title: '', content: '', image: null, previewUrl: '' }
    ])

    /**
     * 새로운 리스트 아이템 입력 칸 추가
     */
    const addItem = () => {
        setItems([...items, { title: '', content: '', image: null, previewUrl: '' }])
    }

    /**
     * 특정 순번의 리스트 아이템 값 수정
     */
    const updateItem = (index: number, field: keyof ListItemInput, value: any) => {
        const newItems = [...items]
        newItems[index] = { ...newItems[index], [field]: value }
        setItems(newItems)
    }

    /**
     * 이미지 선택 시 미리보기 URL 생성
     */
    const handleImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        // 1. 파일 선택되었는지 확인
        const file = e.target.files?.[0];
        if (!file) return;

        // 2. 파일 객체를 상태에 저장
        const url = URL.createObjectURL(file);

        // 3. 기존 updateItem 함수를 사용해 image와 previewUrl을 동시에 업데이트
        const newItems = [...items]
        newItems[index] = {
            ...newItems[index],
            image: file,
            previewUrl: url
        }
        setItems(newItems)
    }

    /**
     * 전체 데이터를 저장하는 핵심 핸들러
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (isSubmitting) return

        setIsSubmitting(true)

        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return alert('로그인이 필요합니다.')

            // 1. 이미지 업로드 병렬 처리
            const itemDataWithUrls = await Promise.all(
                items.map(async (item, index) => {
                    let imageUrl = null

                    if (item.image) {
                        try {
                            // 이미지 업로드 전 이미지 압축 진행
                            const compressed = await compressImage(item.image)
                            // 압축된 이미지를 업로드 함수로 전달
                            imageUrl = await uploadImage(compressed as File, user.id)
                        } catch (error: any) {
                            console.error(`이미지 업로드 실패:`, error.message)
                        }
                    }
                    return {
                        title: item.title,
                        content: item.content,
                        image_url: imageUrl,
                        order_no: index
                    }
                })
            )

            // 2. 서버 액션 호출하여 DB 저장
            await saveList(title, category, itemDataWithUrls)

        } catch (error: any) {
            console.error('Error saving list:', error)
            alert('리스트 저장 중 오류가 발생했습니다.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <main className="max-w-3xl mx-auto py-10 px-4">
            <form onSubmit={handleSubmit} className="space-y-8">
                {/* 메인 리스트 정보 섹션 */}
                <section className="space-y-4">
                    <input
                        type="text"
                        placeholder="제목을 입력해주세요"
                        className="w-full text-3xl font-bold border-none focus:ring-0 placeholder:text-gray-300"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                    <div className="flex gap-2">
                        {['여행', '데이트', '맛집', '문화·컨텐츠', '취미', '패션·뷰티', '기타'].map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setCategory(cat)}
                                className={`px-4 py-1.5 rounded-full text-sm border ${category === cat ? 'bg-black text-white' : 'bg-white text-gray-500'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </section>

                <hr className="border-gray-100" />

                {/* 아이템 리스트 섹션 */}
                <section className="space-y-12">
                    {items.map((item, index) => (
                        <div key={index} className="flex gap-6 group">
                            <div className="flex-none w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-400">
                                {index + 1}
                            </div>

                            <div className="flex-grow space-y-4">
                                {/* 이미지 업로드 영역 */}
                                <div className="relative w-full aspect-video bg-gray-50 rounded-xl overflow-hidden border-2 border-dashed border-gray-200 hover:border-gray-400 transition">
                                    {item.previewUrl ? (
                                        <img src={item.previewUrl} className="w-full h-full object-cover" alt="미리보기" />
                                    ) : (
                                        <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
                                            <span className="text-gray-400 text-sm">이미지 추가</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                id={`file-${index}`}
                                                onChange={(e) => handleImageChange(index, e)}
                                            />
                                        </label>
                                    )}
                                </div>

                                <input
                                    type="text"
                                    placeholder="아이템 제목"
                                    className="w-full text-xl font-semibold border-none focus:ring-0"
                                    value={item.title}
                                    onChange={(e) => updateItem(index, 'title', e.target.value)}
                                    required
                                />
                                <textarea
                                    placeholder="설명을 입력하세요 (선택 사항)"
                                    className="w-full border-none focus:ring-0 resize-none text-gray-600"
                                    rows={2}
                                    value={item.content}
                                    onChange={(e) => updateItem(index, 'content', e.target.value)}
                                />
                            </div>
                        </div>
                    ))}
                </section>

                {/* 추가 및 제출 버튼 */}
                <div className="flex flex-col gap-4 pt-10">
                    <button
                        type="button"
                        onClick={addItem}
                        className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:bg-gray-50 transition font-medium"
                    >
                        + 항목 추가하기
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 bg-black text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition"
                    >
                        {isSubmitting ? '저장 중...' : '리스트 등록하기'}
                    </button>
                </div>
            </form>
        </main>
    )
}