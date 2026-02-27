'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { uploadImage } from '@/utils/supabase/storage'
import { compressImage } from '@/utils/imageControl'
import { updateProfile } from './action'
import { useRouter } from 'next/navigation'
import ErrorModal from '@/src/components/ErrorModal'

export default function MyPage() {
    const router = useRouter()
    const supabase = createClient()

    // 상태 관리
    const [nickname, setNickname] = useState('')
    const [avatarUrl, setAvatarUrl] = useState('')
    const [isUploading, setIsUploading] = useState(false) // 이미지 업로드 상태
    const [isSaving, setIsSaving] = useState(false)       // DB 저장 상태
    const [loading, setLoading] = useState(true)           // 초기 데이터 로딩

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

    // 초기 프로필 데이터 불러오기
    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('nickname, avatar_url')
                .eq('id', user.id)
                .single()

            if (profile) {
                setNickname(profile.nickname || '')
                setAvatarUrl(profile.avatar_url || '')
            }
            setLoading(false)
        }
        fetchProfile()
    }, [supabase, router])

    /**
     * 아바타 이미지 변경 핸들러
     * @param e 
     * @returns 
     */
    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true) // 업로드 시작
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('로그인이 필요합니다.')

            // 1. 이미지 압축
            const compressedFile = await compressImage(file)

            // 2. 기존에 만든 uploadImage 활용 (user.id를 넘겨 경로 구분)
            const url = await uploadImage(compressedFile, user.id)
            setAvatarUrl(url)
        } catch (error) {
            console.error('Upload failed:', error)
            showError('이미지를 올리는 중 문제가 발생했습니다.', '이미지 업로드 실패')
        } finally {
            setIsUploading(false) // 업로드 종료
        }
    }

    /**
     * 프로필 저장 핸들러
     * @returns 
     */
    const handleSaveProfile = async () => {
        if (!nickname.trim()) {
            showError('닉네임을 입력해주세요.', '닉네임 입력')
            return
        }

        setIsSaving(true) // 저장 시작
        const formData = new FormData()
        formData.append('nickname', nickname)
        formData.append('avatar_url', avatarUrl)

        const result = await updateProfile(formData)

        if (result.success) {
            alert('프로필이 성공적으로 업데이트되었습니다.')
            router.refresh()
        } else {
            showError(result.message || '저장에 실패했습니다.', '저장 실패')
        }
        setIsSaving(false) // 저장 종료
    }

    if (loading) return <div className="flex justify-center py-20">로딩 중...</div>

    return (
        <main className="max-w-2xl mx-auto py-12 px-4 space-y-10">
            {/* 프로필 수정 섹션 */}
            <section className="flex flex-col items-center gap-8">
                <div className="relative w-32 h-32 group">
                    {/* 아바타 이미지 레이어 */}
                    <div className="w-full h-full rounded-full overflow-hidden border-4 border-border bg-card-bg relative">
                        <img
                            src={avatarUrl || '/default-avatar.png'}
                            className={`w-full h-full object-cover transition-opacity duration-300 ${isUploading ? 'opacity-30' : 'opacity-100'}`}
                            alt="Profile"
                        />

                        {/* 업로드 중 스피너 표시 */}
                        {isUploading && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-8 h-8 border-4 border-sub-text border-t-main-text rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>

                    {/* 이미지 변경 오버레이 버튼 (업로드 중에는 숨김) */}
                    {!isUploading && (
                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity duration-200 text-sm font-medium">
                            변경
                            <input type="file" className="hidden" onChange={handleAvatarChange} accept="image/*" />
                        </label>
                    )}
                </div>

                <div className="w-full space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-sub-text ml-1">닉네임</label>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="닉네임을 입력하세요"
                            className="w-full p-4 bg-card-bg border border-border rounded-2xl text-main-text focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>

                    <button
                        onClick={handleSaveProfile}
                        disabled={isUploading || isSaving}
                        className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-lg cursor-pointer ${isUploading || isSaving
                            ? 'bg-zinc-400 cursor-not-allowed opacity-70'
                            : 'bg-main-text text-main-bg hover:scale-[1.01] active:scale-[0.99]'
                            }`}
                    >
                        {isUploading ? '이미지 업로드 중...' : isSaving ? '저장 중...' : '프로필 저장하기'}
                    </button>
                </div>
            </section>

            <hr className="border-border" />

            {/* 내가 쓴 글 목록 섹션 (추후 구현) */}
            <section className="space-y-6">
                <h3 className="text-xl font-bold text-main-text">내가 만든 리스트</h3>
                <div className="text-center py-10 text-sub-text bg-card-bg rounded-2xl border border-dashed border-border">
                    아직 작성한 리스트가 없습니다.
                </div>
            </section>

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