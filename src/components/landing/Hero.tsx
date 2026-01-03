"use client"

import { Button } from "@/components/ui/button";
import { PlayCircle, Sparkles } from "lucide-react";
import Link from "next/link";

export function Hero() {
  return (
    <div className="relative pt-32 pb-20 overflow-hidden bg-background">
  {/* Background Effects */}
  <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] pointer-events-none" />
  <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] pointer-events-none" />
  
  <div className="container mx-auto px-4 relative z-10">
    <div className="max-w-4xl mx-auto text-center">
      <div className="relative rounded-2xl overflow-hidden border border-border bg-card/40 backdrop-blur-sm p-8 md:p-16 mb-12 group">
         {/* Simulating the city background image */}
         <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1535868463750-c78d9543614f?q=80&w=2676&auto=format&fit=crop')] bg-cover bg-center opacity-40 group-hover:opacity-50 transition-opacity duration-700" />
         <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
         
         <div className="relative z-10">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 tracking-tight">
              探索 AI 创作的<br/>
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">无限可能</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              百万精选 AI 视频素材，助力您的创意项目，高效产出专业级作品
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/explore">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8">
                  <Sparkles className="mr-2 h-4 w-4" />
                  立即探索
                </Button>
              </Link>
              <Link href="/#features">
                <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-accent hover:text-accent-foreground bg-background/20 backdrop-blur-sm rounded-full px-8">
                  <PlayCircle className="mr-2 h-4 w-4" />
                  了解更多
                </Button>
              </Link>
            </div>
         </div>
      </div>
    </div>
  </div>
</div>
  );
}
