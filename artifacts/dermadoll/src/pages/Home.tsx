import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
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
  const [showBookingSuccess, setShowBookingSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("booking") === "confirmed") {
      setShowBookingSuccess(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("booking");
      window.history.replaceState({}, "", url.toString());
      const t = setTimeout(() => setShowBookingSuccess(false), 8000);
      return () => clearTimeout(t);
    }
  }, []);

  return (
    <div className="min-h-[100dvh] bg-white text-foreground">

      {/* 3DS redirect success banner */}
      <AnimatePresence>
        {showBookingSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -60 }}
            transition={{ duration: 0.4 }}
            style={{
              position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999,
              background: "#1a1a1a",
              borderBottom: "2px solid #C9A96E",
              padding: "14px 24px",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "50%", background: "rgba(201,169,110,0.2)", flexShrink: 0 }}>
              <Check size={14} color="#C9A96E" />
            </div>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "14px", color: "#FAF9F7", margin: 0 }}>
              <span style={{ color: "#C9A96E", fontWeight: 600 }}>Booking confirmed.</span>{" "}
              You'll receive a confirmation email shortly.
            </p>
            <button
              onClick={() => setShowBookingSuccess(false)}
              style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", padding: 4, color: "#888", flexShrink: 0 }}
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
