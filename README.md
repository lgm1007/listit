# 리스팃 (Listit)

## 프로젝트 개요
- 웹 기반 주제별 리스트 공유 플랫폼

## 주요 기능
- 이미지 + 내용을 포함한 리스트 생성/게시
- 관심 있는 리스트에 좋아요/댓글 인터랙션
- 카테고리별 리스트 탐색 (맛집, 여행, 취미, 영화 등)

## 기술 스택
- Next.js 16.1.6 (App Router)
- TypeScript
- Tailwind CSS
- Supabase
- Supabase Storage
- Vercel

## 설치 및 실행
```
# 저장소 복제
git clone https://github.com/lgm1007/listit.git

# 의존성 설치
npm install

# 환경 변수 설정 (최상위 route 경로에 .env.local 파일 추가 후 아래 내용 추가)
NEXT_PUBLIC_SUPABASE_URL=YOUR_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_KEY

# 로컬 서버 실행
npm run dev
```
