import LoginForm from './components/LoginForm'
import SignUpForm from './components/SignUpForm'

/**
 * 로그인과 회원가입 컴포넌트를 한곳에 보여주는 페이지
 * 서버 컴포넌트로 작성하여 초기 렌더링 속도 높이기
 */
export default function LoginPage() {
    return (
        <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                {/* 로그인 폼 */}
                <LoginForm />

                {/* 구분선 */}
                <div className="relative flex py-5 items-center">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="flex-shrink mx-4 text-gray-400 text-sm">신규 사용자라면?</span>
                    <div className="flex-grow border-t border-gray-300"></div>
                </div>

                {/* 회원가입 폼 */}
                <SignUpForm />
            </div>
        </main>
    )
}