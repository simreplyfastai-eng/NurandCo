import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "SERVICES", href: "#services" },
    { name: "LOCATIONS", href: "#locations" },
    { name: "TRAINING", href: "#training" },
  ];

  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    if (href === "#") { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToBook = (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    document.getElementById("book")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "py-3 shadow-sm" : "py-4"}`}
        style={{ background: "#F5F0EB", borderBottom: "1px solid #E2DDD5" }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>

          <a href="#" onClick={(e) => scrollTo(e, "#")} style={{ textDecoration: "none", display: "flex", flexDirection: "column", gap: 2, lineHeight: 1 }}>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, letterSpacing: "0.01em", color: "#5C1A1A", lineHeight: 1 }}>
              STARR
            </span>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 400, color: "#C9A96E", lineHeight: 1 }}>
              AESTHETICS
            </span>
          </a>

          <div className="hidden md:flex" style={{ alignItems: "center", gap: 36 }}>
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => scrollTo(e, link.href)}
                style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, letterSpacing: "0.18em", fontWeight: 400, color: "#3D3D3D", textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#5C1A1A")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#3D3D3D")}
              >
                {link.name}
              </a>
            ))}
            <a
              href="#book"
              onClick={scrollToBook}
              style={{
                fontFamily: "'Inter', sans-serif", fontSize: 11, letterSpacing: "0.18em", fontWeight: 400,
                color: "#5C1A1A", border: "1px solid #5C1A1A", padding: "10px 20px",
                textDecoration: "none", textTransform: "uppercase" as const, transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#5C1A1A"; e.currentTarget.style.color = "#F5F0EB"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#5C1A1A"; }}
            >
              BOOK NOW
            </a>
          </div>

          <button
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 8 }}
          >
            {isMobileMenuOpen ? <X size={24} color="#5C1A1A" /> : <Menu size={24} color="#5C1A1A" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: "-100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "-100%" }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{ position: "fixed", inset: 0, zIndex: 40, background: "#F5F0EB", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 32 }}
          >
            {navLinks.map((link, i) => (
              <motion.a
                key={link.name}
                href={link.href}
                onClick={(e) => scrollTo(e, link.href)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + i * 0.06 }}
                style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, letterSpacing: "0.3em", color: "#3D3D3D", textDecoration: "none" }}
              >
                {link.name}
              </motion.a>
            ))}
            <motion.a
              href="#book"
              onClick={scrollToBook}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 }}
              style={{
                fontFamily: "'Inter', sans-serif", fontSize: 11, letterSpacing: "0.18em",
                color: "#5C1A1A", border: "1px solid #5C1A1A", padding: "12px 28px",
                textDecoration: "none", textTransform: "uppercase" as const,
              }}
            >
              BOOK NOW
            </motion.a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
