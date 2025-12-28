import { Video } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#020817] py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Video className="h-6 w-6 text-blue-500" />
                <span className="text-xl font-bold text-white">AI Vision</span>
            </div>
            <p className="text-gray-400 text-sm">
                全球领先的AI视频素材共享平台，让创意无限可能。
            </p>
          </div>
          
          <div>
            <h4 className="font-bold text-white mb-4">导航</h4>
            <ul className="space-y-2 text-sm text-gray-400">
                <li className="hover:text-white cursor-pointer">首页</li>
                <li className="hover:text-white cursor-pointer">浏览素材</li>
                <li className="hover:text-white cursor-pointer">上传作品</li>
                <li className="hover:text-white cursor-pointer">关于我们</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">支持</h4>
            <ul className="space-y-2 text-sm text-gray-400">
                <li className="hover:text-white cursor-pointer">帮助中心</li>
                <li className="hover:text-white cursor-pointer">用户协议</li>
                <li className="hover:text-white cursor-pointer">隐私政策</li>
                <li className="hover:text-white cursor-pointer">版权声明</li>
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
                <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded">
                    订阅
                </button>
            </div>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
            <p>© 2024 AI Vision. 保留所有权利。</p>
            <div className="flex gap-4">
                <span>使用条款</span>
                <span>Cookie 政策</span>
                <span>商务合作</span>
            </div>
        </div>
      </div>
    </footer>
  );
}
