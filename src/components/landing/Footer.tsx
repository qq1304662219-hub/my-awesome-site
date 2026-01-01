import { Video } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#020817] py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <Video className="h-6 w-6 text-blue-500" />
                <span className="text-xl font-bold text-white">AI Vision</span>
            </Link>
            <p className="text-gray-400 text-sm">
                全球领先的AI视频素材共享平台，让创意无限可能。
            </p>
          </div>
          
          <div>
            <h4 className="font-bold text-white mb-4">导航</h4>
            <ul className="space-y-2 text-sm text-gray-400 flex flex-col">
                <Link href="/" className="hover:text-white transition-colors">首页</Link>
                <Link href="/explore" className="hover:text-white transition-colors">浏览素材</Link>
                <Link href="/requests" className="hover:text-white transition-colors">悬赏任务</Link>
                <Link href="/classroom" className="hover:text-white transition-colors">创作课堂</Link>
                <Link href="/dashboard" className="hover:text-white transition-colors">上传作品</Link>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">支持</h4>
            <ul className="space-y-2 text-sm text-gray-400 flex flex-col">
                <Link href="/help" className="hover:text-white transition-colors">帮助中心</Link>
                <Link href="/legal?tab=terms" className="hover:text-white transition-colors">用户协议</Link>
                <Link href="/legal?tab=privacy" className="hover:text-white transition-colors">隐私政策</Link>
                <Link href="/legal?tab=copyright" className="hover:text-white transition-colors">版权声明</Link>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">订阅更新</h4>
            <div className="flex gap-2">
                <input 
                    type="email" 
                    placeholder="您的邮箱地址" 
                    className="bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white w-full focus:outline-none focus:border-blue-500"
                />
                <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded transition-colors">
                    订阅
                </button>
            </div>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
            <p>© 2025 AI Vision. 保留所有权利。</p>
            <div className="flex gap-4">
                <Link href="/legal?tab=terms" className="hover:text-white transition-colors">使用条款</Link>
                <Link href="/legal?tab=privacy" className="hover:text-white transition-colors">Cookie 政策</Link>
                <Link href="/legal?tab=contact" className="hover:text-white transition-colors">商务合作</Link>
            </div>
        </div>
      </div>
    </footer>
  );
}
