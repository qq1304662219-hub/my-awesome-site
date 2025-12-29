import { Navbar } from "@/components/landing/Navbar";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#020817] text-white flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="w-full aspect-video rounded-xl bg-white/5" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4 bg-white/5" />
              <div className="flex gap-4">
                <Skeleton className="h-4 w-24 bg-white/5" />
                <Skeleton className="h-4 w-24 bg-white/5" />
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-xl bg-white/5" />
            <div className="space-y-4">
              <Skeleton className="h-16 w-full bg-white/5" />
              <Skeleton className="h-16 w-full bg-white/5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
