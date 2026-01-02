"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Search, UserCog, MoreHorizontal, ShieldAlert, ShieldCheck, Ban, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface UserProfile {
  id: string
  username: string
  avatar_url: string
  role: string
  balance: number
  created_at: string
  email?: string
  status?: string // active, banned
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const ITEMS_PER_PAGE = 10

  // Edit Role State
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [newRole, setNewRole] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE - 1)

      if (search) {
        query = query.ilike('username', `%${search}%`)
      }

      const { data, count, error } = await query

      if (error) throw error
      
      setUsers(data as any[] || [])
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE))
    } catch (error: any) {
      console.error("Error fetching users:", error)
      toast.error("加载用户列表失败")
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

  const handleUpdateRole = async () => {
    if (!editingUser || !newRole) return

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', editingUser.id)

      if (error) throw error

      toast.success(`已将用户 ${editingUser.username} 的角色更新为 ${newRole}`)
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, role: newRole } : u))
      setIsDialogOpen(false)
    } catch (error) {
      toast.error("更新角色失败")
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">用户管理</h1>
          <p className="text-gray-400">管理平台注册用户及权限</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
            <UserCog className="mr-2 h-4 w-4" /> 添加管理员
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-[#0B1120] p-4 rounded-xl border border-white/10 shadow-lg">
        <Search className="w-5 h-5 text-gray-400" />
        <Input 
          placeholder="搜索用户 (用户名)..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none text-white focus-visible:ring-0 placeholder:text-gray-500"
        />
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden bg-[#0B1120] shadow-xl">
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
                <TableRow key={user.id} className="border-white/10 hover:bg-white/5 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-9 h-9 border border-white/10">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback className="bg-blue-600/20 text-blue-400">{user.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-white">{user.username || 'Unset Username'}</span>
                        <span className="text-xs text-gray-500 font-mono">{user.id.slice(0, 8)}...</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`
                        ${user.role === 'super_admin' ? 'border-purple-500/50 text-purple-400 bg-purple-500/10' :
                          user.role === 'admin' ? 'border-blue-500/50 text-blue-400 bg-blue-500/10' :
                          'border-gray-500/50 text-gray-400 bg-gray-500/10'}
                    `}>
                        {user.role === 'super_admin' ? '超级管理员' : user.role === 'admin' ? '管理员' : '普通用户'}
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
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 text-gray-400 hover:text-white">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#1e293b] border-white/10 text-white shadow-xl">
                        <DropdownMenuLabel>管理操作</DropdownMenuLabel>
                        <DropdownMenuItem 
                            className="focus:bg-white/10 cursor-pointer"
                            onClick={() => {
                                setEditingUser(user)
                                setNewRole(user.role || 'user')
                                setIsDialogOpen(true)
                            }}
                        >
                            <ShieldCheck className="w-4 h-4 mr-2 text-blue-400" />
                            修改权限
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem className="text-red-400 focus:bg-white/10 focus:text-red-400 cursor-pointer">
                            <Ban className="w-4 h-4 mr-2" />
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
            className="border-white/10 bg-[#0B1120] text-white hover:bg-white/10"
        >
            上一页
        </Button>
        <span className="flex items-center text-sm text-gray-400 bg-[#0B1120] px-4 rounded-md border border-white/10">
            第 {page} / {totalPages} 页
        </span>
        <Button 
            variant="outline" 
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
            className="border-white/10 bg-[#0B1120] text-white hover:bg-white/10"
        >
            下一页
        </Button>
      </div>

      {/* Edit Role Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-[#1e293b] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>修改用户权限</DialogTitle>
            <DialogDescription className="text-gray-400">
              正在修改用户 <span className="text-white font-bold">{editingUser?.username}</span> 的角色权限。
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="mb-2 block">选择角色</Label>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger className="bg-black/20 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1e293b] border-white/10 text-white">
                <SelectItem value="user">普通用户 (user)</SelectItem>
                <SelectItem value="admin">管理员 (admin)</SelectItem>
                <SelectItem value="super_admin">超级管理员 (super_admin)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="hover:bg-white/10 hover:text-white text-gray-400">取消</Button>
            <Button onClick={handleUpdateRole} className="bg-blue-600 hover:bg-blue-700">确认修改</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
