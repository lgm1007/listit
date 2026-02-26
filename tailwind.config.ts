import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: "class", // 다크모드 클래식 전략 사용
    content: [
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {},
    },
    plugins: [],
};
export default config;