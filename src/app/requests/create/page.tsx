"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/landing/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Coins, AlertCircle, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import Link from "next/link";

export default function CreateRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    budget: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.budget) {
      toast.error("请填写完整信息");
      return;
    }

    const budget = parseFloat(formData.budget);
    if (isNaN(budget) || budget <= 0) {
      toast.error("请输入有效的悬赏金额");
      return;
    }

    setLoading(true);

    try {
      // Check auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("请先登录");
        router.push("/auth");
        return;
      }

      // Call RPC function
      const { data, error } = await supabase.rpc('create_request', {
        p_title: formData.title,
        p_description: formData.description,
        p_budget: budget
      });

      if (error) throw error;

      toast.success("任务发布成功！资金已冻结");
      router.push(`/requests/${data}`); // Redirect to new request page
    } catch (error: any) {
      console.error("Create request error:", error);
      if (error.message?.includes('Insufficient balance')) {
        toast.error("余额不足，请先充值");
      } else {
        toast.error("发布失败：" + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      
      <div className="flex-1 container mx-auto px-4 py-24 flex justify-center">
        <div className="w-full max-w-2xl">
          <Link href="/requests" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回任务大厅
          </Link>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <span className="bg-primary w-2 h-6 rounded-full inline-block" />
                发布悬赏任务
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                描述您的需求，设定悬赏金额，等待创作者投稿。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-foreground">任务标题</Label>
                  <Input 
                    id="title"
                    placeholder="例如：寻找一段赛博朋克风格的城市夜景视频" 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="bg-muted border-input text-foreground"
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-foreground">需求描述</Label>
                  <Textarea 
                    id="description"
                    placeholder="详细描述您的需求：画面内容、风格、时长、分辨率等..." 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="bg-muted border-input text-foreground min-h-[150px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget" className="text-foreground">悬赏金额 (A币)</Label>
                  <div className="relative">
                    <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                    <Input 
                      id="budget"
                      type="number"
                      placeholder="0.00" 
                      value={formData.budget}
                      onChange={(e) => setFormData({...formData, budget: e.target.value})}
                      className="bg-muted border-input text-foreground pl-10"
                      min="1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    发布后资金将被冻结，直到您采纳投稿或取消任务。
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6"
                  disabled={loading}
                >
                  {loading ? "发布中..." : "确认发布并支付"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
