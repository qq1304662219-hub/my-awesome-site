"use client"

import { useState } from "react"
import { Check, ChevronDown, Filter } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"

interface FilterOption {
  label: string
  value: string
  count?: number
}

interface FilterGroup {
  id: string
  label: string
  options: FilterOption[]
}

const FILTER_GROUPS: FilterGroup[] = [
  {
    id: "role",
    label: "职业",
    options: [
      { label: "全部", value: "all" },
      { label: "导演", value: "导演" },
      { label: "AI 艺术家", value: "AI 艺术家" },
      { label: "剪辑师", value: "剪辑师" },
      { label: "制片人", value: "制片人" },
      { label: "视觉设计师", value: "视觉设计师" },
    ]
  },
  {
    id: "location",
    label: "地区",
    options: [
      { label: "全部", value: "all" },
      { label: "北京", value: "北京" },
      { label: "上海", value: "上海" },
      { label: "深圳", value: "深圳" },
      { label: "杭州", value: "杭州" },
      { label: "广州", value: "广州" },
      { label: "海外", value: "海外" },
    ]
  },
  {
    id: "verified",
    label: "认证类型",
    options: [
      { label: "全部", value: "all" },
      { label: "认证创作者", value: "verified" },
      { label: "企业机构", value: "company" },
    ]
  },
  {
    id: "honors",
    label: "荣誉",
    options: [
      { label: "全部", value: "all" },
      { label: "大赛获奖", value: "award_winner" },
      { label: "推荐创作者", value: "recommended" },
    ]
  }
]

interface CreatorSidebarProps {
  filters: {
    role: string
    location: string
    verified: string
    honors: string
  }
  onFilterChange: (key: string, value: string) => void
  className?: string
}

export function CreatorSidebar({ filters, onFilterChange, className }: CreatorSidebarProps) {
  return (
    <div className={cn("w-full space-y-6", className)}>
      <div className="flex items-center gap-2 text-foreground font-medium px-2">
        <Filter className="w-4 h-4 text-blue-500" />
        <span>筛选条件</span>
      </div>

      <Accordion type="multiple" defaultValue={["role", "location", "verified", "honors"]} className="w-full">
        {FILTER_GROUPS.map((group) => (
          <AccordionItem key={group.id} value={group.id} className="border-border">
            <AccordionTrigger className="text-sm hover:text-blue-500 hover:no-underline px-2 text-foreground">
              {group.label}
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1 pt-1 px-2">
                {group.options.map((option) => {
                  const isSelected = filters[group.id as keyof typeof filters] === option.value
                  return (
                    <Button
                      key={option.value}
                      variant="ghost"
                      size="sm"
                      onClick={() => onFilterChange(group.id, option.value)}
                      className={cn(
                        "w-full justify-start text-xs h-8 font-normal",
                        isSelected 
                          ? "bg-blue-600/20 text-blue-500 hover:bg-blue-600/30 hover:text-blue-400" 
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      )}
                    >
                      {option.label}
                      {isSelected && <Check className="ml-auto w-3 h-3" />}
                    </Button>
                  )
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
