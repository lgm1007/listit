'use server'

import { createClient } from '@/utils/supabase/server'

interface ItemData {
    title: string
    content: string
    image_urls: string[]
    order_no: number
}

/**
 * 리스트 메인 정보와 하위 아이템들을 업데이트
 */
export async function updateList(
    listId: string,
    title: string,
    category: string,
    items: ItemData[]
) {
    try {
        const supabase = await createClient()

        // 1. 유저 인증 확인
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: { status: 401, message: '로그인이 필요합니다.' } }

        // 2. RPC 함수를 통해 lists + list_items를 단일 트랜잭션으로 업데이트
        const { data, error } = await supabase.rpc('update_list_with_items', {
            p_list_id: listId,
            p_user_id: user.id,
            p_title: title,
            p_category: category,
            p_items: items,
        })

        if (error) {
            console.error('RPC Error: ', error)
            return { success: false, error }
        }

        // 3. 성공 결과 반환
        return { success: true }
    } catch (error) {
        console.error('UpdateList Action Error: ', error)
        return { success: false, error }
    }
}
