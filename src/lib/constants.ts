export const SITE_CONFIG = {
  name: "AI Vision",
  description: "高质量 AI 视频素材分享平台",
  url: "https://aivision.com",
  ogImage: "https://aivision.com/og.jpg",
  links: {
    twitter: "https://twitter.com/aivision",
    github: "https://github.com/aivision",
  },
}

export const APP_CONFIG = {
  PAGE_SIZE: 12,
  CURRENCY_SYMBOL: "¥",
  MAX_UPLOAD_SIZE: 500 * 1024 * 1024, // 500MB
  SUPPORTED_VIDEO_TYPES: ["video/mp4", "video/webm", "video/quicktime"],
}

export const AI_MODELS = [
  { value: "Sora", label: "Sora" },
  { value: "Runway Gen-2", label: "Runway Gen-2" },
  { value: "Pika Labs", label: "Pika Labs" },
  { value: "Stable Video Diffusion", label: "Stable Video Diffusion" },
  { value: "Midjourney", label: "Midjourney" },
  { value: "DALL-E 3", label: "DALL-E 3" },
  { value: "Other", label: "其他" }
] as const

export const VIDEO_RATIOS = [
  { value: "16:9", label: "横屏 16:9" },
  { value: "9:16", label: "竖屏 9:16 (手机专用)" }
] as const
