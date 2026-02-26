'use server'

import { createClient } from '@/utils/supabase/server'

interface ItemData {
    title: string
    content: string
    image_urls: string[]
    order_no: number
}

/**
 * 리스트 메인 정보와 하위 아이템들을 DB에 저장
 */
export async function saveList(
    title: string,
    category: string,
    items: ItemData[]
) {
    try {
        const supabase = await createClient()

        // 1. 유저 인증 확인
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: { status: 401, message: '로그인이 필요합니다.' } }

        // 2. Supabase에서 정의한 PostgreSQL RPC 함수를 통해 lists + list_items를 단일 트랜잭션으로 저장
        const { data: listId, error } = await supabase.rpc('create_list_with_items', {
            p_title: title,
            p_category: category,
            p_user_id: user.id,
            p_items: items,
        })

        if (error) {
            console.error('RPC Error: ', error)
            return { success: false, error }
        }

        // 3. 성공 시 성공 결과 반환
        return { success: true, listId }
    } catch (error) {
        console.error('SaveList Action Error: ', error)
        return { success: false, error }
    }
}