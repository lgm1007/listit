import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nrmznahmnphlaydxskca.supabase.co', // Supabase Storage 이미지 호스트 허용
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // 구글 프로필 이미지용
        port: '',
        pathname: '/**', // 구글 이미지는 경로가 다양하므로 전체 허용
      },
    ],
  },
};

export default nextConfig;
