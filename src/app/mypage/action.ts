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

    const nickname = String(formData.get('nickname') || '')
    const avatar_url = String(formData.get('avatar_url') || '')

    // 닉네임 중복 검사 (본인 제외)
    const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('nickname', nickname)
        .neq('id', user.id)
        .maybeSingle()

    if (existingProfile) {
        return { success: false, message: '이미 사용 중인 닉네임입니다.' }
    }

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