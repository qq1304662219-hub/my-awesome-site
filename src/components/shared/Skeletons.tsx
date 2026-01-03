import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export function VideoCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-48 w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-4/5" />
        <div className="flex items-center gap-2">
           <Skeleton className="h-8 w-8 rounded-full" />
           <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </div>
  )
}

export function CreatorCardSkeleton() {
  return (
    <div className="flex flex-col md:flex-row bg-card border border-border rounded-xl overflow-hidden h-[300px] md:h-[220px]">
        {/* Left: Profile Info */}
        <div className="p-6 md:w-[280px] flex flex-col gap-5 border-b md:border-b-0 md:border-r border-border shrink-0 bg-card relative">
            <div className="flex items-center gap-4">
                <Skeleton className="w-14 h-14 rounded-full" />
                <div className="flex flex-col gap-2 flex-1">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
            </div>
            
            <div className="flex items-center justify-between py-3 border-t border-b border-border">
                <div className="flex-1 flex flex-col items-center gap-1 border-r border-border">
                    <Skeleton className="h-5 w-10" />
                    <Skeleton className="h-2 w-6" />
                </div>
                <div className="flex-1 flex flex-col items-center gap-1 border-r border-border">
                    <Skeleton className="h-5 w-10" />
                    <Skeleton className="h-2 w-6" />
                </div>
                <div className="flex-1 flex flex-col items-center gap-1">
                    <Skeleton className="h-5 w-10" />
                    <Skeleton className="h-2 w-6" />
                </div>
            </div>
            
            <Skeleton className="h-9 w-full rounded-md" />
        </div>
        
        {/* Right: Works */}
        <div className="flex-1 p-5 bg-muted/30 flex flex-col justify-center">
            <div className="flex justify-between mb-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-12" />
            </div>
            <div className="flex gap-4 overflow-hidden">
                <Skeleton className="h-28 w-[200px] rounded-lg shrink-0" />
                <Skeleton className="h-28 w-[200px] rounded-lg shrink-0" />
                <Skeleton className="h-28 w-[200px] rounded-lg shrink-0" />
            </div>
        </div>
    </div>
  )
}

export function ProfilePageSkeleton() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
             {/* Navbar placeholder */}
             <div className="h-16 border-b border-border" />
             
             <div className="flex-1 container mx-auto px-4 pt-8 pb-12">
                <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8">
                    {/* Left Sidebar Skeleton */}
                    <div className="space-y-6">
                        <div className="bg-card rounded-2xl border border-border h-[500px] p-6 flex flex-col gap-4">
                            <Skeleton className="h-32 w-full rounded-t-xl" />
                            <div className="-mt-16 px-4">
                                <Skeleton className="w-24 h-24 rounded-full border-4 border-card" />
                            </div>
                            <div className="px-4 space-y-4">
                                <Skeleton className="h-8 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                                <Skeleton className="h-20 w-full" />
                                <div className="flex gap-2">
                                    <Skeleton className="h-10 flex-1" />
                                    <Skeleton className="h-10 flex-1" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Content Skeleton */}
                    <div className="space-y-6">
                        <div className="flex gap-4 mb-8">
                            <Skeleton className="h-10 w-24" />
                            <Skeleton className="h-10 w-24" />
                        </div>
                        <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
                            {[1,2,3,4,5,6].map(i => (
                                <Skeleton key={i} className="h-64 w-full rounded-xl break-inside-avoid" />
                            ))}
                        </div>
                    </div>
                </div>
             </div>
        </div>
    )
}

