"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Save, Globe, Shield, Coins, Bell, Server } from "lucide-react"

export default function AdminSettings() {
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState({
    siteName: "AI Vision",
    siteDescription: "专业的 AI 视频生成平台",
    maintenanceMode: false,
    registrationEnabled: true,
    announcement: "欢迎来到 AI Vision！",
    announcementEnabled: true,
    openaiKey: "sk-................",
    midjourneyKey: "mj-................",
    stripeKey: "pk_live_................",
    defaultCredits: 10,
    videoCost: 5
  })

  const handleSave = async () => {
    setLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setLoading(false)
    toast.success("系统设置已保存")
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">系统设置</h1>
        <p className="text-muted-foreground">管理平台全局参数配置</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-muted border border-border p-1">
          <TabsTrigger value="general" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
            <Globe className="w-4 h-4 mr-2" /> 常规设置
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
            <Shield className="w-4 h-4 mr-2" /> 安全访问
          </TabsTrigger>
          <TabsTrigger value="billing" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
            <Coins className="w-4 h-4 mr-2" /> 计费模型
          </TabsTrigger>
          <TabsTrigger value="keys" className="data-[state=active]:bg-background data-[state=active]:text-foreground">
            <Server className="w-4 h-4 mr-2" /> API 密钥
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4 mt-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">站点信息</CardTitle>
              <CardDescription>设置网站的基本显示信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-foreground">网站名称</Label>
                <Input 
                  value={settings.siteName}
                  onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                  className="bg-background border-input text-foreground" 
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-foreground">网站描述 (SEO)</Label>
                <Textarea 
                  value={settings.siteDescription}
                  onChange={(e) => setSettings({...settings, siteDescription: e.target.value})}
                  className="bg-background border-input text-foreground" 
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">全站公告</CardTitle>
              <CardDescription>在网站顶部显示通知横幅</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-foreground">启用公告</Label>
                <Switch 
                  checked={settings.announcementEnabled}
                  onCheckedChange={(c) => setSettings({...settings, announcementEnabled: c})}
                />
              </div>
              {settings.announcementEnabled && (
                <div className="grid gap-2 animate-in slide-in-from-top-2">
                  <Label className="text-foreground">公告内容</Label>
                  <Input 
                    value={settings.announcement}
                    onChange={(e) => setSettings({...settings, announcement: e.target.value})}
                    className="bg-background border-input text-foreground" 
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4 mt-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">访问控制</CardTitle>
              <CardDescription>管理用户注册和站点访问权限</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-foreground text-base">开放注册</Label>
                  <p className="text-sm text-muted-foreground">允许新用户注册账号</p>
                </div>
                <Switch 
                  checked={settings.registrationEnabled}
                  onCheckedChange={(c) => setSettings({...settings, registrationEnabled: c})}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-foreground text-base text-red-500">维护模式</Label>
                  <p className="text-sm text-muted-foreground">开启后仅管理员可访问，前台显示维护页</p>
                </div>
                <Switch 
                  checked={settings.maintenanceMode}
                  onCheckedChange={(c) => setSettings({...settings, maintenanceMode: c})}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Settings */}
        <TabsContent value="billing" className="space-y-4 mt-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">积分策略</CardTitle>
              <CardDescription>配置用户积分消耗规则</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-foreground">新用户赠送积分</Label>
                  <Input 
                    type="number"
                    value={settings.defaultCredits}
                    onChange={(e) => setSettings({...settings, defaultCredits: Number(e.target.value)})}
                    className="bg-background border-input text-foreground" 
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-foreground">生成视频消耗 (每秒)</Label>
                  <Input 
                    type="number"
                    value={settings.videoCost}
                    onChange={(e) => setSettings({...settings, videoCost: Number(e.target.value)})}
                    className="bg-background border-input text-foreground" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys */}
        <TabsContent value="keys" className="space-y-4 mt-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">服务密钥</CardTitle>
              <CardDescription>第三方服务 API 密钥配置 (敏感信息)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-foreground">OpenAI API Key</Label>
                <Input 
                  type="password"
                  value={settings.openaiKey}
                  onChange={(e) => setSettings({...settings, openaiKey: e.target.value})}
                  className="bg-background border-input text-foreground" 
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-foreground">Midjourney API Key</Label>
                <Input 
                  type="password"
                  value={settings.midjourneyKey}
                  onChange={(e) => setSettings({...settings, midjourneyKey: e.target.value})}
                  className="bg-background border-input text-foreground" 
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-foreground">Stripe Publishable Key</Label>
                <Input 
                  type="password"
                  value={settings.stripeKey}
                  onChange={(e) => setSettings({...settings, stripeKey: e.target.value})}
                  className="bg-background border-input text-foreground" 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end pt-4">
        <Button 
          onClick={handleSave} 
          disabled={loading}
          className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[120px]"
        >
          {loading ? (
            <>保存中...</>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" /> 保存更改
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
