'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * 유저 닉네임 및 아바타 수정 로직
 * @param formData 
 * @returns 
 */
export async function updateProfile(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, message: '인증되지 않았습니다.' }

    const nickname = formData.get('nickname') as string
    const avatar_url = formData.get('avatar_url') as string

    const { error } = await supabase
        .from('profiles')
        .upsert({
            id: user.id,
            nickname,
            avatar_url,
            updated_at: new Date().toISOString(),
        })

    if (error) return { success: false, message: error.message }

    revalidatePath('/mypage')
    return { success: true }
}