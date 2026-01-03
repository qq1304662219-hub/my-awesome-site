export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="space-y-6 text-center flex flex-col items-center">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full animate-pulse"></div>
          <div className="absolute inset-0 border-4 border-t-primary border-r-purple-500 border-b-pink-500 border-l-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl">🤖</span>
          </div>
        </div>
        <div className="space-y-2">
            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-500 bg-clip-text text-transparent animate-pulse">
                AI Vision
            </h3>
            <p className="text-muted-foreground text-sm">正在加载精彩内容...</p>
        </div>
      </div>
    </div>
  )
}
