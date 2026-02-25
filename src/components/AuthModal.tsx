'use client'

import { useRouter } from 'next/navigation'

interface AuthModalProps {
    isOpen: boolean
    onClose: () => void
    nextPath?: string
}

export default function AuthModal({ isOpen, onClose, nextPath }: AuthModalProps) {
    const router = useRouter()

    if (!isOpen) return null

    const handleLogin = () => {
        const redirectUrl = nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : '/login'
        router.push(redirectUrl)
        onClose()
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="text-center space-y-4">
                    <div className="text-4xl">🔑</div>
                    <h3 className="text-xl font-bold text-gray-900">로그인이 필요한 서비스입니다</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        리스트에 좋아요를 누르거나 댓글을 남기려면<br />
                        로그인이 필요합니다. 지금 이동할까요?
                    </p>
                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 px-4 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition"
                        >
                            나중에 하기
                        </button>
                        <button
                            onClick={handleLogin}
                            className="flex-1 py-3 px-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 transition"
                        >
                            로그인하기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}