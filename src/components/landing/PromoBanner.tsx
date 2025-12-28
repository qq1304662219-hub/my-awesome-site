import { Button } from "@/components/ui/button";
import { Crown, Upload, CheckCircle2 } from "lucide-react";

export function PromoBanner() {
  return (
    <div className="container mx-auto px-4 mb-20 space-y-8">
      {/* VIP Banner */}
      <div className="rounded-2xl p-8 bg-gradient-to-r from-[#1a1f3c] to-[#0f1225] border border-blue-900/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/50">
                        <Crown className="text-white h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">升级会员，畅享所有高级素材</h3>
                        <p className="text-gray-400 text-sm">解锁 10000+ 精品AI视频素材，无水印下载，商用授权。</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-y-2 gap-x-8 max-w-lg ml-16">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                        <CheckCircle2 className="w-4 h-4 text-green-500" /> 无限制下载
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                        <CheckCircle2 className="w-4 h-4 text-green-500" /> 商用授权
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                        <CheckCircle2 className="w-4 h-4 text-green-500" /> 优先下载
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                        <CheckCircle2 className="w-4 h-4 text-green-500" /> 专属客服
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="text-right hidden md:block">
                    <div className="text-3xl font-bold text-white">¥29.9 <span className="text-sm text-gray-500 font-normal line-through">¥99.0</span></div>
                    <div className="text-xs text-blue-400">限时特惠</div>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-12 rounded-lg text-base shadow-lg shadow-blue-900/20">
                    立即开通会员
                </Button>
            </div>
        </div>
      </div>

      {/* Creator Banner */}
      <div className="rounded-2xl p-6 bg-gradient-to-r from-[#18181b] to-[#09090b] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center">
                <Upload className="text-white h-5 w-5" />
            </div>
            <div>
                <h3 className="text-lg font-bold text-white">成为创作者，分享变现AI视频作品</h3>
                <p className="text-gray-400 text-sm">上传原创素材，获取收益分成，建立个人品牌。</p>
            </div>
        </div>
        <Button variant="secondary" className="bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 border border-purple-500/30">
            立即上传
        </Button>
      </div>
    </div>
  );
}
