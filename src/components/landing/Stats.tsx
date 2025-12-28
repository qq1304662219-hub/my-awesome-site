export function Stats() {
  const stats = [
    { value: "10K+", label: "视频素材" },
    { value: "5K+", label: "创作者" },
    { value: "1M+", label: "月下载量" },
  ];

  return (
    <div className="container mx-auto px-4 -mt-10 relative z-20 mb-20">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 text-center hover:bg-white/10 transition-colors cursor-default">
            <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
            <div className="text-sm text-gray-400">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
