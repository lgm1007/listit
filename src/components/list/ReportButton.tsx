'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import ErrorModal from '../ErrorModal'

interface ReportButtonProps {
    targetType: 'list' | 'comment'
    targetId: string
}

export default function ReportButton({ targetType, targetId }: ReportButtonProps) {
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

    const handleReport = async () => {
        const reason = prompt('신고 사유를 입력해주세요 (부적절한 콘텐츠, 욕설 등):')
        if (!reason) return

        if (!confirm('정말로 이 콘텐츠를 신고하시겠습니까? 신고 시 즉시 숨김 처리됩니다.')) return

        try {
            // 1. 신고 내역 저장
            const { error: reportError } = await supabase
                .from('reports')
                .insert({
                    target_type: targetType,
                    target_id: targetId,
                    reason: reason
                })

            if (reportError) throw reportError

            // 2. 해당 콘텐츠 즉시 숨김 처리 (is_hidden 업데이트)
            const table = targetType === 'list' ? 'lists' : 'comments'
            const { error: hideError } = await supabase
                .from(table)
                .update({ is_hidden: true })
                .eq('id', targetId)

            if (hideError) throw hideError

            alert('신고가 접수되어 해당 콘텐츠가 숨김 처리되었습니다. 관리자 검토 후 조치될 예정입니다.')
            window.location.reload() // UI 갱신을 위해 새로고침

        } catch (error) {
            console.error('Report error:', error)
            showError('신고 처리 중 오류가 발생했습니다.', '신고 처리 중 오류')
        }
    }

    return (
        <>
            <button
                onClick={handleReport}
                className="p-2 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition cursor-pointer"
                title="신고하기"
            >
                <AlertTriangle size={20} />
            </button>
            <ErrorModal
                isOpen={errorModal.isOpen}
                title={errorModal.title}
                message={errorModal.message}
                onClose={() => setErrorModal({ isOpen: false, title: '', message: '' })}
            />
        </>
    )
}