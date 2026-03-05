import type { OpenNextConfig } from "@opennextjs/cloudflare";

const config: OpenNextConfig = {
    default: {
        runtime: "edge",
    },
    // 필요한 경우 특정 경로에 대한 설정을 추가할 수 있습니다.
};

export default config;