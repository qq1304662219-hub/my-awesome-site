import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { PlayCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export const revalidate = 60; // Revalidate every minute

interface Course {
  id: number;
  title: string;
  description: string;
  instructor: string;
  duration: string;
  level: string;
  rating: number;
  students_count: number;
  image_url: string;
  price: number;
}

export default async function ClassroomPage() {
  const { data: courses, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching courses:', error);
  }

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
        {(!courses || courses.length === 0) ? (
            <div className="text-center py-20 bg-white/5 rounded-xl border border-white/10">
                <p className="text-gray-400 mb-4">暂无课程</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {courses.map((course) => (
                    <div key={course.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all group">
                        <div className="relative h-48 overflow-hidden">
                            <img 
                                src={course.image_url} 
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
                            <p className="text-sm text-gray-400 mb-4 line-clamp-2 min-h-[40px]">
                                {course.description}
                            </p>
                            <div className="flex items-center justify-between text-xs text-gray-500 border-t border-white/10 pt-4">
                                <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {course.duration}
                                </div>
                                <span>{course.students_count} 人在学</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
}
