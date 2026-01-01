import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { BookOpen, PlayCircle, Star, Clock, User } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const COURSES = [
  {
    id: 1,
    title: "Midjourney 零基础入门",
    description: "从注册账号到精通提示词，带你一步步掌握最强大的 AI 绘画工具。",
    instructor: "AI 艺术研究院",
    duration: "2小时 30分钟",
    level: "入门",
    rating: 4.9,
    students: 1205,
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"
  },
  {
    id: 2,
    title: "Stable Diffusion 高级进阶",
    description: "深入理解 ControlNet、LoRA 训练与局部重绘，掌控 AI 绘画的每一个细节。",
    instructor: "TechFlow",
    duration: "4小时 15分钟",
    level: "进阶",
    rating: 4.8,
    students: 850,
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070&auto=format&fit=crop"
  },
  {
    id: 3,
    title: "Runway Gen-2 视频生成指南",
    description: "探索 AI 视频生成的无限可能，学习如何用文字和图片创作电影级镜头。",
    instructor: "Motion AI",
    duration: "1小时 45分钟",
    level: "中级",
    rating: 4.7,
    students: 620,
    image: "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2070&auto=format&fit=crop"
  },
  {
    id: 4,
    title: "AI 辅助商业设计实战",
    description: "结合 Photoshop 与 AI 工具，提升电商海报、Logo 设计与包装设计的效率。",
    instructor: "Design Master",
    duration: "3小时 20分钟",
    level: "实战",
    rating: 4.9,
    students: 2100,
    image: "https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=2727&auto=format&fit=crop"
  }
];

export default function ClassroomPage() {
  return (
    <div className="min-h-screen bg-[#020817] text-white flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                AI 创作课堂
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
                精选 AI 创作教程，从入门到精通，释放你的无限创意潜力。
            </p>
            <div className="flex justify-center gap-4">
                <Button className="bg-blue-600 hover:bg-blue-700 px-8 py-6 text-lg">
                    开始学习
                </Button>
                <Button variant="outline" className="border-white/20 hover:bg-white/10 px-8 py-6 text-lg">
                    成为讲师
                </Button>
            </div>
        </div>
      </div>

      {/* Course List */}
      <div className="flex-1 container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {COURSES.map((course) => (
                <div key={course.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all group">
                    <div className="relative h-48 overflow-hidden">
                        <img 
                            src={course.image} 
                            alt={course.title} 
                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <PlayCircle className="w-12 h-12 text-white" />
                        </div>
                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium">
                            {course.level}
                        </div>
                    </div>
                    <div className="p-5">
                        <h3 className="font-bold text-lg mb-2 line-clamp-1 group-hover:text-blue-400 transition-colors">
                            {course.title}
                        </h3>
                        <p className="text-sm text-gray-400 mb-4 line-clamp-2 h-10">
                            {course.description}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                            <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {course.instructor}
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {course.duration}
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                            <div className="flex items-center gap-1 text-yellow-500">
                                <Star className="w-4 h-4 fill-current" />
                                <span className="font-bold">{course.rating}</span>
                            </div>
                            <span className="text-xs text-gray-400">
                                {course.students} 人在学
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
