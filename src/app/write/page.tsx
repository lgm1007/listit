'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { uploadImage } from '@/utils/supabase/storage'
import { saveList } from './action'
import { compressImage } from '@/utils/imageControl'
import { handleAuthError } from '@/utils/authErrorHandler'
import { CATEGORY_NAMES } from '../../constants/categories'

interface ListItemInput {
    title: string
    content: string
    images: File[]
    previewUrls: string[]
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
        { title: '', content: '', images: [], previewUrls: [] }
    ])

    /**
     * 새로운 리스트 아이템 입력 칸 추가
     */
    const addItem = () => {
        setItems([...items, { title: '', content: '', images: [], previewUrls: [] }])
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
     * 다중 이미지 선택 처리
     */
    const handleImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        // 1. 파일 선택되었는지 확인
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return;

        const currentItem = items[index]

        // 2. 이미지 장수 5장 제한 체크
        if (currentItem.images.length + files.length > 5) {
            alert('이미지는 최대 5장까지만 업로드할 수 있습니다.')
            return
        }

        // 3. 새 미리보기 URL 생성
        const newPreviewUrls = files.map(file => URL.createObjectURL(file))

        // 4. 기존 updateItem 함수를 사용해 image와 previewUrl을 동시에 업데이트
        const newItems = [...items]
        newItems[index] = {
            ...currentItem,
            images: [...currentItem.images, ...files],
            previewUrls: [...currentItem.previewUrls, ...newPreviewUrls]
        }
        setItems(newItems)

        // 같은 파일을 다시 선택할 수 있도록 target 초기화
        e.target.value = ''
    }

    /**
     * 특정 이미지 삭제
     */
    const removeSpecificImage = (itemIndex: number, imgIndex: number) => {
        const newItems = [...items]
        const targetItem = newItems[itemIndex]

        // 메모리 해제
        URL.revokeObjectURL(targetItem.previewUrls[imgIndex])

        // 이미지와 미리보기 URL 필터링하여 제외
        targetItem.images = targetItem.images.filter((_, i) => i !== imgIndex)
        targetItem.previewUrls = targetItem.previewUrls.filter((_, i) => i !== imgIndex)

        setItems(newItems)
    }

    /**
     * 아이템 제거
     */
    const removeItem = (index: number) => {
        if (items.length <= 1) return
        items[index].previewUrls.forEach(url => URL.revokeObjectURL(url))
        setItems(items.filter((_, i) => i !== index))
    }

    /**
     * 컴포넌트 언마운트 시 미리보기 URL 메모리 해제
     */
    useEffect(() => {
        return () => {
            items.forEach(item => item.previewUrls.forEach(url => URL.revokeObjectURL(url)))
        }
    }, [])

    /**
     * 전체 데이터를 저장하는 핵심 핸들러
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (isSubmitting) return

        setIsSubmitting(true)

        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser()

            // 1. 초기 유저 체크 시 에러 핸들링
            if (userError || !user) {
                handleAuthError({ status: 401 }, router, '/write')
                return
            }

            // 2. 이미지 업로드 병렬 처리
            const itemDataForServer = await Promise.all(
                items.map(async (item, idx) => {
                    const uploadedUrls = await Promise.all(
                        item.images.map(async (file) => {
                            const compressed = await compressImage(file)
                            return await uploadImage(compressed, user.id)
                        })
                    )
                    return {
                        title: item.title,
                        content: item.content,
                        image_urls: uploadedUrls, // 서버 RPC에서 요구하는 키 이름
                        order_no: idx
                    }
                })
            )

            // 3. 서버 액션 호출하여 DB 저장
            const result = await saveList(title, category, itemDataForServer)

            if (result.success) {
                alert('리스트가 등록되었습니다.')
                router.push('/')
            }

        } catch (error: any) {
            console.error(error)
            alert('저장 중 오류가 발생했습니다.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <main className="max-w-3xl mx-auto py-10 px-4">
            <form onSubmit={handleSubmit} className="space-y-8">
                {/* 메인 리스트 정보 (기존과 동일) */}
                <section className="space-y-4">
                    <input
                        type="text"
                        placeholder="제목을 입력해주세요"
                        className="w-full text-3xl font-bold border-none focus:ring-0 placeholder:text-gray-300"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                    <div className="flex gap-2 flex-wrap">
                        {CATEGORY_NAMES.filter(name => name !== '전체').map((cat) => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => setCategory(cat)}
                                className={`px-4 py-1.5 rounded-full text-sm border transition ${category === cat ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
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
                        <div key={index} className="flex gap-4 relative border-b border-gray-50 pb-12 last:border-0">
                            {/* 항목 삭제 버튼 */}
                            {items.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeItem(index)}
                                    className="absolute -right-2 -top-2 w-7 h-7 bg-red-50 text-red-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition shadow-sm z-30"
                                >
                                    ×
                                </button>
                            )}

                            <div className="flex-none w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold text-sm">
                                {index + 1}
                            </div>

                            <div className="flex-grow space-y-4 overflow-hidden">
                                {/* 다중 이미지 업로드 UI */}
                                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                    {/* 기존 이미지 미리보기 카드들 */}
                                    {item.previewUrls.map((url, imgIdx) => (
                                        <div key={imgIdx} className="relative w-40 h-40 flex-none rounded-2xl overflow-hidden border border-gray-100">
                                            <img src={url} className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removeSpecificImage(index, imgIdx)}
                                                className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black transition"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}

                                    {/* 이미지 추가 버튼 (5장 미만일 때만 표시) */}
                                    {item.images.length < 5 && (
                                        <label className="w-40 h-40 flex-none bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition group">
                                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition">
                                                <span className="text-gray-500 text-xl">+</span>
                                            </div>
                                            <span className="text-gray-400 text-xs font-bold">
                                                {item.images.length}/5
                                            </span>
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => handleImageChange(index, e)}
                                            />
                                        </label>
                                    )}
                                </div>

                                <input
                                    type="text"
                                    placeholder="항목의 제목을 적어주세요"
                                    className="w-full text-xl font-bold border-none focus:ring-0 p-0"
                                    value={item.title}
                                    onChange={(e) => updateItem(index, 'title', e.target.value)}
                                    required
                                />
                                <textarea
                                    placeholder="상세 내용을 입력하세요 (선택 사항)"
                                    className="w-full border-none focus:ring-0 resize-none text-gray-600 p-0"
                                    rows={3}
                                    value={item.content}
                                    onChange={(e) => updateItem(index, 'content', e.target.value)}
                                />
                            </div>
                        </div>
                    ))}
                </section>

                {/* 하단 버튼 (기존과 유사) */}
                <div className="flex flex-col gap-4 pt-10">
                    <button
                        type="button"
                        onClick={addItem}
                        className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 hover:border-gray-400 transition font-bold"
                    >
                        + 항목 추가하기
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full py-4 rounded-xl font-bold text-lg transition ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800 shadow-lg'
                            }`}
                    >
                        {isSubmitting ? '리스트를 만드는 중...' : '리스트 등록 완료'}
                    </button>
                </div>
            </form>
        </main>
    )
}