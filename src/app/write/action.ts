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

    // 2. lists 테이블에 메인 정보 저장
    const { data: listData, error: listError } = await supabase
        .from('lists')
        .insert([{ title, category, user_id: user.id }])
        .select()
        .single()

    if (listError) throw listError

    // 3. list_items 테이블에 하위 아이템들 벌크 저장 (Bulk Insert)
    const itemsWithListId = items.map(item => ({
        ...item,
        list_id: listData.id
    }))

    const { error: itemsError } = await supabase
        .from('list_items')
        .insert(itemsWithListId)

    if (itemsError) throw itemsError

    // 4. 성공 시 메인 페이지 이동
    redirect('/')
}