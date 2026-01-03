"use client"

import { useSearchParams } from "next/navigation"
import { Navbar } from "@/components/landing/Navbar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function LegalPage() {
  const searchParams = useSearchParams()
  const tab = searchParams.get("tab") || "terms"

  return (
    <main className="min-h-screen bg-[#020817] text-white">
      <Navbar />
      <div className="container mx-auto px-4 py-32 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 text-center">法律条款</h1>
        
        <Tabs defaultValue={tab} className="w-full">
          <TabsList className="w-full bg-white/5 border border-white/10 mb-8">
            <TabsTrigger value="terms" className="flex-1">用户协议</TabsTrigger>
            <TabsTrigger value="privacy" className="flex-1">隐私政策</TabsTrigger>
            <TabsTrigger value="copyright" className="flex-1">版权声明</TabsTrigger>
          </TabsList>

          <div className="prose prose-invert max-w-none bg-[#0f172a] p-8 rounded-xl border border-white/10">
            <TabsContent value="terms">
              <h2>1. 服务条款</h2>
              <p>欢迎使用 AI Vision。使用本服务即表示您同意遵守本协议。</p>
              <h3>1.1 账号注册</h3>
              <p>您需要注册账号才能使用上传和购买功能。请确保信息真实有效。</p>
              <h3>1.2 内容规范</h3>
              <p>禁止上传暴力、色情、反动等违法违规内容。</p>
              <h3>1.3 交易规则</h3>
              <p>所有交易均为最终交易，除非视频文件损坏或严重不符。</p>
            </TabsContent>

            <TabsContent value="privacy">
              <h2>隐私政策</h2>
              <p>我们非常重视您的隐私保护。</p>
              <h3>2.1 信息收集</h3>
              <p>我们收集您的邮箱、用户名和交易记录以提供服务。</p>
              <h3>2.2 信息使用</h3>
              <p>我们不会向第三方出售您的个人信息。</p>
            </TabsContent>

            <TabsContent value="copyright">
              <h2>版权声明</h2>
              <p>AI Vision 尊重知识产权。</p>
              <h3>3.1 原创保护</h3>
              <p>创作者保留其作品的版权。购买者获得使用许可。</p>
              <h3>3.2 侵权处理</h3>
              <p>如发现侵权内容，请联系 admin@aivision.com。</p>
            </TabsContent>
          </div>
        </Tabs>
      </div>
      <Footer />
    </main>
  )
}
