'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

/** Server Action 결과 타입 */
type ActionResult = { success: true } | { success: false; error: string }

// 닉네임 유효성 검사 규칙 - 닉네임 정책
const USERNAME_MIN_LENGTH = 2
const USERNAME_MAX_LENGTH = 20
const USERNAME_PATTERN = /^[a-zA-Z0-9가-힣_.]+$/

/**
 * 사용자의 닉네임 업데이트 서버 액션
 * throw 대신 결과 객체를 반환하여 클라이언트에서 에러를 쉽게 처리할 수 있도록 함
 */
export async function updateUsername(_prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
    const rawUsername = formData.get('username')

    // 1. 입력값 검증
    if (typeof rawUsername !== 'string' || !rawUsername.trim()) {
        return { success: false, error: '닉네임을 입력해주세요.' }
    }

    const username = rawUsername.trim()

    if (username.length < USERNAME_MIN_LENGTH || username.length > USERNAME_MAX_LENGTH) {
        return { success: false, error: `닉네임은 ${USERNAME_MIN_LENGTH}~${USERNAME_MAX_LENGTH}자 사이로 입력해주세요.` }
    }

    if (!USERNAME_PATTERN.test(username)) {
        return { success: false, error: '닉네임은 한글, 영문, 숫자, 언더바(_), 온점(.)만 사용할 수 있습니다.' }
    }

    // 2. 인증 확인
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, error: '로그인이 필요합니다.' }
    }

    // 3. profiles 테이블의 username 컬럼 업데이트
    const { error } = await supabase
        .from('profiles')
        .update({ username })
        .eq('id', user.id)

    if (error) {
        // UNIQUE 제약 조건 위반 (PostgreSQL 에러 코드: 23505)
        if (error.code === '23505') {
            return { success: false, error: '이미 사용 중인 닉네임입니다.' }
        }
        return { success: false, error: '닉네임 변경 중 오류가 발생했습니다.' }
    }

    // 4. 변경된 데이터를 즉시 화면에 반영하기 위해 캐시 갱신
    revalidatePath('/profile')
    return { success: true }
}