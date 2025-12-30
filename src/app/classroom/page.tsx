import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export default function ClassroomPage() {
  return (
    <div className="min-h-screen bg-[#020817] text-white flex flex-col">
      <Navbar />
      <div className="flex-1 container mx-auto px-4 py-24 flex items-center justify-center">
        <div className="text-center">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                AI 创作课堂
            </h1>
            <p className="text-gray-400 text-lg">
                教程与课程正在制作中，敬请期待...
            </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
