import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import TrustTicker from "@/components/TrustTicker";
import Locations from "@/components/Locations";
import Services from "@/components/Services";
import GalleryReel from "@/components/GalleryReel";
import Training from "@/components/Training";
import Reviews from "@/components/Reviews";
import FAQ from "@/components/FAQ";
import CTABanner from "@/components/CTABanner";
import Footer from "@/components/Footer";

export default function Home() {
  const [showBookingSuccess, setShowBookingSuccess] = useState(false);
  const [waNumber, setWaNumber] = useState("447701298985");

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => { if (d?.whatsapp) setWaNumber(d.whatsapp); })
      .catch(() => {});
  }, []);

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
    return undefined;
  }, []);

  return (
    <div className="min-h-[100dvh]" style={{ background: "#F5F0EB", color: "#3D3D3D" }}>

      <AnimatePresence>
        {showBookingSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -60 }}
            transition={{ duration: 0.4 }}
            style={{
              position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999,
              background: "#5C1A1A", borderBottom: "2px solid #C9A96E",
              padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px",
            }}
          >
            <Check size={14} color="#C9A96E" />
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "14px", color: "#F5F0EB", margin: 0 }}>
              <span style={{ color: "#C9A96E", fontWeight: 600 }}>Booking confirmed.</span>{" "}
              You'll receive a confirmation email shortly.
            </p>
            <button
              onClick={() => setShowBookingSuccess(false)}
              style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", padding: 4, color: "#C9A96E", flexShrink: 0 }}
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <a
        href={`https://wa.me/${waNumber}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        style={{
          position: "fixed", bottom: "24px", right: "24px", zIndex: 9000,
          width: "52px", height: "52px", borderRadius: "50%", background: "#C9A96E",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 16px rgba(201,169,110,0.45)", transition: "transform 0.2s, background 0.2s",
        }}
        onMouseEnter={(e) => { const el = e.currentTarget as HTMLAnchorElement; el.style.transform = "scale(1.08)"; el.style.background = "#B8944A"; }}
        onMouseLeave={(e) => { const el = e.currentTarget as HTMLAnchorElement; el.style.transform = "scale(1)"; el.style.background = "#C9A96E"; }}
      >
        <svg viewBox="0 0 24 24" fill="#5C1A1A" width="26" height="26" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.553 4.117 1.523 5.845L.057 23.704a.5.5 0 0 0 .614.632l6.054-1.572A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.01-1.373l-.36-.214-3.724.967.998-3.613-.236-.373A9.818 9.818 0 1 1 12 21.818z"/>
        </svg>
      </a>

      <Navbar />

      <Hero />
      <TrustTicker />
      <About />
      <Locations />
      <Services />
      <GalleryReel />
      <Training />
      <Reviews />
      <FAQ />
      <CTABanner />
      <Footer />
    </div>
  );
}
