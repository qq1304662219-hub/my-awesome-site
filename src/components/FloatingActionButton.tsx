'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, MessageSquare, Ticket, ShoppingBag, HeadphonesIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const actions = [
    { 
      label: '我的订单', 
      icon: ShoppingBag, 
      onClick: () => router.push('/dashboard/orders'),
      color: 'bg-orange-500' 
    },
    { 
      label: '联系客服', 
      icon: HeadphonesIcon, 
      onClick: () => router.push('/dashboard/messages'),
      color: 'bg-blue-500' 
    },
    { 
      label: '提交工单', 
      icon: Ticket, 
      onClick: () => router.push('/dashboard/tickets'),
      color: 'bg-purple-500' 
    }
  ]

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <div className="flex flex-col gap-3 items-end mb-2">
            {actions.map((action, index) => (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3"
              >
                <span className="bg-black/80 text-white text-xs px-2 py-1 rounded backdrop-blur-sm border border-white/10 shadow-lg font-medium">
                    {action.label}
                </span>
                <Button
                  size="icon"
                  className={`${action.color} text-white shadow-lg hover:brightness-110 rounded-full h-12 w-12 border-2 border-white/10`}
                  onClick={() => {
                      action.onClick()
                      setIsOpen(false)
                  }}
                >
                  <action.icon className="h-5 w-5" />
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <Button
        size="icon"
        className={`h-14 w-14 rounded-full shadow-2xl transition-all duration-300 border-2 border-white/10 ${
            isOpen 
            ? 'bg-red-500 hover:bg-red-600 rotate-90' 
            : 'bg-blue-600 hover:bg-blue-700 hover:scale-105'
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Plus className={`h-8 w-8 text-white transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`} />
      </Button>
    </div>
  )
}
