import { useState, useEffect } from "react";
import { Menu, X, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function AdminLoginModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError("Incorrect email or password.");
        setLoading(false);
        return;
      }
      localStorage.setItem("fbn_token", data.token);
      window.location.href = `${import.meta.env.BASE_URL}portal.html`;
    } catch {
      setError("Unable to connect. Please try again.");
      setLoading(false);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(28,14,14,0.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#F5F0EB", width: "100%", maxWidth: 380,
          padding: "48px 40px 40px",
          border: "1px solid #E2DDD5",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 16, right: 16,
            background: "none", border: "none", cursor: "pointer", padding: 4, color: "#A09080",
          }}
        >
          <X size={18} />
        </button>

        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 40, height: 40, border: "1px solid #C9A96E",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
          }}>
            <Lock size={16} color="#C9A96E" />
          </div>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic",
            fontSize: "1.6rem", fontWeight: 400, color: "#5C1A1A", margin: "0 0 6px",
          }}>
            Admin Access
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: "#A09080", margin: 0 }}>
            Starr Aesthetics Portal
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{
              display: "block", fontFamily: "'Inter', sans-serif",
              fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase",
              color: "#737373", marginBottom: 8,
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              style={{
                width: "100%", padding: "12px 14px",
                fontFamily: "'Inter', sans-serif", fontSize: 14, color: "#3D3D3D",
                background: "#FFFFFF", border: "1px solid #E2DDD5",
                outline: "none", boxSizing: "border-box" as const,
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#C9A96E")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#E2DDD5")}
            />
          </div>

          <div>
            <label style={{
              display: "block", fontFamily: "'Inter', sans-serif",
              fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase",
              color: "#737373", marginBottom: 8,
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%", padding: "12px 14px",
                fontFamily: "'Inter', sans-serif", fontSize: 14, color: "#3D3D3D",
                background: "#FFFFFF", border: "1px solid #E2DDD5",
                outline: "none", boxSizing: "border-box" as const,
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#C9A96E")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#E2DDD5")}
            />
          </div>

          {error && (
            <p style={{
              fontFamily: "'Inter', sans-serif", fontSize: 12,
              color: "#9B2335", margin: 0, textAlign: "center",
            }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 8, padding: "13px 0",
              fontFamily: "'Inter', sans-serif", fontSize: 11,
              letterSpacing: "2px", textTransform: "uppercase",
              background: loading ? "#E2DDD5" : "#5C1A1A",
              color: loading ? "#A09080" : "#F5F0EB",
              border: "none", cursor: loading ? "default" : "pointer",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "#7A2424"; }}
            onMouseLeave={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "#5C1A1A"; }}
          >
            {loading ? "Verifying..." : "Enter Portal"}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

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
              href={`${import.meta.env.BASE_URL}book`}
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
            <button
              onClick={() => setShowAdminLogin(true)}
              title="Admin"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#C9A96E", opacity: 0.5, transition: "opacity 0.2s", display: "flex", alignItems: "center" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.5")}
            >
              <Lock size={14} />
            </button>
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
              href={`${import.meta.env.BASE_URL}book`}
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
            <motion.button
              onClick={() => { setIsMobileMenuOpen(false); setShowAdminLogin(true); }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.34 }}
              style={{
                background: "none", border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 8,
                fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "2px",
                color: "#C9A96E", textTransform: "uppercase",
              }}
            >
              <Lock size={12} />
              Admin
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAdminLogin && <AdminLoginModal onClose={() => setShowAdminLogin(false)} />}
      </AnimatePresence>
    </>
  );
}
