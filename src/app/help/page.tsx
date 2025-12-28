import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, HelpCircle, Mail, MessageCircle } from "lucide-react";

export default function HelpPage() {
  const faqs = [
    {
      question: "如何下载视频素材？",
      answer: "在视频详情页或列表中，点击下载图标即可直接下载原始分辨率的视频文件。部分高清素材可能需要登录后才能下载。"
    },
    {
      question: "这些视频可以商用吗？",
      answer: "平台上的大部分 AI 生成视频遵循 CC0 协议或宽松的商用许可，但具体请参考每个视频下方的版权说明。建议在使用前仔细阅读。"
    },
    {
      question: "如何上传我生成的 AI 视频？",
      answer: "注册并登录账户后，点击右上角的“上传素材”按钮，填写视频标题并上传文件即可。目前支持 MP4 和 MOV 格式。"
    },
    {
      question: "支持哪些 AI 工具生成的视频？",
      answer: "我们要支持所有主流 AI 视频生成工具的作品，包括 Sora, Runway Gen-2, Pika Labs, Stable Video Diffusion 等。"
    },
    {
      question: "账号无法登录怎么办？",
      answer: "请检查您的网络连接。如果使用 Google 登录遇到问题，请确保您的浏览器没有拦截弹出窗口。如果问题持续，请联系客服。"
    }
  ];

  return (
    <main className="min-h-screen bg-[#020817] text-foreground">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative py-24 px-4 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/20 rounded-full blur-[128px] pointer-events-none" />
        
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <Badge variant="outline" className="mb-4 text-blue-400 border-blue-500/30 bg-blue-500/10">帮助中心</Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">我们能为您做些什么？</h1>
          <p className="text-xl text-gray-400 mb-10">搜索常见问题，或直接联系我们的支持团队</p>
          
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input 
              className="w-full h-14 pl-12 pr-4 bg-white/5 border-white/10 text-white rounded-full text-lg focus-visible:ring-blue-500 placeholder:text-gray-500 shadow-2xl"
              placeholder="搜索问题关键词..." 
            />
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="container mx-auto px-4 max-w-3xl mb-24">
        <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
          <HelpCircle className="text-blue-500" /> 常见问题
        </h2>
        
        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border border-white/10 bg-white/5 rounded-lg px-4 data-[state=open]:bg-white/10 transition-colors">
              <AccordionTrigger className="text-white hover:no-underline hover:text-blue-400 text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-400 leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Contact Section */}
      <div className="container mx-auto px-4 max-w-4xl mb-24">
        <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-white/10 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">没找到答案？</h2>
          <p className="text-gray-400 mb-8">我们的团队随时为您提供帮助，请通过以下方式联系我们。</p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button className="bg-blue-600 hover:bg-blue-700 h-12 px-8">
              <Mail className="mr-2 h-4 w-4" />
              发送邮件
            </Button>
            <Button variant="outline" className="border-white/10 hover:bg-white/10 text-white h-12 px-8">
              <MessageCircle className="mr-2 h-4 w-4" />
              在线客服
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}

import { Badge } from "@/components/ui/badge";
