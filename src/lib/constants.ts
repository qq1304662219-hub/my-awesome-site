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

export const CATEGORIES = [
  { label: "自然风光", value: "nature" },
  { label: "城市建筑", value: "architecture" },
  { label: "人物/角色", value: "character" },
  { label: "动物/生物", value: "animals" },
  { label: "特效/纹理", value: "vfx" },
  { label: "交通/科技", value: "tech" },
]

export const STYLES = [
  { label: "摄影写实", value: "photorealistic" },
  { label: "3D / CG", value: "3d_cg" },
  { label: "赛博/科幻", value: "cyberpunk" },
  { label: "二次元/动漫", value: "anime" },
  { label: "艺术/绘画", value: "artistic" },
  { label: "抽象/超现实", value: "abstract" },
]

export const AI_MODELS = [
  { label: "Sora (OpenAI)", value: "sora" },
  { label: "Runway Gen-3 Alpha", value: "runway_gen3" },
  { label: "Luma Dream Machine", value: "luma" },
  { label: "Pika Art", value: "pika" },
  { label: "可灵 (Kling)", value: "kling" },
  { label: "即梦 (Jimeng)", value: "jimeng" },
  { label: "智谱 CogVideo", value: "cogvideo" },
  { label: "海螺 (Hailuo)", value: "hailuo" },
  { label: "Stable Video Diffusion", value: "svd" },
  { label: "AnimateDiff", value: "animatediff" },
  { label: "Midjourney", value: "midjourney" },
]

export const MOVEMENTS = [
  { label: "静态/微动", value: "static" },
  { label: "平移", value: "pan" },
  { label: "推拉", value: "zoom" },
  { label: "升降", value: "tilt" },
  { label: "环绕", value: "orbit" },
  { label: "第一人称", value: "fpv" },
  { label: "形变/转场", value: "morph" },
]

export const RATIOS = [
  { label: "16:9", value: "16:9" },
  { label: "9:16", value: "9:16" },
  { label: "1:1", value: "1:1" },
  { label: "21:9", value: "21:9" },
  { label: "4:3", value: "4:3" },
]

export const RESOLUTIONS = [
  { label: "720P及以下", value: "720p_low" },
  { label: "1080P", value: "1080p" },
  { label: "2K", value: "2k" },
  { label: "4K", value: "4k" },
  { label: "8K", value: "8k" },
]

export const DURATIONS = [
  { label: "< 3秒", value: "under_3s" },
  { label: "3 - 5秒", value: "3_5s" },
  { label: "5 - 10秒", value: "5_10s" },
  { label: "> 10秒", value: "over_10s" },
]

export const FPS_OPTIONS = [
  { label: "< 24 fps", value: "under_24" },
  { label: "24 fps", value: "24" },
  { label: "25 fps", value: "25" },
  { label: "30 fps", value: "30" },
  { label: "60 fps及以上", value: "over_60" },
]

// Deprecated but kept for backward compatibility if needed temporarily
export const VIDEO_RATIOS = RATIOS
