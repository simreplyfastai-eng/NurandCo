import { useState, useCallback } from "react";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [clickCount, setClickCount] = useState(0);
  const [lastClick, setLastClick] = useState(0);

  const handleSecretClick = useCallback(() => {
    const now = Date.now();
    const fresh = now - lastClick < 3000;
    const next = fresh ? clickCount + 1 : 1;
    setClickCount(next);
    setLastClick(now);
    if (next >= 5) {
      setClickCount(0);
      window.location.href = "/portal.html";
    }
  }, [clickCount, lastClick]);
  
  const navLinks = [
    { name: "Treatments", href: "#services" },
    { name: "Training", href: "#training" },
    { name: "Reviews", href: "#reviews" },
    { name: "FAQ", href: "#faq" },
  ];

  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="bg-[#111111] text-white pt-20 pb-10">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="flex flex-col items-center mb-16">
          <div className="flex flex-col items-center mb-6">
            <span className="font-serif text-3xl tracking-[0.2em] font-bold leading-none">
              DERMADOLL
            </span>
            <span className="font-sans text-[0.65rem] tracking-[0.35em] font-light mt-2 text-white/70">
              AESTHETICS
            </span>
          </div>
          <div
            className="font-serif italic text-primary text-xl cursor-default select-none"
            onClick={handleSecretClick}
          >
            Beauty Redefined
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-8 mb-16 text-sm tracking-widest uppercase text-white/70">
          {navLinks.map((link) => (
            <a 
              key={link.name} 
              href={link.href}
              onClick={(e) => scrollTo(e, link.href)}
              className="hover:text-primary transition-colors duration-300"
            >
              {link.name}
            </a>
          ))}
          <a
            href="#treatments"
            onClick={(e) => { e.preventDefault(); document.getElementById("treatments")?.scrollIntoView({ behavior: "smooth" }); }}
            className="text-primary hover:text-primary/80 transition-colors duration-300"
          >
            Book Now
          </a>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center border-t border-white/10 pt-8 text-xs text-white/40 font-light tracking-wide">
          <p className="mb-4 md:mb-0">
            &copy; {currentYear} Dermadoll Aesthetics. All rights reserved.
          </p>
          <a 
            href="https://instagram.com/dermadollaesthetics" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 transition-colors"
          >
            Instagram @dermadollaesthetics
          </a>
        </div>
      </div>
    </footer>
  );
}
