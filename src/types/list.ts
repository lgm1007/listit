/**
 * 리스트 관련 공통 타입 정의
 */

/** lists 테이블 기본 정보 */
export interface List {
    id: string
    title: string
    category: string
    created_at: string
}

/** 서버 액션에 전달되는 아이템 데이터 */
export interface ItemData {
    title: string
    content: string
    image_urls: string[]
    order_no: number
}
