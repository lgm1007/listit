import Header from '@/src/components/layout/Header'
import { createClient } from '@/utils/supabase/server'
import './globals.css'

/**
 * 루트 레이아웃 컴포넌트
 * 서버 측에서 유저 세션과 프로필(닉네임)을 조회하여 헤더에 전달
 */
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // 현재 로그인한 사용자의 auth 정보 가져오기
  const { data: { user } } = await supabase.auth.getUser()

  let userProfile = null

  if (user) {
    // auth 정보가 있다면 profiles 테이블에서 닉네임 가져오기
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .single()

    userProfile = profile
  }

  return (
    <html lang="ko">
      <body>
        <Header userProfile={userProfile} />
        {children}
      </body>
    </html>
  )
}