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
  return (
    <div className="relative group h-full flex items-center px-2">
      {/* Trigger Area - Avatar */}
      <div className="cursor-pointer py-4">
        <Avatar className="h-9 w-9 border border-white/10 transition-transform group-hover:scale-105 group-hover:ring-2 group-hover:ring-blue-500/50">
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-blue-600 text-white">
                {user.email?.[0]?.toUpperCase()}
            </AvatarFallback>
        </Avatar>
      </div>

      {/* Hover Content */}
      <div className="absolute top-[calc(100%-10px)] right-0 pt-4 w-[320px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-in-out z-50">
        <div className="bg-[#0f172a] border border-white/10 rounded-xl shadow-2xl overflow-hidden p-5 backdrop-blur-xl bg-opacity-95">
            {/* Profile Info */}
            <div className="flex items-start gap-4 mb-6 relative">
                <Avatar className="h-14 w-14 border-2 border-white/10">
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-blue-600 text-white text-xl">
                        {user.email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-white truncate text-base">
                            {user.user_metadata?.full_name || user.email?.split('@')[0]}
                        </h3>
                        <div className="flex items-center gap-1">
                            <span className="bg-blue-500/20 text-[10px] px-1.5 py-0.5 rounded text-blue-300 border border-blue-500/10">
                                {profile?.role === 'admin' || profile?.role === 'super_admin' ? '管理员' : '创作者'}
                            </span>
                        </div>
                    </div>
                    <Link href="/dashboard/wallet" className="block hover:opacity-80 transition-opacity">
                    <p className="text-xs text-gray-400 cursor-pointer">
                        账户余额 <span className="text-white font-medium ml-1">¥{profile?.balance?.toFixed(2) || '0.00'}</span>
                    </p>
                </Link>
                </div>
                <Bell className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer absolute top-1 right-0" />
            </div>

            {/* Main Actions - Big Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <Link href="/dashboard" className="block group/btn">
                    <div className="bg-white/5 hover:bg-white/10 transition-colors rounded-lg py-3 px-2 text-center border border-white/5 group-hover/btn:border-white/20">
                        <span className="text-sm font-medium text-white block">创作者中心</span>
                    </div>
                </Link>
                <Link href="/dashboard/videos" className="block group/btn">
                    <div className="bg-white/5 hover:bg-white/10 transition-colors rounded-lg py-3 px-2 text-center border border-white/5 group-hover/btn:border-white/20">
                         <span className="text-sm font-medium text-white block">我的作品</span>
                    </div>
                </Link>
            </div>

            {/* Menu List */}
            <div className="space-y-1 mb-6">
                {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
                    <Link href="/admin/videos" className="flex items-center justify-between px-2 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 rounded-md transition-colors group/item">
                        <span className="flex items-center gap-2">🛡️ 管理后台</span>
                    </Link>
                )}
                <Link href="/settings" className="flex items-center justify-between px-2 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-md transition-colors group/item">
                    <span>账号设置</span>
                </Link>
                <Link href="/dashboard/wallet" className="flex items-center justify-between px-2 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-md transition-colors cursor-pointer group/item">
                    <span>充值中心</span>
                </Link>
                <Link href="/cart" className="flex items-center justify-between px-2 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-md transition-colors cursor-pointer group/item">
                    <span>我的购物车</span>
                </Link>
                <Link href="/invite" className="flex items-center justify-between px-2 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-md transition-colors cursor-pointer group/item">
                    <span className="text-yellow-400 font-medium">邀请有礼</span>
                </Link>
                <Link href="/dashboard/wallet" className="flex items-center justify-between px-2 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-md transition-colors cursor-pointer group/item">
                    <span>财务管理 (提现)</span>
                </Link>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-white/10 flex justify-end items-center text-xs text-gray-500 gap-4">
                <button onClick={onSignOut} className="hover:text-white transition-colors">
                    退出登录
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
