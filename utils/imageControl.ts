import imageCompression from 'browser-image-compression';

/**
 * 이미지 파일을 받아 설정된 옵션에 따라 압축하여 반환
 */
export const compressImage = async (file: File) => {
    const options = {
        maxSizeMB: 0.5,            // 최대 용량 500KB
        maxWidthOrHeight: 1024,   // 가로/세로 최대 1024px (리스트 썸네일로 충분)
        useWebWorker: true,       // 별도 스레드에서 처리하여 UI 버벅임 방지
    };

    try {
        const compressedFile = await imageCompression(file, options);
        return compressedFile;
    } catch (error) {
        console.error('이미지 압축 에러:', error);
        return file; // 에러 시 원본 반환
    }
};