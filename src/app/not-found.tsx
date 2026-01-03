"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, Compass, Users, HelpCircle, ArrowLeft } from "lucide-react"
import { Navbar } from "@/components/landing/Navbar"
import { Footer } from "@/components/landing/Footer"
import { motion } from "framer-motion"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
      <Navbar />
      
      <main className="flex-1 flex flex-col items-center justify-center p-4 w-full max-w-7xl mx-auto relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] -z-10" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] -z-10" />

        <div className="w-full max-w-2xl text-center space-y-8 z-10 py-12 md:py-0">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative inline-block"
            >
                <h1 className="text-[120px] md:text-[200px] font-black leading-none bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent bg-300% animate-gradient">
                    404
                </h1>
                <motion.div 
                    initial={{ rotate: -10 }}
                    animate={{ rotate: 10 }}
                    transition={{ repeat: Infinity, repeatType: "reverse", duration: 2 }}
                    className="absolute -top-4 -right-4 md:-right-8 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded shadow-lg transform rotate-12"
                >
                    Lost?
                </motion.div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="space-y-4"
            >
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                    哎呀，页面走丢了
                </h2>
                <p className="text-muted-foreground text-lg max-w-md mx-auto">
                    您访问的页面似乎已经消失在数字宇宙的黑洞中，或者从未存在过。
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
                <Link href="/">
                    <Button size="lg" className="rounded-full h-12 px-8 text-base bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 w-full sm:w-auto">
                        <Home className="mr-2 h-5 w-5" />
                        返回首页
                    </Button>
                </Link>
                <Button 
                    variant="outline" 
                    size="lg" 
                    className="rounded-full h-12 px-8 text-base bg-background/50 backdrop-blur-sm hover:bg-accent w-full sm:w-auto"
                    onClick={() => window.history.back()}
                >
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    返回上一页
                </Button>
            </motion.div>

            {/* Quick Links */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="pt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-lg mx-auto"
            >
                <Link href="/discover">
                    <div className="p-4 rounded-xl bg-card/50 border border-border/50 hover:bg-card hover:border-border hover:shadow-md transition-all group cursor-pointer text-center">
                        <Compass className="h-6 w-6 mx-auto mb-2 text-blue-500 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium text-foreground">探索发现</span>
                    </div>
                </Link>
                <Link href="/creators">
                    <div className="p-4 rounded-xl bg-card/50 border border-border/50 hover:bg-card hover:border-border hover:shadow-md transition-all group cursor-pointer text-center">
                        <Users className="h-6 w-6 mx-auto mb-2 text-purple-500 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium text-foreground">热门创作者</span>
                    </div>
                </Link>
                <Link href="/help">
                    <div className="p-4 rounded-xl bg-card/50 border border-border/50 hover:bg-card hover:border-border hover:shadow-md transition-all group cursor-pointer text-center">
                        <HelpCircle className="h-6 w-6 mx-auto mb-2 text-green-500 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium text-foreground">帮助中心</span>
                    </div>
                </Link>
            </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
