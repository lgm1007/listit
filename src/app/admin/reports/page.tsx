'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Trash2, RotateCcw, AlertCircle } from 'lucide-react'
import ErrorModal from '@/src/components/ErrorModal'

interface Report {
    id: string;
    created_at: string;
    target_type: 'list' | 'comment';
    target_id: string;
    target_user_id: string;
    reason: string;
    status: 'pending' | 'reviewed';
    reporter: { nickname: string } | null;
}

export default function AdminReportPage() {
    const supabase = createClient()
    const router = useRouter()
    const [errorModal, setErrorModal] = useState({
        isOpen: false,
        title: '',
        message: ''
    })

    const [reports, setReports] = useState<Report[]>([])
    const [loading, setLoading] = useState(true)
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null) // 관리자 여부 상태

    const showError = (message: string, title: string = "알림") => {
        setErrorModal({
            isOpen: true,
            title,
            message
        })
    }

    /**
     * 관리자 확인
     */
    const checkAdmin = async () => {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            showError('로그인이 필요합니다.', '로그인 상태 에러')
            router.push('/')
            return
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single()

        if (!profile?.is_admin) {
            showError('관리자 권한이 없습니다.', '권한 에러')
            router.push('/') // 권한 없으면 메인으로
            return
        }

        setIsAdmin(true)
        fetchReports() // 관리자 확인 후 데이터 로드
    }

    const fetchReports = async () => {
        setLoading(true)
        // 신고 내역과 함께 해당 타겟의 정보를 조인해서 가져옵니다.
        const { data, error } = await supabase
            .from('reports')
            .select(`
                *,
                reporter:profiles!reporter_id(nickname)
            `)
            .eq('status', 'pending')
            .order('created_at', { ascending: false })

        if (error) {
            showError('신고 내역 조회 중 오류가 발생했습니다.', '조회 에러')
        } else if (data) {
            setReports(data)
        }

        setLoading(false)
    }

    useEffect(() => {
        checkAdmin()
    }, [])

    // 복구 로직
    const handleRestore = async (reportId: string, targetType: string, targetId: string) => {
        if (!confirm('해당 콘텐츠를 다시 공개하시겠습니까?')) return

        const table = targetType === 'list' ? 'lists' : 'comments'

        // 1. 숨김 해제
        await supabase.from(table).update({ is_hidden: false }).eq('id', targetId)
        // 2. 신고 처리 완료
        await supabase.from('reports').update({ status: 'reviewed' }).eq('id', reportId)

        alert('복구되었습니다.')
        fetchReports()
    }

    // 삭제 및 알림 전송 로직
    const handleDelete = async (reportId: string, targetType: string, targetId: string, authorId: string) => {
        const reason = prompt('삭제 사유를 입력해주세요 (유저에게 쪽지로 전송됩니다):')
        if (!reason) return

        const table = targetType === 'list' ? 'lists' : 'comments'

        // 1. 유저에게 알림 전송
        await supabase.from('notifications').insert({
            user_id: authorId,
            content: `안녕하세요. 귀하가 작성하신 ${targetType === 'list' ? '리스트' : '댓글'}이 부적절한 사유(${reason})로 인해 관리자에 의해 삭제되었습니다.`
        })

        // 2. 실제 데이터 삭제
        await supabase.from(table).delete().eq('id', targetId)

        // 3. 신고 처리 완료
        await supabase.from('reports').update({ status: 'reviewed' }).eq('id', reportId)

        alert('삭제 및 알림 전송이 완료되었습니다.')
        fetchReports()
    }

    // 로딩 중이거나 권한 확인 전일 때
    if (isAdmin === null || loading) {
        return <div className="p-20 text-center font-medium">권한 확인 및 데이터 로딩 중...</div>
    }

    return (
        <>
            <div className="max-w-5xl mx-auto p-6">
                <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
                    <AlertCircle className="text-red-500" /> 신고 관리 시스템
                </h1>

                <div className="bg-white dark:bg-zinc-900 border border-border rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-card-bg text-sm">
                            <tr>
                                <th className="p-4">유형</th>
                                <th className="p-4">신고 사유</th>
                                <th className="p-4">신고자</th>
                                <th className="p-4">관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {reports.map((report) => (
                                <tr key={report.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition">
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${report.target_type === 'list' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                            {report.target_type.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm text-gray-500">{report.reason}</td>
                                    <td className="p-4 text-sm text-gray-500">{report.reporter?.nickname || '알 수 없음'}</td>
                                    <td className="p-4 flex gap-2">
                                        <button
                                            onClick={() => handleRestore(report.id, report.target_type, report.target_id)}
                                            className="p-2 hover:bg-gray-200 rounded-lg cursor-pointer"
                                            title='복구'
                                        >
                                            <RotateCcw size={18} className="text-blue-500" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(report.id, report.target_type, report.target_id, report.target_user_id)} // target_user_id는 report 생성 시 기록해두면 편합니다
                                            className="p-2 hover:bg-gray-200 rounded-lg cursor-pointer"
                                            title='삭제'
                                        >
                                            <Trash2 size={18} className="text-red-500" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {reports.length === 0 && <div className="p-20 text-center text-gray-400">신고된 내역이 없습니다.</div>}
                </div>
            </div>
            <ErrorModal
                isOpen={errorModal.isOpen}
                title={errorModal.title}
                message={errorModal.message}
                onClose={() => setErrorModal({ isOpen: false, title: '', message: '' })}
            />
        </>
    )
}