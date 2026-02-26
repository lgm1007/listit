'use client'

interface ErrorModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    message: string
}

export default function ErrorModal({ isOpen, onClose, title = "오류 발생", message }: ErrorModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* 배경 레이어 */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* 모달 본체 */}
            <div className="relative bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl transform transition-all scale-100 flex flex-col items-center text-center">
                {/* 에러 아이콘 (경고 표시) */}
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
                    <span className="text-red-500 text-3xl font-bold">!</span>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
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