'use client'
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Search, Shield, User, UserCheck, UserMinus, ArrowUpCircle, ArrowDownCircle } from "lucide-react"
import { toast } from "sonner"
import { useAuthStore } from "@/store/useAuthStore"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function AdminUsers() {
  const { profile } = useAuthStore()
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    // Double check permission on client side
    if (profile && profile.role !== 'super_admin') {
      toast.error("无权访问团队管理")
      router.push('/admin')
      return
    }
    fetchUsers()
  }, [profile, router])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })

      if (search) {
        query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
      }

      const { data, error } = await query
      if (error) throw error
      
      setUsers(data || [])
    } catch (error) {
      console.error("Error fetching users:", error)
      toast.error("加载用户列表失败")
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'user') => {
    if (!confirm(`确定要将该用户${newRole === 'admin' ? '提拔为管理员' : '降职为普通用户'}吗？`)) return

    setUpdating(userId)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId)

      if (error) throw error

      toast.success(newRole === 'admin' ? "已提拔为管理员" : "已降职为普通用户")
      
      // Update local state
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
    } catch (error) {
      console.error("Error updating role:", error)
      toast.error("操作失败，请检查权限")
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">团队管理</h1>
          <p className="text-gray-400 mt-1">仅超级管理员可见</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索邮箱或昵称..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
            className="pl-10 pr-4 py-2 bg-[#0B1120] border border-white/10 rounded-lg text-sm focus:outline-none focus:border-blue-500 w-64"
          />
        </div>
      </div>

      <div className="bg-[#0B1120] border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-gray-400">
              <tr>
                <th className="p-4">用户</th>
                <th className="p-4">邮箱</th>
                <th className="p-4">当前角色</th>
                <th className="p-4 text-right">权限操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">加载中...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">未找到用户</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                              {user.full_name?.[0]?.toUpperCase() || 'U'}
                            </div>
                          )}
                        </div>
                        <span className="font-medium text-white">{user.full_name || '未命名'}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-300">{user.email}</td>
                    <td className="p-4">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="p-4 text-right">
                      {user.role === 'super_admin' ? (
                        <span className="text-gray-500 text-xs italic">不可操作</span>
                      ) : (
                        <div className="flex justify-end gap-2">
                          {user.role === 'user' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 border-green-500/20 text-green-400 hover:bg-green-500/10 hover:text-green-300"
                              onClick={() => handleRoleChange(user.id, 'admin')}
                              disabled={updating === user.id}
                            >
                              <ArrowUpCircle className="w-3 h-3 mr-1" />
                              提拔
                            </Button>
                          )}
                          {user.role === 'admin' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                              onClick={() => handleRoleChange(user.id, 'user')}
                              disabled={updating === user.id}
                            >
                              <ArrowDownCircle className="w-3 h-3 mr-1" />
                              降职
                            </Button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  switch (role) {
    case 'super_admin':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <Shield className="w-3 h-3" /> 超级管理员
        </span>
      )
    case 'admin':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <UserCheck className="w-3 h-3" /> 管理员
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20">
          <User className="w-3 h-3" /> 普通用户
        </span>
      )
  }
}
