import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

/**
 * 에러를 처리하여 401(Unauthorized)인 경우 로그인 페이지로 리다이렉팅
 */
export const handleAuthError = (error: any, router: AppRouterInstance) => {
    // Supabase 401 에러 체크 또는 status가 401이거나 메시지에 Unauthorized 포함
    if (error?.status === 401 || error?.code === 'PGRST301' || error?.message?.includes('Unauthorized')) {
        alert('세션이 만료되었거나 로그인이 필요합니다. 로그인 페이지로 이동합니다.');
        router.push('/login');
        return true;
    }

    // 그 외 에러는 로그로 출력
    console.error('Unhandled Error:', error);
    return false;
};