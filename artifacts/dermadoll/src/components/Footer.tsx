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
          <div className="flex items-center gap-6">
            <a
              href="https://wa.me/447535173072"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.553 4.117 1.523 5.845L.057 23.704a.5.5 0 0 0 .614.632l6.054-1.572A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.01-1.373l-.36-.214-3.724.967.998-3.613-.236-.373A9.818 9.818 0 1 1 12 21.818z"/>
              </svg>
              WhatsApp
            </a>
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
      </div>
    </footer>
  );
}
