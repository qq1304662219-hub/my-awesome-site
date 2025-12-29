"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Search, Mail, User } from "lucide-react"

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from("profiles")
        .select("*")
        .order("updated_at", { ascending: false })

      if (search) {
        query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
      }

      const { data, error } = await query
      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">用户管理</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索用户..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
            className="pl-10 pr-4 py-2 bg-[#0B1120] border border-white/10 rounded-lg text-sm focus:outline-none focus:border-blue-500 w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center text-gray-500 py-12">加载中...</div>
        ) : users.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 py-12">未找到用户</div>
        ) : (
          users.map((user) => (
            <div key={user.id} className="bg-[#0B1120] border border-white/10 rounded-xl p-6 flex items-start gap-4">
              <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold truncate">{user.full_name || "Unknown"}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                  <Mail className="w-3 h-3" />
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <span className={`px-2 py-0.5 text-xs rounded border ${
                    user.role === 'admin' 
                      ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' 
                      : 'bg-gray-800 border-white/10 text-gray-400'
                  }`}>
                    {user.role === 'admin' ? '管理员' : '普通用户'}
                  </span>
                  <span className="text-xs text-gray-500 self-center">
                    ID: {user.id.slice(0, 6)}...
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
