import { Navbar } from "@/components/landing/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Calendar, Trophy, Users, ArrowRight, Flag } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

export const dynamic = 'force-dynamic';

const getStatusText = (status: string) => {
  switch (status) {
    case 'active': return '进行中';
    case 'upcoming': return '即将开始';
    case 'ended': return '已结束';
    default: return '未知状态';
  }
};

export default async function EventsPage() {
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false });
  
  const displayEvents = events || [];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <div className="flex-1 container mx-auto px-4 py-24">
        <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                精彩活动 & 挑战赛
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                参与社区挑战，赢取丰厚奖金，展示你的创意才华。
            </p>
        </div>

        {displayEvents.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
                <Flag className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>暂无活动数据，请联系管理员添加。</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {displayEvents.map((event) => (
                    <Card key={event.id} className="bg-card border-border overflow-hidden hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10 flex flex-col group/card">
                        <div className="h-48 overflow-hidden relative group bg-muted">
                            {event.cover_url ? (
                                <img 
                                    src={event.cover_url} 
                                    alt={event.title} 
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-muted">
                                    <Trophy className="w-16 h-16 text-muted-foreground/20" />
                                </div>
                            )}
                            <div className="absolute top-4 right-4">
                                <Badge className={`${
                                    event.status === 'active' ? 'bg-green-500 hover:bg-green-600' :
                                    event.status === 'upcoming' ? 'bg-blue-500 hover:bg-blue-600' :
                                    'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                } border-none`}>
                                    {getStatusText(event.status)}
                                </Badge>
                            </div>
                        </div>
                        <CardHeader>
                            <CardTitle className="text-xl text-card-foreground mb-2 group-hover/card:text-primary transition-colors">
                                {event.title}
                            </CardTitle>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {event.status === 'ended' ? '已结束' : `截止: ${event.end_date ? format(new Date(event.end_date), 'yyyy-MM-dd') : '待定'}`}
                                </span>
                                <span className="flex items-center gap-1 text-yellow-500 dark:text-yellow-400">
                                    <Trophy className="w-4 h-4" />
                                    {event.prize_pool || '奖金待定'}
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col">
                            <CardDescription className="text-muted-foreground mb-6 flex-1 line-clamp-3">
                                {event.description}
                            </CardDescription>
                            
                            <div className="flex items-center justify-between mt-auto">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Users className="w-4 h-4" />
                                    <span>0 人参与</span>
                                </div>
                                <Button disabled={event.status !== 'active'} className={`${
                                    event.status === 'active' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-muted text-muted-foreground'
                                }`}>
                                    {event.status === 'active' ? '立即报名' : event.status === 'upcoming' ? '敬请期待' : '查看结果'}
                                    {event.status === 'active' && <ArrowRight className="w-4 h-4 ml-2" />}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )}</div>
      </div>
  );
}
