"use client"
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { UserProfile } from "@/store/useAuthStore";

interface UserHoverMenuProps {
  user: User;
  profile?: UserProfile | null;
  onSignOut: () => void;
}

export function UserHoverMenu({ user, profile, onSignOut }: UserHoverMenuProps) {
  // Prefer profile data over user metadata
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url;
  const displayName = profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0];

  const formatBalance = (balance: number | undefined) => {
    if (balance === undefined || balance === null) return '0.00';
    // Handle extremely large numbers or scientific notation
    if (balance > 99999999 || balance.toString().includes('e')) return '99,999,999+';
    return balance.toFixed(2);
  };

  return (
    <div className="relative group h-full flex items-center px-2">
      {/* Trigger Area - Avatar */}
      <div className="cursor-pointer py-4">
        <Avatar className="h-9 w-9 border border-border transition-transform group-hover:scale-105 group-hover:ring-2 group-hover:ring-primary/20">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="bg-primary text-primary-foreground">
                {user.email?.[0]?.toUpperCase()}
            </AvatarFallback>
        </Avatar>
      </div>

      {/* Hover Content */}
      <div className="absolute top-[calc(100%-10px)] right-0 pt-4 w-[320px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-in-out z-50">
        <div className="bg-popover border border-border rounded-xl shadow-2xl overflow-hidden p-5 backdrop-blur-xl bg-opacity-95">
            {/* Profile Info */}
            <div className="flex items-start gap-4 mb-6 relative">
                <Avatar className="h-14 w-14 border-2 border-border">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                        {user.email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-foreground truncate text-base">
                            {displayName}
                        </h3>
                        <div className="flex items-center gap-1">
                            <span className="bg-primary/10 text-[10px] px-1.5 py-0.5 rounded text-primary border border-primary/20">
                                {profile?.role === 'admin' || profile?.role === 'super_admin' ? '管理员' : '创作者'}
                            </span>
                        </div>
                    </div>
                    <Link href="/dashboard/wallet" className="block hover:opacity-80 transition-opacity">
                    <p className="text-xs text-muted-foreground cursor-pointer">
                        账户余额 <span className="text-foreground font-medium ml-1">¥{formatBalance(profile?.balance)}</span>
                    </p>
                </Link>
                </div>
                <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground cursor-pointer absolute top-1 right-0" />
            </div>

            {/* Main Actions - Big Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <Link href="/dashboard" className="block group/btn">
                    <div className="bg-secondary/50 hover:bg-secondary transition-colors rounded-lg py-3 px-2 text-center border border-border group-hover/btn:border-primary/20">
                        <span className="text-sm font-medium text-foreground block">创作者中心</span>
                    </div>
                </Link>
                <Link href="/dashboard/videos" className="block group/btn">
                    <div className="bg-secondary/50 hover:bg-secondary transition-colors rounded-lg py-3 px-2 text-center border border-border group-hover/btn:border-primary/20">
                         <span className="text-sm font-medium text-foreground block">我的作品</span>
                    </div>
                </Link>
            </div>

            {/* Menu List */}
            <div className="space-y-1 mb-6">
                {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
                    <Link href="/admin/videos" className="flex items-center justify-between px-2 py-2 text-sm text-destructive hover:text-destructive hover:bg-accent rounded-md transition-colors group/item">
                        <span className="flex items-center gap-2">🛡️ 管理后台</span>
                    </Link>
                )}
                <Link href="/settings" className="flex items-center justify-between px-2 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors group/item">
                    <span>账号设置</span>
                </Link>
                <Link href="/dashboard/wallet" className="flex items-center justify-between px-2 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors cursor-pointer group/item">
                    <span>我的钱包</span>
                </Link>
                <Link href="/cart" className="flex items-center justify-between px-2 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors cursor-pointer group/item">
                    <span>我的购物车</span>
                </Link>
                <Link href="/dashboard/invite" className="flex items-center justify-between px-2 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors cursor-pointer group/item">
                    <span className="text-yellow-600 dark:text-yellow-400 font-medium">邀请有礼</span>
                </Link>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-border flex justify-end items-center text-xs text-muted-foreground gap-4">
                <button onClick={onSignOut} className="hover:text-foreground transition-colors">
                    退出登录
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
