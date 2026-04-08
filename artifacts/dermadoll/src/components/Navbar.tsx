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
    { name: "Treatments", href: "#services" },
    { name: "Training", href: "#training" },
    { name: "Reviews", href: "#reviews" },
    { name: "FAQ", href: "#faq" },
  ];

  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? "bg-white text-foreground shadow-sm py-4"
            : "bg-transparent text-white py-6"
        }`}
        style={{ borderBottom: "1px solid rgba(201,169,110,0.55)" }}
      >
        <div className="container mx-auto px-6 flex items-center justify-between">
          <a href="#" className="flex flex-col relative z-50" onClick={(e) => scrollTo(e, "#")}>
            <span className="font-serif text-2xl tracking-[0.2em] font-bold leading-none">
              DERMADOLL
            </span>
            <span className="font-sans text-[0.6rem] tracking-[0.3em] font-light mt-1">
              AESTHETICS
            </span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => scrollTo(e, link.href)}
                className="text-sm tracking-wide hover:text-primary transition-colors duration-300"
              >
                {link.name}
              </a>
            ))}
            <a
              href="#treatments"
              onClick={(e) => { e.preventDefault(); document.getElementById("treatments")?.scrollIntoView({ behavior: "smooth" }); }}
              className="bg-primary text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors duration-300 shadow-sm"
            >
              Book Now
            </a>
            <a
              href="/portal.html"
              style={{ marginLeft: '12px', color: '#CCCCCC', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#C9A96E')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#CCCCCC')}
            >
              <Lock size={18} strokeWidth={2} />
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden relative z-50 p-2 -mr-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X size={28} strokeWidth={2.5} className="text-foreground" />
            ) : (
              <Menu size={28} strokeWidth={2.5} className={isScrolled ? "text-foreground" : "text-white"} />
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
            className="fixed inset-0 z-40 bg-white flex flex-col items-center justify-center"
          >
            <div className="flex flex-col items-center space-y-8">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => scrollTo(e, link.href)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                  className="font-serif text-4xl text-foreground hover:text-primary transition-colors"
                >
                  {link.name}
                </motion.a>
              ))}
              <motion.a
                href="#treatments"
                onClick={(e) => { e.preventDefault(); document.getElementById("treatments")?.scrollIntoView({ behavior: "smooth" }); setIsMobileMenuOpen(false); }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-8 bg-primary text-white px-8 py-3 rounded-full text-lg hover:bg-primary/90 transition-colors"
              >
                Book Now
              </motion.a>
              <motion.a
                href="/portal.html"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.65 }}
                style={{
                  paddingTop: '24px',
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '12px',
                  color: '#AAAAAA',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#C9A96E')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#AAAAAA')}
              >
                <Lock size={12} strokeWidth={2} />
                Admin Portal
              </motion.a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
