"use client";

import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function FloatingActions() {
  return (
    <div className="fixed bottom-10 right-10 flex flex-col gap-4 z-50">
      <TooltipProvider delayDuration={0}>
        {/* Cart Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              className="h-12 w-12 rounded-full bg-white text-black hover:bg-gray-200 shadow-lg relative"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white border-2 border-[#020817]">
                21
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="bg-black border-white/10 text-white">
            <p>购物车</p>
          </TooltipContent>
        </Tooltip>

        {/* Service Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              className="h-12 w-12 rounded-full bg-white text-black hover:bg-gray-200 shadow-lg flex flex-col items-center justify-center"
            >
               <span className="text-xs font-bold">客服</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="bg-black border-white/10 text-white">
            <p>联系客服</p>
          </TooltipContent>
        </Tooltip>

        {/* Ticket Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              className="h-12 w-12 rounded-full bg-white text-black hover:bg-gray-200 shadow-lg flex flex-col items-center justify-center"
            >
               <span className="text-xs font-bold">工单</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left" className="bg-black border-white/10 text-white">
            <p>提交工单</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
