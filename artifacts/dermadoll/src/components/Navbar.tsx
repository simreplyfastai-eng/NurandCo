import { useState, useEffect } from "react";
import { Menu, X, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "HOME", href: "#" },
    { name: "TREATMENTS", href: "#services" },
    { name: "ABOUT", href: "#about" },
    { name: "PACKAGES", href: "#packages" },
    { name: "PRICING", href: "#pricing" },
    { name: "CONTACT", href: "#contact" },
  ];

  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    if (href === "#") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-[#FAF7F2] ${isScrolled ? "py-3 shadow-sm" : "py-4"}`}
        style={{ borderBottom: `1px solid ${isScrolled ? "#E2DDD5" : "transparent"}` }}
      >
        <div className="container mx-auto px-6 flex items-center justify-between max-w-6xl">
          {/* Logo lockup */}
          <a href="#" className="flex flex-col items-start relative z-50 leading-none gap-[1px]" onClick={(e) => scrollTo(e, "#")}>
            <span className="font-serif italic text-[18px] font-normal leading-none" style={{ color: "#1A0F00" }}>
              Face
            </span>
            <span className="font-sans text-[9px] tracking-[0.28em] uppercase font-medium leading-none" style={{ color: "#C8860A" }}>
              BY
            </span>
            <span className="font-serif text-[22px] font-bold leading-none" style={{ color: "#1A0F00" }}>
              Niamh
            </span>
            <span className="font-sans text-[8px] tracking-[0.38em] uppercase font-light leading-none" style={{ color: "#6B6260" }}>
              AESTHETICS
            </span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => scrollTo(e, link.href)}
                className="font-sans text-[11px] tracking-[0.18em] font-medium transition-colors duration-300 hover:text-[#C8860A]"
                style={{ color: "#6B6260" }}
              >
                {link.name}
              </a>
            ))}
            <a
              href="#services"
              onClick={(e) => { e.preventDefault(); document.getElementById("services")?.scrollIntoView({ behavior: "smooth" }); }}
              className="ml-2 font-sans text-[11px] tracking-[0.18em] font-medium uppercase transition-all duration-300 px-5 py-2.5 border"
              style={{ background: "#1A0F00", color: "#FAF7F2", borderColor: "#1A0F00" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#C8860A";
                e.currentTarget.style.borderColor = "#C8860A";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#1A0F00";
                e.currentTarget.style.borderColor = "#1A0F00";
              }}
            >
              Book Now
            </a>
            <a
              href="/portal.html"
              style={{ marginLeft: '4px', color: '#C8C0B4', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'color 0.2s' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#C8860A')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#C8C0B4')}
            >
              <Lock size={16} strokeWidth={1.8} />
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden relative z-50 p-2 -mr-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X size={26} strokeWidth={2} className="text-[#1A0F00]" />
            ) : (
              <Menu size={26} strokeWidth={2} style={{ color: "#1A0F00" }} />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: "-100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "-100%" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-40 flex flex-col items-center justify-center"
            style={{ background: "#FAF7F2" }}
          >
            <div className="flex flex-col items-center space-y-7">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => scrollTo(e, link.href)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.07 }}
                  className="font-sans text-[12px] tracking-[0.3em] text-[#6B6260] hover:text-[#C8860A] transition-colors"
                >
                  {link.name}
                </motion.a>
              ))}
              <motion.div
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 0.4 }}
                className="h-px w-16 bg-[#E2DDD5] my-2"
              />
              <motion.a
                href="#treatments"
                onClick={(e) => { e.preventDefault(); document.getElementById("treatments")?.scrollIntoView({ behavior: "smooth" }); setIsMobileMenuOpen(false); }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="font-sans text-[11px] tracking-[0.2em] uppercase font-medium px-8 py-3 border border-[#1A0F00] text-[#FAF7F2] bg-[#1A0F00] hover:bg-[#C8860A] hover:border-[#C8860A] transition-all"
              >
                Book a Consultation
              </motion.a>
              <motion.a
                href="/portal.html"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
                style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '11px',
                  color: '#C8C0B4',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <Lock size={11} strokeWidth={1.8} />
                Admin Portal
              </motion.a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
