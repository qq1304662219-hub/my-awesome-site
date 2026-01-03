"use client"

import { useState } from "react"
import { Navbar } from "@/components/landing/Navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
    CheckCircle, 
    Trophy, 
    BarChart3, 
    ShieldCheck, 
    Wallet, 
    Globe, 
    ArrowRight, 
    Upload, 
    Users, 
    Video,
    Sparkles,
    Zap,
    Crown
} from "lucide-react"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/store/useAuthStore"
import { cn } from "@/lib/utils"

export default function CertificationPage() {
    const { user } = useAuthStore()
    const [isApplyOpen, setIsApplyOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [selectedType, setSelectedType] = useState<"individual" | "organization">("individual")
    const [applicationForm, setApplicationForm] = useState({
        portfolio: "",
        bio: "",
        social: ""
    })

    const handleApplyClick = (type: "individual" | "organization") => {
        if (!user) {
            toast.error("请先登录")
            return
        }
        setSelectedType(type)
        setIsApplyOpen(true)
    }

    const submitApplication = async () => {
        if (!applicationForm.portfolio || !applicationForm.bio) {
             toast.error("请填写完整信息")
             return
        }

        setLoading(true)
        try {
            const { error } = await supabase
                .from('creator_applications')
                .insert({
                    user_id: user!.id,
                    portfolio_url: applicationForm.portfolio,
                    bio: applicationForm.bio,
                    social_links: { 
                        other: applicationForm.social,
                        type: selectedType 
                    },
                    status: 'pending'
                })
            
            if (error) throw error
            
            toast.success("申请已提交，请等待审核")
            setIsApplyOpen(false)
            setApplicationForm({ portfolio: "", bio: "", social: "" })
        } catch (e) {
            console.error(e)
            toast.error("提交失败，请重试")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
            <Navbar />

            {/* Hero Section */}
            <div className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-background pointer-events-none" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
                
                <div className="container mx-auto px-4 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-6">
                        <Sparkles className="w-4 h-4" />
                        <span>AI Vision 官方认证体系升级</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground via-blue-500 to-purple-600">
                        认证中心
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
                        加入全球顶尖 AI 影像创作者行列，获取专属身份标识，开启无限创意可能与商业价值。
                    </p>
                </div>
            </div>

            {/* Certification Types */}
            <div className="container mx-auto px-4 pb-24">
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Individual */}
                    <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardContent className="p-8 relative">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <UserBadge className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-2xl font-bold text-foreground mb-2">个人创作者认证</h3>
                            <p className="text-muted-foreground mb-6 min-h-[48px]">适合独立 AI 艺术家、视频创作者、设计师申请，彰显个人专业影响力。</p>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center text-sm text-muted-foreground">
                                    <CheckCircle className="w-4 h-4 text-primary mr-2" />
                                    专属黄V身份标识
                                </li>
                                <li className="flex items-center text-sm text-muted-foreground">
                                    <CheckCircle className="w-4 h-4 text-primary mr-2" />
                                    作品优先推荐
                                </li>
                                <li className="flex items-center text-sm text-muted-foreground">
                                    <CheckCircle className="w-4 h-4 text-primary mr-2" />
                                    商业接单权益
                                </li>
                            </ul>
                            <Button className="w-full bg-primary hover:bg-primary/90" onClick={() => handleApplyClick("individual")}>
                                立即申请
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Organization */}
                    <Card className="bg-card border-border hover:border-purple-500/50 transition-all duration-300 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardContent className="p-8 relative">
                            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <BuildingBadge className="w-8 h-8 text-purple-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-foreground mb-2">机构/团队认证</h3>
                            <p className="text-muted-foreground mb-6 min-h-[48px]">适合设计工作室、MCN 机构、影视公司申请，打造企业级品牌形象。</p>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center text-sm text-muted-foreground">
                                    <CheckCircle className="w-4 h-4 text-purple-500 mr-2" />
                                    专属蓝V机构标识
                                </li>
                                <li className="flex items-center text-sm text-muted-foreground">
                                    <CheckCircle className="w-4 h-4 text-purple-500 mr-2" />
                                    多账号管理权限
                                </li>
                                <li className="flex items-center text-sm text-muted-foreground">
                                    <CheckCircle className="w-4 h-4 text-purple-500 mr-2" />
                                    企业级服务支持
                                </li>
                            </ul>
                            <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={() => handleApplyClick("organization")}>
                                立即申请
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Benefits Grid */}
            <div className="bg-muted/30 py-20 border-y border-border">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-foreground mb-4">认证权益</h2>
                        <p className="text-muted-foreground">成为认证创作者，享受全方位的平台赋能</p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-6">
                        {[
                            { icon: Trophy, title: "官方身份认证", desc: "独特身份标识，提升行业影响力与可信度" },
                            { icon: Zap, title: "流量扶持", desc: "优质作品首页优先推荐，亿级流量曝光" },
                            { icon: Wallet, title: "商业变现", desc: "开通付费图库权限，优先承接商业定制需求" },
                            { icon: BarChart3, title: "数据洞察", desc: "专属创作者数据中心，全维度分析作品表现" },
                            { icon: Crown, title: "高清画质", desc: "支持 4K 超清视频上传，展现极致细节" },
                            { icon: Upload, title: "无限空间", desc: "单文件大小上限提升至 10GB，无限存储空间" },
                            { icon: Globe, title: "全球分发", desc: "作品同步分发至海外站点，获取全球关注" },
                            { icon: Users, title: "行业交流", desc: "加入官方高阶创作者社群，连接行业大咖" },
                        ].map((item, i) => (
                            <div key={i} className="bg-card p-6 rounded-xl border border-border hover:border-primary/50 transition-colors">
                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                                    <item.icon className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Application Dialog */}
            <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
                <DialogContent className="sm:max-w-[600px] bg-card border-border text-foreground">
                    <DialogHeader>
                        <DialogTitle className="text-xl">
                            申请成为{selectedType === 'individual' ? '个人' : '机构'}认证创作者
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            请填写真实信息，我们将于 1-3 个工作日内完成审核。
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label>作品集链接 (Behance, ArtStation, VJshi, etc)</Label>
                            <Input 
                                placeholder="https://..." 
                                className="bg-muted border-input text-foreground placeholder:text-muted-foreground focus:border-primary"
                                value={applicationForm.portfolio}
                                onChange={(e) => setApplicationForm({...applicationForm, portfolio: e.target.value})}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>个人简介 / 创作风格</Label>
                            <Textarea 
                                placeholder="专注于科幻风格 AI 视频创作，擅长使用 Midjourney + Runway..." 
                                className="bg-muted border-input text-foreground placeholder:text-muted-foreground min-h-[100px] focus:border-primary"
                                value={applicationForm.bio}
                                onChange={(e) => setApplicationForm({...applicationForm, bio: e.target.value})}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>其他社交媒体 (可选)</Label>
                            <Input 
                                placeholder="Twitter / Instagram / Bilibili / 小红书" 
                                className="bg-muted border-input text-foreground placeholder:text-muted-foreground focus:border-primary"
                                value={applicationForm.social}
                                onChange={(e) => setApplicationForm({...applicationForm, social: e.target.value})}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsApplyOpen(false)} className="border-border hover:bg-muted text-muted-foreground">
                            取消
                        </Button>
                        <Button onClick={submitApplication} disabled={loading} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                            {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />}
                            提交申请
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

</div>
    )
}

function UserBadge({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
        </svg>
    )
}

function BuildingBadge({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path fillRule="evenodd" d="M3 2.25a.75.75 0 00-.75.75v18a.75.75 0 00.75.75h18a.75.75 0 00.75-.75V3a.75.75 0 00-.75-.75H3zm6 3.75a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0V6.75A.75.75 0 019 6zm6.75.75a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0V6.75zM9 10.5a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5a.75.75 0 01.75-.75zm6.75.75a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0v-1.5zM9 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 019 15zm6.75.75a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0v-1.5z" clipRule="evenodd" />
        </svg>
    )
}
