import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Stats } from "@/components/landing/Stats";
import { SearchFilter } from "@/components/landing/SearchFilter";
import { VideoGrid } from "@/components/landing/VideoGrid";
import { PromoBanner } from "@/components/landing/PromoBanner";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#020817] text-foreground overflow-x-hidden selection:bg-blue-500/30">
      <Navbar />
      <Hero />
      <Stats />
      <SearchFilter />
      <VideoGrid />
      <PromoBanner />
      <Footer />
    </main>
  );
}
