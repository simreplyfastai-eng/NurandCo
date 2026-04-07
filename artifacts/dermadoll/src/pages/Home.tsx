import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Services from "@/components/Services";
import BeforeAfter from "@/components/BeforeAfter";
import ResultsVideos from "@/components/ResultsVideos";
import Training from "@/components/Training";
import Reviews from "@/components/Reviews";
import InstagramSection from "@/components/InstagramSection";
import FAQ from "@/components/FAQ";
import BookNow from "@/components/BookNow";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-[100dvh] bg-white text-foreground">
      <Navbar />
      <Hero />
      <About />
      <Services />
      <BeforeAfter />
      <ResultsVideos />
      <Training />
      <Reviews />
      <InstagramSection />
      <FAQ />
      <BookNow />
      <Footer />
    </div>
  );
}
