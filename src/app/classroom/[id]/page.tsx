import { Navbar } from "@/components/landing/Navbar";
import { PlayCircle, Clock, CheckCircle, User, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { CourseEnrollButton } from "@/components/classroom/CourseEnrollButton";

export const dynamic = "force-dynamic";

export default async function CourseDetailPage({ params }: { params: { id: string } }) {
  const { data: course, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !course) {
    notFound();
  }

  const { data: { user } } = await supabase.auth.getUser()
  
  let isEnrolled = false
  if (user) {
    const { data } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', params.id)
      .single()
    
    if (data) isEnrolled = true
  }

  return (
    <div className="min-h-screen bg-[#020817] text-white flex flex-col">
      <Navbar />
      
      {/* Course Header */}
      <div className="relative pt-32 pb-12 bg-[#0B1120] border-b border-white/10">
        <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20">
                            {course.level}
                        </span>
                        <span>{course.duration}</span>
                        <span>{course.students_count} 人已报名</span>
                    </div>
                    
                    <h1 className="text-4xl font-bold leading-tight">
                        {course.title}
                    </h1>
                    
                    <p className="text-xl text-gray-400">
                        {course.description}
                    </p>

                    <div className="flex items-center gap-6 pt-6">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                                <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">讲师</p>
                                <p className="font-bold">{course.instructor}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex text-yellow-400">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <Star key={i} className="w-4 h-4 fill-current" />
                                ))}
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">评分</p>
                                <p className="font-bold">{course.rating}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Course Card */}
                <div className="lg:col-span-1">
                    <div className="bg-[#1A2234] border border-white/10 rounded-2xl overflow-hidden sticky top-24">
                        <div className="relative aspect-video bg-black/50">
                            <img 
                                src={course.image_url} 
                                alt={course.title} 
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                <PlayCircle className="w-16 h-16 text-white opacity-80" />
                            </div>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-gray-400 text-sm">课程价格</p>
                                    <p className="text-3xl font-bold text-white">
                                        {course.price > 0 ? `¥${course.price}` : '免费'}
                                    </p>
                                </div>
                            </div>

                            <CourseEnrollButton 
                              courseId={course.id} 
                              price={course.price} 
                              isEnrolled={isEnrolled} 
                            />
                            
                            <div className="space-y-4 text-sm text-gray-400">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    <span>永久回放权限</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    <span>配套练习素材</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    <span>讲师在线答疑</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </main>
  );
}
