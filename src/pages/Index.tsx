import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ClassTypes from "@/components/ClassTypes";
import VideoGallery from "@/components/VideoGallery";
import Schedule from "@/components/Schedule";
import Instructors from "@/components/Instructors";
import WalletClub from "@/components/WalletClub";
import Pricing from "@/components/Pricing";
import Testimonials from "@/components/Testimonials";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <ClassTypes />
      <VideoGallery />
      <Schedule />
      <Instructors />
      <WalletClub />
      <Pricing />
      <Testimonials />
      <Footer />
    </main>
  );
};

export default Index;
