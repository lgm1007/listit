'use client'

import { useState } from 'react'
import { Share2, Link as LinkIcon, MessageCircle } from 'lucide-react' // 아이콘 라이브러리
import ErrorModal from '../ErrorModal'

interface ShareButtonProps {
    title: string
    description?: string
    listId: string
}

export default function ShareButton({ title, description, listId }: ShareButtonProps) {
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

    /**
     * 현재 페이지의 완전한 url 생성
     * @returns string
     */
    const getShareUrl = () => {
        if (typeof window !== 'undefined') {
            // 클라이언트 컴포넌트에서 window 객체 사용
            return `${window.location.origin}/list/${listId}`
        }
        return ''
    }

    // 1. 기본 시스템 공유 (모바일에서 매우 유용)
    const handleWebShare = async () => {
        const shareUrl = getShareUrl()

        if (navigator.share) {
            try {
                await navigator.share({ title, text: description, url: shareUrl })
            } catch (err) {
                console.error('공유 실패:', err)
            }
        } else {
            handleCopyLink() // 지원 안 하는 브라우저(PC 등)는 링크 복사로 대체
        }
    }

    // 2. 클립보드 링크 복사
    const handleCopyLink = async () => {
        const shareUrl = getShareUrl()

        try {
            await navigator.clipboard.writeText(shareUrl)
            alert('링크가 클립보드에 복사되었습니다!') // 나중에 토스트로 교체 추천
        } catch (err) {
            showError('링크 복사에 실패했습니다.', '링크 복사 실패')
        }
    }

    // 3. 카카오톡 공유 (SDK 필요)
    const handleKakaoShare = () => {
        const kakao = window.Kakao
        const shareUrl = getShareUrl()

        if (!kakao) {
            showError('카카오 SDK가 로드되지 않았습니다.', '공유 오류')
            return
        }

        if (!kakao.isInitialized()) {
            const apiKey = process.env.NEXT_PUBLIC_KAKAO_API_KEY
            if (!apiKey) {
                showError('카카오 API 키가 설정되지 않았습니다.', '설정 오류')
                return
            }
            kakao.init(apiKey)
        }

        kakao.Share.sendDefault({
            objectType: 'feed',
            content: {
                title: title,
                description: description || '리스팃에서 확인해보세요!',
                imageUrl: `${window.location.origin}/logo.png`, // 보통 로고나 리스트 첫번째 이미지
                link: {
                    mobileWebUrl: shareUrl,
                    webUrl: shareUrl,
                },
            },
            buttons: [
                {
                    title: '리스트 보기',
                    link: {
                        mobileWebUrl: shareUrl,
                        webUrl: shareUrl,
                    },
                },
            ],
        })
    }

    return (
        <>
            <div className="flex gap-2">
                {/* 시스템 공유 버튼 */}
                <button
                    onClick={handleWebShare}
                    className="p-2 rounded-full bg-card-bg border border-border text-main-text hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                    title="시스템 공유"
                >
                    <Share2 size={20} />
                </button>

                {/* 카카오톡 공유 버튼 */}
                {/* <button
                    onClick={handleKakaoShare}
                    className="p-2 rounded-full bg-[#FEE500] text-[#191919] hover:opacity-90 transition cursor-pointer"
                    title="카카오톡 공유"
                >
                    <MessageCircle size={20} fill="currentColor" />
                </button> */}

                {/* 링크 복사 버튼 */}
                <button
                    onClick={handleCopyLink}
                    className="p-2 rounded-full bg-card-bg border border-border text-main-text hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                    title="링크 복사"
                >
                    <LinkIcon size={20} />
                </button>
            </div>

            <ErrorModal
                isOpen={errorModal.isOpen}
                onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
                title={errorModal.title}
                message={errorModal.message}
            />
        </>
    )
}