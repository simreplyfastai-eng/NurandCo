import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Services from "@/components/Services";
import BeforeAfter from "@/components/BeforeAfter";
import ResultsVideos from "@/components/ResultsVideos";
import Training from "@/components/Training";
import Reviews from "@/components/Reviews";
import FAQ from "@/components/FAQ";
import BookNow from "@/components/BookNow";
import Footer from "@/components/Footer";

function GoldDivider() {
  return (
    <div
      aria-hidden="true"
      style={{
        width: "100%",
        padding: "0 48px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          height: 1,
          background: "linear-gradient(90deg, transparent 0%, #C9A96E 30%, #C9A96E 70%, transparent 100%)",
          opacity: 0.35,
        }}
      />
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-[100dvh] bg-white text-foreground">
      <Navbar />
      <Hero />
      <GoldDivider />
      <About />
      <GoldDivider />
      <Services />
      <GoldDivider />
      <BeforeAfter />
      <GoldDivider />
      <ResultsVideos />
      <GoldDivider />
      <Training />
      <GoldDivider />
      <Reviews />
      <GoldDivider />
      <FAQ />
      <GoldDivider />
      <BookNow />
      <GoldDivider />
      <Footer />
    </div>
  );
}
