"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Search, UserCog, MoreHorizontal } from "lucide-react"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface UserProfile {
  id: string
  email: string // Note: email might not be in profiles depending on schema, assume it is for now or use full_name
  full_name: string
  avatar_url: string
  role: string
  balance: number
  created_at: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        query: search
      })
      const res = await fetch(`/api/admin/users?${params}`)
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)
      
      setUsers(data.users)
      setTotalPages(data.totalPages)
    } catch (error: any) {
      toast.error("加载用户失败: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
        fetchUsers()
    }, 500)
    return () => clearTimeout(timer)
  }, [page, search])

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">用户管理</h1>
          <p className="text-gray-400">管理平台注册用户及权限</p>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
        <Search className="w-5 h-5 text-gray-400" />
        <Input 
          placeholder="搜索用户..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none text-white focus-visible:ring-0 placeholder:text-gray-500"
        />
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden bg-black/20">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/10 hover:bg-white/5">
              <TableHead className="text-gray-400">用户</TableHead>
              <TableHead className="text-gray-400">角色</TableHead>
              <TableHead className="text-gray-400">余额</TableHead>
              <TableHead className="text-gray-400">注册时间</TableHead>
              <TableHead className="text-gray-400 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                  没有找到用户
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className="border-white/10 hover:bg-white/5">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback>{user.full_name?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-white">{user.full_name}</span>
                        <span className="text-xs text-gray-500">{user.email || user.id}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                        user.role === 'super_admin' ? 'border-purple-500 text-purple-400' :
                        user.role === 'admin' ? 'border-blue-500 text-blue-400' :
                        'border-gray-500 text-gray-400'
                    }>
                        {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-green-400">¥{user.balance?.toFixed(2)}</span>
                  </TableCell>
                  <TableCell className="text-gray-400 text-sm">
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </DropdownMenuTrigger>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#1e293b] border-white/10 text-white">
                        <DropdownMenuLabel>操作</DropdownMenuLabel>
                        <DropdownMenuItem className="focus:bg-white/10">
                            查看详情
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem className="text-red-400 focus:bg-white/10 focus:text-red-400">
                            禁用账号
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2">
        <Button 
            variant="outline" 
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="border-white/10 bg-transparent text-white hover:bg-white/10"
        >
            上一页
        </Button>
        <span className="flex items-center text-sm text-gray-400">
            第 {page} / {totalPages} 页
        </span>
        <Button 
            variant="outline" 
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
            className="border-white/10 bg-transparent text-white hover:bg-white/10"
        >
            下一页
        </Button>
      </div>
    </div>
  )
}
