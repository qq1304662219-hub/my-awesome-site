import { Video } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          <div className="space-y-4 sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Video className="h-6 w-6 text-blue-500" />
                <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">AI Vision</span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
                探索 AI 视频生成的无限可能，连接创作者与未来的桥梁。
            </p>
          </div>
          
          <div>
            <h4 className="font-bold text-foreground mb-4">导航</h4>
            <ul className="space-y-2 text-sm text-muted-foreground flex flex-col">
                <Link href="/" className="hover:text-primary transition-colors">首页</Link>
                <Link href="/explore" className="hover:text-primary transition-colors">浏览素材</Link>
                <Link href="/requests" className="hover:text-primary transition-colors">悬赏任务</Link>
                <Link href="/classroom" className="hover:text-primary transition-colors">创作课堂</Link>
                <Link href="/dashboard" className="hover:text-primary transition-colors">上传作品</Link>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-foreground mb-4">支持</h4>
            <ul className="space-y-2 text-sm text-muted-foreground flex flex-col">
                <Link href="/help" className="hover:text-primary transition-colors">帮助中心</Link>
                <Link href="/legal?tab=terms" className="hover:text-primary transition-colors">用户协议</Link>
                <Link href="/legal?tab=privacy" className="hover:text-primary transition-colors">隐私政策</Link>
                <Link href="/legal?tab=copyright" className="hover:text-primary transition-colors">版权声明</Link>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-foreground mb-4">联系我们</h4>
            <ul className="space-y-2 text-sm text-muted-foreground flex flex-col">
                <li className="flex items-center gap-2">
                  <span className="text-blue-500 font-medium">QQ:</span> 1304662219
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500 font-medium">WeChat:</span> yier060
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-500 font-medium">QQ群:</span> 722542496
                </li>
            </ul>
          </div>

          <div className="sm:col-span-2 lg:col-span-1">
            <h4 className="font-bold text-foreground mb-4">订阅更新</h4>
            <div className="flex flex-col gap-2">
                <p className="text-xs text-muted-foreground mb-1">获取最新的AI视频趋势和独家素材。</p>
                <div className="flex gap-2">
                    <Input 
                        type="email" 
                        placeholder="您的邮箱地址" 
                        className="bg-background border-input text-foreground focus-visible:ring-primary h-9"
                    />
                    <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 h-9">
                        订阅
                    </Button>
                </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} AI Vision. 保留所有权利。</p>
            <div className="flex gap-4">
                <Link href="/legal?tab=terms" className="hover:text-foreground transition-colors">使用条款</Link>
                <Link href="/legal?tab=privacy" className="hover:text-foreground transition-colors">Cookie 政策</Link>
                <Link href="/legal?tab=contact" className="hover:text-foreground transition-colors">商务合作</Link>
            </div>
        </div>
      </div>
    </footer>
  );
}
