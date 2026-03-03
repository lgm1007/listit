import Header from '@/src/components/layout/Header'
import { createClient } from '@/utils/supabase/server'
import './globals.css'
import { ThemeProvider } from '@/src/components/ThemeProvider'

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
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError) {
    console.error('Error getting user auth:', authError.message)
  }

  let userProfile = null

  if (user) {
    // auth 정보가 있다면 profiles 테이블에서 닉네임 가져오기
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('nickname, avatar_url')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error getting profile:', profileError.message)
    }

    userProfile = profile
  }

  return (
    <html lang="ko" suppressHydrationWarning>
      {/* 카카오 SDK 추가 */}
      <script src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.0/kakao.min.js" integrity="sha384-lLeSetPsatB4S7M0m9E0YpT2h8V8X9f4J+" crossOrigin="anonymous"></script>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Header userProfile={userProfile} />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}