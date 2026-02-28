'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { uploadImage } from '@/utils/supabase/storage'
import { updateList } from './action'
import { compressImage } from '@/utils/imageControl'
import { handleAuthError } from '@/utils/authErrorHandler'
import { CATEGORY_NAMES } from '../../../constants/categories'
import ErrorModal from '@/src/components/ErrorModal'

interface EditItemInput {
    title: string
    content: string
    existingImageUrls: string[]   // 기존 서버에 저장된 이미지 URL
    newImages: File[]             // 새로 추가할 이미지 파일
    newPreviewUrls: string[]      // 새 이미지 미리보기 URL
}

/**
 * 리스트 수정 페이지
 * 기존 데이터를 불러와 수정 후 저장
 */
export default function EditPage() {
    const router = useRouter()
    const params = useParams()
    const listId = params.id as string
    const supabase = createClient()

    const [errorModal, setErrorModal] = useState({
        isOpen: false,
        title: '',
        message: ''
    })

    const showError = (message: string, title: string = "알림") => {
        setErrorModal({
            isOpen: true,
            title,
            message
        })
    }

    // 1. 메인 리스트 상태
    const [title, setTitle] = useState('')
    const [category, setCategory] = useState('기타')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [loading, setLoading] = useState(true)

    // 2. 하위 리스트 아이템 상태
    const [items, setItems] = useState<EditItemInput[]>([])

    // 최신 items를 항상 참조하기 위한 ref
    const itemsRef = useRef(items)
    itemsRef.current = items

    // 드래그 중인 아이템 인덱스 저장
    const [draggingIndex, setDraggingIndex] = useState<number | null>(null)

    /**
     * 기존 리스트 데이터 불러오기
     */
    useEffect(() => {
        const fetchListData = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            // 리스트 상세 데이터 가져오기
            const { data: list, error } = await supabase
                .from('lists')
                .select(`
                  *,
                  list_items (
                    *,
                    item_images (*)
                  )
                `)
                .eq('id', listId)
                .single()

            if (error || !list) {
                showError('리스트를 찾을 수 없습니다.', '조회 실패')
                router.push('/')
                return
            }

            // 작성자 본인 확인
            if (list.user_id !== user.id) {
                showError('수정 권한이 없습니다.', '권한 오류')
                router.push(`/list/${listId}`)
                return
            }

            // 메인 정보 세팅
            setTitle(list.title)
            setCategory(list.category)

            // 아이템 정렬 및 세팅
            const sortedItems = [...list.list_items].sort((a: any, b: any) => a.order_no - b.order_no)
            const editItems: EditItemInput[] = sortedItems.map((item: any) => {
                const sortedImages = [...(item.item_images || [])].sort((a: any, b: any) => a.order_no - b.order_no)
                return {
                    title: item.title || '',
                    content: item.content || '',
                    existingImageUrls: sortedImages.map((img: any) => img.image_url),
                    newImages: [],
                    newPreviewUrls: [],
                }
            })

            setItems(editItems.length > 0 ? editItems : [{ title: '', content: '', existingImageUrls: [], newImages: [], newPreviewUrls: [] }])
            setLoading(false)
        }
        fetchListData()
    }, [listId, supabase, router])

    /**
     * 새로운 리스트 아이템 입력 칸 추가
     */
    const addItem = () => {
        setItems([...items, { title: '', content: '', existingImageUrls: [], newImages: [], newPreviewUrls: [] }])
    }

    /**
     * 특정 순번의 리스트 아이템 값 수정
     */
    const updateItem = <K extends keyof EditItemInput>(index: number, field: K, value: EditItemInput[K]) => {
        const newItems = [...items]
        newItems[index] = { ...newItems[index], [field]: value }
        setItems(newItems)
    }

    /**
     * 파일 처리 공통 로직 (Input과 Drop 모두 사용)
     */
    const processFiles = (index: number, files: File[]) => {
        if (files.length === 0) return

        const currentItem = items[index]

        // 이미지 파일만 필터링
        const imageFiles = files.filter(file => file.type.startsWith('image/'))
        if (imageFiles.length !== files.length) {
            showError('이미지 파일만 업로드 가능합니다.', '형식 오류')
            return
        }

        // 이미지 장수 5장 제한 체크 (기존 + 새 이미지 합산)
        const totalImages = currentItem.existingImageUrls.length + currentItem.newImages.length + imageFiles.length
        if (totalImages > 5) {
            showError('이미지는 최대 5장까지만 업로드할 수 있습니다.', '이미지 개수 초과')
            return
        }

        const newPreviewUrls = imageFiles.map(file => URL.createObjectURL(file))
        const newItems = [...items]
        newItems[index] = {
            ...currentItem,
            newImages: [...currentItem.newImages, ...imageFiles],
            newPreviewUrls: [...currentItem.newPreviewUrls, ...newPreviewUrls]
        }
        setItems(newItems)
    }

    /**
     * 다중 이미지 선택 처리
     */
    const handleImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        processFiles(index, files)
        e.target.value = ''
    }

    /**
     * 드래그 앤 드롭 이벤트 핸들러
     */
    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault()
        setDraggingIndex(index)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDraggingIndex(null)
        }
    }

    const handleDrop = (e: React.DragEvent, index: number) => {
        e.preventDefault()
        setDraggingIndex(null)

        const files = Array.from(e.dataTransfer.files)
        processFiles(index, files)
    }

    /**
     * 기존 이미지 삭제
     */
    const removeExistingImage = (itemIndex: number, imgIndex: number) => {
        const newItems = [...items]
        const targetItem = newItems[itemIndex]
        targetItem.existingImageUrls = targetItem.existingImageUrls.filter((_, i) => i !== imgIndex)
        setItems(newItems)
    }

    /**
     * 새 이미지 삭제
     */
    const removeNewImage = (itemIndex: number, imgIndex: number) => {
        const newItems = [...items]
        const targetItem = newItems[itemIndex]

        // 메모리 해제
        URL.revokeObjectURL(targetItem.newPreviewUrls[imgIndex])

        targetItem.newImages = targetItem.newImages.filter((_, i) => i !== imgIndex)
        targetItem.newPreviewUrls = targetItem.newPreviewUrls.filter((_, i) => i !== imgIndex)
        setItems(newItems)
    }

    /**
     * 아이템 제거
     */
    const removeItem = (index: number) => {
        if (items.length <= 1) return
        items[index].newPreviewUrls.forEach(url => URL.revokeObjectURL(url))
        setItems(items.filter((_, i) => i !== index))
    }

    /**
     * 컴포넌트 언마운트 시 미리보기 URL 메모리 해제
     */
    useEffect(() => {
        return () => {
            itemsRef.current.forEach(item => item.newPreviewUrls.forEach(url => URL.revokeObjectURL(url)))
        }
    }, [])

    /**
     * 수정 데이터를 저장하는 핵심 핸들러
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (isSubmitting) return

        // 리스트 제목 (필수값) 유효성 검사
        if (!title.trim()) {
            showError('리스트의 제목을 입력해 주세요.', '입력 확인')
            return
        }

        setIsSubmitting(true)

        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser()

            // 1. 초기 유저 체크 시 에러 핸들링
            if (userError || !user) {
                handleAuthError({ status: 401 }, router, `/edit/${listId}`)
                return
            }

            // 2. 이미지 업로드 병렬 처리 + 기존 URL 합산
            const itemDataForServer = await Promise.all(
                items.map(async (item, idx) => {
                    // 새 이미지 업로드
                    const newUploadedUrls = await Promise.all(
                        item.newImages.map(async (file) => {
                            const compressed = await compressImage(file)
                            return await uploadImage(compressed, user.id)
                        })
                    )
                    return {
                        title: item.title,
                        content: item.content,
                        image_urls: [...item.existingImageUrls, ...newUploadedUrls],
                        order_no: idx
                    }
                })
            )

            // 3. 서버 액션 호출하여 DB 업데이트
            const result = await updateList(listId, title, category, itemDataForServer)

            if (result.success) {
                alert('리스트가 수정되었습니다.')
                router.push(`/list/${listId}`)
            } else {
                showError('리스트 수정에 실패했습니다. 잠시 후 다시 시도해주세요.', '수정 실패')
            }

        } catch (error: any) {
            console.error(error)
            showError('수정 중 예기치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', '수정 실패')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (loading) return <div className="flex justify-center py-20">로딩 중...</div>

    return (
        <main className="max-w-3xl mx-auto py-10 px-4 bg-main-bg text-main-text">
            <form onSubmit={handleSubmit} className="space-y-8">
                {/* 메인 리스트 정보 */}
                <section className="space-y-4">
                    <input
                        type="text"
                        placeholder="제목을 입력해주세요"
                        className="w-full text-3xl font-bold border-none focus:ring-0 bg-main-bg placeholder:text-sub-text"
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
                                className={`px-4 py-1.5 rounded-full text-sm border transition cursor-pointer ${category === cat
                                    ? 'bg-main-text text-main-bg border-border'
                                    : 'bg-main-bg text-main-text border-border hover:border-sub-text'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </section>

                <hr className="border-border" />

                {/* 아이템 리스트 섹션 */}
                <section className="space-y-12">
                    {items.map((item, index) => {
                        const totalImageCount = item.existingImageUrls.length + item.newImages.length

                        return (
                            <div key={index} className="flex gap-4 relative border-b border-border pb-12 last:border-0">
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

                                <div className="flex-none w-8 h-8 bg-main-text text-main-bg rounded-full flex items-center justify-center font-bold text-sm">
                                    {index + 1}
                                </div>

                                <div className="flex-grow space-y-4 overflow-hidden">
                                    {/* 드래그 앤 드롭이 적용될 업로드 영역 */}
                                    <div
                                        className={`flex gap-3 overflow-x-auto pb-2 scrollbar-hide p-2 rounded-2xl transition-colors ${draggingIndex === index ? 'bg-blue-50/50 ring-2 ring-blue-200 ring-dashed' : ''}`}
                                        onDragOver={(e) => handleDragOver(e, index)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, index)}
                                    >
                                        {/* 기존 이미지 카드들 */}
                                        {item.existingImageUrls.map((url, imgIdx) => (
                                            <div key={`existing-${imgIdx}`} className="relative w-40 h-40 flex-none rounded-2xl overflow-hidden border border-border bg-main-bg">
                                                <img src={url} className="w-full h-full object-cover" alt="기존 이미지" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeExistingImage(index, imgIdx)}
                                                    className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-main-bg rounded-full flex items-center justify-center hover:bg-main-text transition"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}

                                        {/* 새 이미지 미리보기 카드들 */}
                                        {item.newPreviewUrls.map((url, imgIdx) => (
                                            <div key={`new-${imgIdx}`} className="relative w-40 h-40 flex-none rounded-2xl overflow-hidden border border-border bg-main-bg">
                                                <img src={url} className="w-full h-full object-cover" alt="새 이미지" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeNewImage(index, imgIdx)}
                                                    className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-main-bg rounded-full flex items-center justify-center hover:bg-main-text transition"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}

                                        {/* 이미지 추가 버튼 */}
                                        {totalImageCount < 5 && (
                                            <label className={`w-40 h-40 flex-none border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition group ${draggingIndex === index
                                                ? 'bg-blue-100 border-blue-400 dark:bg-blue-900/20 dark:border-blue-700'
                                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100 dark:bg-zinc-900 dark:border-zinc-800'
                                                }`}>
                                                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition">
                                                    <span className={`text-xl ${draggingIndex === index ? 'text-blue-500' : 'text-gray-500 dark:text-zinc-500'}`}>+</span>
                                                </div>
                                                <span className="text-gray-400 text-xs font-bold text-center px-2">
                                                    {draggingIndex === index ? '여기에 놓으세요!' : `${totalImageCount}/5 클릭 또는 드래그`}
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
                                        className="w-full text-xl font-bold border-none text-sub-text focus:ring-0 p-0"
                                        value={item.title}
                                        onChange={(e) => updateItem(index, 'title', e.target.value)}
                                        required
                                    />
                                    <textarea
                                        placeholder="상세 내용을 입력하세요 (선택 사항)"
                                        className="w-full border-none focus:ring-0 resize-none text-sub-text p-0"
                                        rows={3}
                                        value={item.content}
                                        onChange={(e) => updateItem(index, 'content', e.target.value)}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </section>

                {/* 하단 버튼 */}
                <div className="flex flex-col gap-4 pt-10">
                    <button
                        type="button"
                        onClick={addItem}
                        className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 hover:border-gray-400 transition font-bold cursor-pointer"
                    >
                        + 항목 추가하기
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full py-4 rounded-xl font-bold text-lg transition cursor-pointer ${isSubmitting ? 'bg-gray-500 cursor-not-allowed' : 'bg-main-text text-main-bg hover:bg-gray-500 shadow-lg'
                            }`}
                    >
                        {isSubmitting ? '수정 중...' : '리스트 수정 완료'}
                    </button>
                </div>
            </form>

            {/* 에러 모달 배치 */}
            <ErrorModal
                isOpen={errorModal.isOpen}
                onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
                title={errorModal.title}
                message={errorModal.message}
            />
        </main>
    )
}
