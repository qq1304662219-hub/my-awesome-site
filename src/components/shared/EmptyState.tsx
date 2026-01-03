import { LucideIcon, SearchX, Box } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  title?: string
  description?: string
  icon?: LucideIcon
  actionLabel?: string
  actionLink?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({
  title = "暂无数据",
  description = "这里空空如也，什么都没有发现",
  icon: Icon = Box,
  actionLabel,
  actionLink,
  onAction,
  className
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
      <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-6 text-sm">{description}</p>
      
      {actionLabel && (
        actionLink ? (
          <Link href={actionLink}>
            <Button>{actionLabel}</Button>
          </Link>
        ) : (
          <Button onClick={onAction}>{actionLabel}</Button>
        )
      )}
    </div>
  )
}

export function SearchEmptyState({ query }: { query: string }) {
    return (
        <EmptyState 
            title="未找到相关结果"
            description={`抱歉，我们没有找到与 "${query}" 相关的内容，请尝试更换关键词。`}
            icon={SearchX}
        />
    )
}
