import { useState, useCallback } from 'react'

interface ErrorModalState {
    isOpen: boolean
    title: string
    message: string
}

/**
 * 에러 모달 상태 관리 커스텀 훅
 * write, edit, mypage 등 여러 페이지에서 공통으로 사용
 */
export function useErrorModal() {
    const [errorModal, setErrorModal] = useState<ErrorModalState>({
        isOpen: false,
        title: '',
        message: ''
    })

    const showError = useCallback((message: string, title: string = '알림') => {
        setErrorModal({ isOpen: true, title, message })
    }, [])

    const closeError = useCallback(() => {
        setErrorModal(prev => ({ ...prev, isOpen: false }))
    }, [])

    return { errorModal, showError, closeError }
}
