'use client'

import { useState, useEffect } from 'react'
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
    const updateItem = (index: number, field: keyof ListItemInput, value: string | File | null) => {
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

        // 2. 이전 미리보기 URL이 있으면 메모리에서 해제
        if (items[index].previewUrl) {
            URL.revokeObjectURL(items[index].previewUrl)
        }

        // 3. 새 미리보기 URL 생성
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
     * 컴포넌트 언마운트 시 남아있는 모든 미리보기 URL 해제
     */
    useEffect(() => {
        return () => {
            items.forEach((item) => {
                if (item.previewUrl) {
                    URL.revokeObjectURL(item.previewUrl)
                }
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    /**
     * 특정 순번의 리스트 아이템을 삭제합니다.
     */
    const removeItem = (index: number) => {
        // 최소 1개는 유지되도록 설정
        if (items.length <= 1) {
            alert('최소 한 개의 항목은 있어야 합니다.')
            return
        }
        const newItems = items.filter((_, i) => i !== index)
        setItems(newItems)
    }

    /**
     * 기존 이미지를 제거하고 초기 상태로 되돌립니다 (이미지 변경 기능의 핵심).
     */
    const removeImage = (index: number) => {
        const newItems = [...items]
        newItems[index] = { ...newItems[index], image: null, previewUrl: '' }
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
                            imageUrl = await uploadImage(compressed, user.id)
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
                        <div key={index} className="flex gap-6 relative group border-b border-gray-50 pb-12 last:border-0">
                            {/* 1. 항목 삭제 버튼 (항목이 2개 이상일 때만 표시) */}
                            {items.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeItem(index)}
                                    className="absolute -right-2 -top-2 w-7 h-7 bg-red-50 text-red-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors shadow-sm z-20"
                                    title="항목 삭제"
                                >
                                    <span className="text-lg leading-none">×</span>
                                </button>
                            )}

                            {/* 번호 표시 */}
                            <div className="flex-none w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-400">
                                {index + 1}
                            </div>

                            <div className="flex-grow space-y-4">
                                {/* 2. 이미지 업로드/변경 영역 */}
                                <div className="relative w-full aspect-video bg-gray-50 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 transition-all">
                                    {item.previewUrl ? (
                                        <div className="relative w-full h-full group">
                                            <img src={item.previewUrl} className="w-full h-full object-cover" alt="미리보기" />

                                            {/* 이미지 컨트롤 버튼: 항상 보이거나 마우스 오버 시 더 선명하게 */}
                                            <div className="absolute bottom-4 right-4 flex gap-2">
                                                <label
                                                    htmlFor={`file-${index}`}
                                                    className="px-3 py-2 bg-white/90 backdrop-blur shadow-sm rounded-lg text-xs font-bold cursor-pointer hover:bg-white transition"
                                                >
                                                    이미지 변경
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(index)}
                                                    className="px-3 py-2 bg-red-500/90 backdrop-blur shadow-sm text-white rounded-lg text-xs font-bold hover:bg-red-600 transition"
                                                >
                                                    삭제
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <label
                                            htmlFor={`file-${index}`}
                                            className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition"
                                        >
                                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mb-2">
                                                <span className="text-gray-500 text-xl">+</span>
                                            </div>
                                            <span className="text-gray-400 text-sm font-medium">이미지 추가</span>
                                        </label>
                                    )}

                                    {/* 파일 인풋은 항상 연결 상태 유지 */}
                                    <input
                                        type="file"
                                        id={`file-${index}`}
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => handleImageChange(index, e)}
                                    />
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
                                    rows={4}
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