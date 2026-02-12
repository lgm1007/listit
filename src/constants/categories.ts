export const CATEGORIES = [
    { id: 'all', name: '전체' },
    { id: 'travel', name: '여행' },
    { id: 'date', name: '데이트' },
    { id: 'restaurant', name: '맛집' },
    { id: 'content', name: '문화·컨텐츠' },
    { id: 'hobby', name: '취미' },
    { id: 'beauty', name: '패션·뷰티' },
    { id: 'etc', name: '기타' },
] as const;

export const CATEGORY_IMAGE: Record<string, string> = {
    '여행': '/placeholder_travel.png',
    '데이트': '/placeholder_date.png',
    '맛집': '/placeholder_restaurant.png',
    '문화·컨텐츠': '/placeholder_content.png',
    '취미': '/placeholder_hobby.png',
    '패션·뷰티': '/placeholder_beauty.png',
    '기타': '/placeholder_etc.png',
};

// 데이터베이스 저장용 이름만 필요할 때 사용할 타입과 배열
export type CategoryName = typeof CATEGORIES[number]['name'];
export const CATEGORY_NAMES = CATEGORIES.map(cat => cat.name);