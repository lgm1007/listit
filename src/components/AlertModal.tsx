'use client'

export type AlertType = 'success' | 'info' | 'error'

interface AlertModalProps {
    isOpen: boolean
    onClose: () => void
    type?: AlertType
    title?: string
    message: string
}

const ALERT_CONFIG: Record<AlertType, { icon: string; iconBg: string; iconColor: string; defaultTitle: string }> = {
    success: {
        icon: '✓',
        iconBg: 'bg-green-50',
        iconColor: 'text-green-500',
        defaultTitle: '완료',
    },
    info: {
        icon: 'i',
        iconBg: 'bg-blue-50',
        iconColor: 'text-blue-500',
        defaultTitle: '안내',
    },
    error: {
        icon: '!',
        iconBg: 'bg-red-50',
        iconColor: 'text-red-500',
        defaultTitle: '오류 발생',
    },
}

/**
 * 공통 알림 모달 컴포넌트
 * success / info / error 타입에 따라 아이콘과 색상이 달라짐
 */
export default function AlertModal({ isOpen, onClose, type = 'info', title, message }: AlertModalProps) {
    if (!isOpen) return null

    const config = ALERT_CONFIG[type]

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* 배경 레이어 */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* 모달 본체 */}
            <div className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl transform transition-all scale-100 flex flex-col items-center text-center">
                {/* 타입별 아이콘 */}
                <div className={`w-16 h-16 ${config.iconBg} rounded-full flex items-center justify-center mb-6`}>
                    <span className={`${config.iconColor} text-3xl font-bold`}>{config.icon}</span>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">{title || config.defaultTitle}</h3>
                <p className="text-gray-500 leading-relaxed mb-8">
                    {message}
                </p>

                <button
                    onClick={onClose}
                    className="w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition shadow-lg active:scale-95"
                >
                    확인
                </button>
            </div>
        </div>
    )
}
