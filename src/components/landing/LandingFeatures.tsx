"use client"

import { motion } from "framer-motion"
import { Zap, Shield, Cloud } from "lucide-react"

const features = [
  {
    icon: <Zap className="h-8 w-8 text-yellow-400" />,
    title: "极速生成与访问",
    description: "全球边缘网络加速，毫秒级加载体验。即时预览，无需等待。"
  },
  {
    icon: <Shield className="h-8 w-8 text-green-400" />,
    title: "企业级安全保障",
    description: "数据加密传输，隐私严格保护。您的创意资产归您所有，安全无忧。"
  },
  {
    icon: <Cloud className="h-8 w-8 text-blue-400" />,
    title: "无限云端存储",
    description: "海量素材云端同步，随时随地访问。支持多种格式，轻松管理。"
  }
]

export function LandingFeatures() {
  return (
    <section id="features" className="py-32 relative">
      <div className="container px-4 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all group"
            >
              <div className="mb-6 p-4 rounded-xl bg-white/5 w-fit group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
