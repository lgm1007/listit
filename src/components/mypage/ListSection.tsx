import Link from 'next/link'

interface ListItem {
    id: string
    title: string
    category: string
    created_at: string
}

interface ListSectionProps {
    lists: ListItem[]
    emptyMessage: string
}

/**
 * 리스트 목록 공통 컴포넌트
 * 마이페이지의 '내가 만든 리스트', '좋아요한 리스트' 등에서 재사용
 */
export default function ListSection({ lists, emptyMessage }: ListSectionProps) {
    if (lists.length === 0) {
        return (
            <div className="text-center py-10 text-sub-text bg-card-bg rounded-2xl border border-dashed border-border">
                {emptyMessage}
            </div>
        )
    }

    return (
        <ul className="space-y-3">
            {lists.map((list) => (
                <li key={list.id}>
                    <Link
                        href={`/list/${list.id}`}
                        className="flex items-center justify-between p-4 bg-card-bg border border-border rounded-2xl hover:border-sub-text transition-all group"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <span className="px-2.5 py-0.5 bg-main-bg border border-border rounded-full text-xs font-medium text-sub-text shrink-0">
                                {list.category}
                            </span>
                            <span className="font-semibold text-main-text truncate group-hover:underline">
                                {list.title}
                            </span>
                        </div>
                        <span className="text-xs text-sub-text shrink-0 ml-4">
                            {new Date(list.created_at).toLocaleDateString()}
                        </span>
                    </Link>
                </li>
            ))}
        </ul>
    )
}
