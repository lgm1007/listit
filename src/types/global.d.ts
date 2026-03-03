export { }; // 이 파일이 모듈임을 나타내기 위해 필요합니다.

declare global {
    interface Window {
        Kakao: any; // Kakao 속성이 존재함을 선언
    }
}