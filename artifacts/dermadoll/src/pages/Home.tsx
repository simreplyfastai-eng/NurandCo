import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import TrustTicker from "@/components/TrustTicker";
import About from "@/components/About";
import Services from "@/components/Services";
import Packages from "@/components/Packages";
import Pricing from "@/components/Pricing";
import FacesGallery from "@/components/FacesGallery";
import Reviews from "@/components/Reviews";
import FAQ from "@/components/FAQ";
import CTABanner from "@/components/CTABanner";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

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
    <div className="min-h-[100dvh]" style={{ background: "#FAF7F2", color: "#1A0F00" }}>

      <AnimatePresence>
        {showBookingSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -60 }}
            transition={{ duration: 0.4 }}
            style={{
              position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999,
              background: "#1A0F00",
              borderBottom: "2px solid #C8860A",
              padding: "14px 24px",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: "50%", background: "rgba(200,134,10,0.2)", flexShrink: 0 }}>
              <Check size={14} color="#C8860A" />
            </div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", color: "#FAF7F2", margin: 0 }}>
              <span style={{ color: "#C8860A", fontWeight: 600 }}>Booking confirmed.</span>{" "}
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

      {/* Floating WhatsApp button */}
      <a
        href="https://wa.me/447535173072"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 9000,
          width: "52px",
          height: "52px",
          borderRadius: "50%",
          background: "#25D366",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 16px rgba(37,211,102,0.45)",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1.08)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.transform = "scale(1)";
        }}
      >
        <svg viewBox="0 0 24 24" fill="white" width="26" height="26" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.553 4.117 1.523 5.845L.057 23.704a.5.5 0 0 0 .614.632l6.054-1.572A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.01-1.373l-.36-.214-3.724.967.998-3.613-.236-.373A9.818 9.818 0 1 1 12 21.818z"/>
        </svg>
      </a>

      <Navbar />

      {/* 1. Hero */}
      <Hero />

      {/* 2. Trust Ticker */}
      <TrustTicker />

      {/* 3. About */}
      <About />

      {/* 4. Services */}
      <Services />

      {/* 5. Packages */}
      <Packages />

      {/* 6. Pricing */}
      <Pricing />

      {/* 7. Results */}
      <FacesGallery />

      {/* 8. Reviews */}
      <Reviews />

      {/* 9. FAQ */}
      <FAQ />

      {/* 10. CTA Banner */}
      <CTABanner />

      {/* 11. Contact */}
      <Contact />

      {/* Footer */}
      <Footer />
    </div>
  );
}
