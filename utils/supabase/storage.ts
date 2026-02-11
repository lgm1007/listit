import { createClient } from '@/utils/supabase/client'

/**
 * 이미지를 Supabase Storage의 listit-image 버킷에 업로드 & URL 반환
 * 경로 규칙: {userId}/{timestamp}_{fileName}
 */
export const uploadImage = async (file: File, userId: string) => {
    const supabase = createClient()
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random()}.${fileExt}`
    const filePath = `${userId}/${Date.now()}_${fileName}`

    // 이미지 업로드하기
    const { data, error } = await supabase.storage
        .from('listit-image')
        .upload(filePath, file)

    if (error) throw error

    // 업로드된 이미지의 공용 URL 가져오기
    const { data: { publicUrl } } = supabase.storage
        .from('listit-image')
        .getPublicUrl(filePath)

    return publicUrl
}