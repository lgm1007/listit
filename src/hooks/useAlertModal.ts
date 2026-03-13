import { useState } from 'react'
import { AlertType } from '@/src/components/AlertModal'

interface AlertModalState {
    isOpen: boolean
    type: AlertType
    title: string
    message: string
}

/**
 * 알림 모달 상태 관리 커스텀 훅
 * showSuccess, showError, showInfo로 타입별 모달 표시
 */
export function useAlertModal() {
    const [alertModal, setAlertModal] = useState<AlertModalState>({
        isOpen: false,
        type: 'info',
        title: '',
        message: ''
    })

    const showAlert = (message: string, title: string = '', type: AlertType = 'info') => {
        setAlertModal({ isOpen: true, type, title, message })
    }

    const showSuccess = (message: string, title: string = '완료') => {
        showAlert(message, title, 'success')
    }

    const showError = (message: string, title: string = '오류 발생') => {
        showAlert(message, title, 'error')
    }

    const showInfo = (message: string, title: string = '안내') => {
        showAlert(message, title, 'info')
    }

    const closeAlert = () => {
        setAlertModal(prev => ({ ...prev, isOpen: false }))
    }

    return { alertModal, showAlert, showSuccess, showError, showInfo, closeAlert }
}
