'use client'

import { useState } from 'react'
import Image from 'next/image'

interface ImageSliderProps {
    images: { image_url: string; order_no: number }[]
    title: string
}

/**
 * 이미지 슬라이더 컴포넌트
 * @param param0 
 * @returns 
 */
export default function ImageSlider({ images, title }: ImageSliderProps) {
    const [currentIndex, setCurrentIndex] = useState(0)

    if (!images || images.length === 0) return null

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
    }

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
    }

    return (
        <div className="relative aspect-video rounded-3xl overflow-hidden mb-6 bg-gray-50 border border-gray-100 group">
            {/* 이미지 */}
            <Image
                src={images[currentIndex].image_url}
                alt={`${title}-${currentIndex}`}
                fill
                className="object-cover transition-opacity duration-500"
            />

            {/* 화살표 버튼 (이미지가 2장 이상일 때만 표시) */}
            {images.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        aria-label='이전 이미지'
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-main-bg/80 backdrop-blur rounded-full flex items-center justify-center shadow-md hover:bg-main-bg transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                    >
                        <span className="text-xl">←</span>
                    </button>
                    <button
                        onClick={nextSlide}
                        aria-label='다음 이미지'
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-main-bg/80 backdrop-blur rounded-full flex items-center justify-center shadow-md hover:bg-main-bg transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                    >
                        <span className="text-xl">→</span>
                    </button>

                    {/* 인디케이터 (점) */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {images.map((_, idx) => (
                            <div
                                key={idx}
                                className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentIndex ? 'bg-white w-4' : 'bg-white/50'
                                    }`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}