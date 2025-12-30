import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"

export default function LegalPage({ searchParams }: { searchParams: { tab?: string } }) {
  const tab = searchParams.tab || 'terms'
  
  const content: Record<string, { title: string, body: string }> = {
    terms: {
      title: "用户协议",
      body: "欢迎使用 AI Vision。本协议是您与 AI Vision 之间关于使用本平台服务的法律协议..."
    },
    privacy: {
      title: "隐私政策",
      body: "我们非常重视您的隐私。本政策旨在说明我们如何收集、使用和保护您的个人信息..."
    },
    copyright: {
      title: "版权声明",
      body: "AI Vision 尊重知识产权。如果您认为平台上的内容侵犯了您的权益，请联系我们..."
    },
    about: {
      title: "关于我们",
      body: "AI Vision 是全球领先的 AI 视频生成与分享平台，致力于为创作者提供最好的工具..."
    },
    contact: {
      title: "联系我们",
      body: "如果您有任何问题或建议，请发送邮件至 support@aivision.com"
    }
  }

  const current = content[tab] || content.terms

  return (
    <div className="min-h-screen bg-[#020817] text-white flex flex-col">
      <Navbar simple />
      <div className="container mx-auto px-4 py-24 flex-1">
         <h1 className="text-3xl font-bold mb-8">{current.title}</h1>
         <div className="prose prose-invert max-w-none bg-[#1a1f2e] p-8 rounded-lg border border-white/10">
            <p className="whitespace-pre-wrap">{current.body}</p>
         </div>
      </div>
      <Footer />
    </div>
  )
}
