import { Navbar } from "@/components/landing/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Box, Cpu, Sparkles, Video, Zap, Layers } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

const iconMap: Record<string, any> = {
  'Sparkles': Sparkles,
  'Zap': Zap,
  'Video': Video,
  'Box': Box,
  'Cpu': Cpu,
  'Layers': Layers
};

const getIcon = (category: string) => {
  switch (category) {
    case 'Text-to-Video': return Sparkles;
    case 'Multi-Modal': return Zap;
    case 'Animation': return Video;
    case 'Image-to-Video': return Box;
    case 'Image Gen': return Cpu;
    default: return Layers;
  }
};

const getColor = (index: number) => {
  const colors = [
    { text: "text-purple-600 dark:text-purple-400", bg: "bg-purple-500/10 dark:bg-purple-500/20" },
    { text: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-500/10 dark:bg-yellow-500/20" },
    { text: "text-pink-600 dark:text-pink-400", bg: "bg-pink-500/10 dark:bg-pink-500/20" },
    { text: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10 dark:bg-blue-500/20" },
    { text: "text-green-600 dark:text-green-400", bg: "bg-green-500/10 dark:bg-green-500/20" },
    { text: "text-gray-600 dark:text-gray-400", bg: "bg-gray-500/10 dark:bg-gray-500/20" }
  ];
  return colors[index % colors.length];
};

export default async function ModelsPage() {
  const { data: models } = await supabase
    .from('ai_models')
    .select('*')
    .order('created_at', { ascending: true });

  const displayModels = models && models.length > 0 ? models : [];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <div className="flex-1 container mx-auto px-4 py-24">
        <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                AI 模型库
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                探索由世界顶尖 AI 模型生成的视频内容。选择你感兴趣的模型，发现无限创意。
            </p>
        </div>

        {displayModels.length === 0 ? (
           <div className="text-center text-muted-foreground py-12">
             <Box className="w-12 h-12 mx-auto mb-4 opacity-20" />
             <p>暂无模型数据，请联系管理员添加。</p>
           </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayModels.map((model, index) => {
                    const Icon = getIcon(model.category || '');
                    const style = getColor(index);
                    
                    return (
                        <Card key={model.id} className="bg-card border-border hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10 group">
                            <CardHeader>
                                <div className={`w-12 h-12 rounded-lg ${style.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                    <Icon className={`w-6 h-6 ${style.text}`} />
                                </div>
                                <CardTitle className="text-xl text-card-foreground group-hover:text-primary transition-colors">
                                    {model.name}
                                </CardTitle>
                                <div className="flex gap-2 flex-wrap mt-2">
                                    {model.tags?.map((tag: string) => (
                                        <span key={tag} className="text-xs px-2 py-1 rounded bg-secondary text-muted-foreground border border-border">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <CardDescription className="text-muted-foreground mb-6 h-12 line-clamp-2">
                                    {model.description}
                                </CardDescription>
                                <Link href={`/explore?model=${encodeURIComponent(model.name)}`}>
                                    <Button className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border group-hover:border-primary/30 group-hover:text-primary transition-colors">
                                        查看相关作品
                                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        )}</div>
      </div>
  );
}
