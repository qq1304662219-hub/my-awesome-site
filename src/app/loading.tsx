export default function Loading() {
  return (
    <div className="min-h-screen bg-[#020817] flex items-center justify-center">
      <div className="space-y-4 text-center">
        <div className="relative w-16 h-16 mx-auto">
          <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="text-gray-400 text-sm animate-pulse">正在加载精彩内容...</p>
      </div>
    </div>
  )
}
