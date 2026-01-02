"use client"

import { Video } from "lucide-react"
import Link from "next/link"

export function Footer() {
    return (
        <footer className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-12">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="space-y-4">
                        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <Video className="h-6 w-6 text-blue-500" />
                            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                                AI Vision
                            </span>
                        </Link>
                        <p className="text-sm text-muted-foreground">
                            探索 AI 视频生成的无限可能，连接创作者与未来的桥梁。
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <h3 className="font-semibold mb-4">平台</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/discover" className="hover:text-foreground transition-colors">发现</Link></li>
                            <li><Link href="/explore" className="hover:text-foreground transition-colors">素材</Link></li>
                            <li><Link href="/creators" className="hover:text-foreground transition-colors">创作者</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-4">资源</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/models" className="hover:text-foreground transition-colors">大模型</Link></li>
                            <li><Link href="/classroom" className="hover:text-foreground transition-colors">课堂</Link></li>
                            <li><Link href="/events" className="hover:text-foreground transition-colors">活动</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-4">支持</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li><Link href="/help" className="hover:text-foreground transition-colors">帮助中心</Link></li>
                            <li><Link href="/terms" className="hover:text-foreground transition-colors">服务条款</Link></li>
                            <li><Link href="/privacy" className="hover:text-foreground transition-colors">隐私政策</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
                    <p>© {new Date().getFullYear()} AI Vision. All rights reserved.</p>
                    <p>Powered by Trae & Gemini</p>
                </div>
            </div>
        </footer>
    )
}
