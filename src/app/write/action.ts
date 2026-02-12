'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

interface ItemData {
    title: string
    content: string
    image_url: string | null
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
    const supabase = await createClient()

    // 1. 유저 인증 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('로그인이 필요합니다.')

    // 2. Supabase에서 정의한 PostgreSQL RPC 함수를 통해 lists + list_items를 단일 트랜잭션으로 저장
    const { data, error } = await supabase.rpc('create_list_with_items', {
        p_title: title,
        p_category: category,
        p_user_id: user.id,
        p_items: items,
    })

    if (error) throw error

    // 3. 성공 시 성공 결과 반환
    return { success: true }
}