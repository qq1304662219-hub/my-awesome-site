import { Video } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Video className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold text-foreground">AI Vision</span>
            </Link>
            <p className="text-muted-foreground text-sm">
                全球领先的AI视频素材共享平台，让创意无限可能。
            </p>
          </div>
          
          <div>
            <h4 className="font-bold text-foreground mb-4">导航</h4>
            <ul className="space-y-2 text-sm text-muted-foreground flex flex-col">
                <Link href="/" className="hover:text-foreground transition-colors">首页</Link>
                <Link href="/explore" className="hover:text-foreground transition-colors">浏览素材</Link>
                <Link href="/requests" className="hover:text-foreground transition-colors">悬赏任务</Link>
                <Link href="/classroom" className="hover:text-foreground transition-colors">创作课堂</Link>
                <Link href="/dashboard" className="hover:text-foreground transition-colors">上传作品</Link>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-foreground mb-4">支持</h4>
            <ul className="space-y-2 text-sm text-muted-foreground flex flex-col">
                <Link href="/help" className="hover:text-foreground transition-colors">帮助中心</Link>
                <Link href="/legal?tab=terms" className="hover:text-foreground transition-colors">用户协议</Link>
                <Link href="/legal?tab=privacy" className="hover:text-foreground transition-colors">隐私政策</Link>
                <Link href="/legal?tab=copyright" className="hover:text-foreground transition-colors">版权声明</Link>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-foreground mb-4">联系我们</h4>
            <ul className="space-y-2 text-sm text-muted-foreground flex flex-col">
                <li className="flex items-center gap-2">
                  <span className="text-blue-500">QQ:</span> 1304662219
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">WeChat:</span> yier060
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-500">QQ群:</span> 722542496
                </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-foreground mb-4">订阅更新</h4>
            <div className="flex gap-2">
                <Input 
                    type="email" 
                    placeholder="您的邮箱地址" 
                    className="bg-background border-input text-foreground focus-visible:ring-primary"
                />
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                    订阅
                </Button>
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
