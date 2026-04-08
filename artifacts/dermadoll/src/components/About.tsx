import { motion } from "framer-motion";
import { useState, useEffect } from "react";

function mediaUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("/objects/"))
    return `/api/media/serve?path=${encodeURIComponent(path)}`;
  return path;
}

export default function About() {
  const [practImage, setPractImage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/media/config")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.practitionerImage) {
          setPractImage(mediaUrl(data.practitionerImage));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section className="py-[100px] bg-secondary">
      <div className="container mx-auto px-4 max-w-4xl">

        {/* Heading — centred */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-serif text-[2rem] md:text-[56px] mb-5">Meet Dermadoll Aesthetics</h2>
          <div className="w-[60px] h-px bg-primary mx-auto" />
        </motion.div>

        {/* Two-column: photo + text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="flex flex-col md:flex-row md:items-center gap-10 md:gap-14 mb-20"
        >
          {/* Photo — 40% on desktop, full-width square on mobile */}
          <div className="w-full md:w-2/5 flex-shrink-0">
            {practImage ? (
              <img
                src={practImage}
                alt="Niamh — Dermadoll Aesthetics Practitioner"
                className="w-full object-cover rounded-[16px]"
                style={{
                  border: "1px solid #C9A96E",
                  aspectRatio: "1 / 1",
                }}
              />
            ) : (
              <div
                className="w-full flex flex-col items-center justify-center gap-3 rounded-[16px]"
                style={{
                  background: "#F5F5F5",
                  border: "1px solid #C9A96E",
                  aspectRatio: "1 / 1",
                }}
              >
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#CCCCCC"
                  strokeWidth="1.2"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
                <span
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "13px",
                    color: "#AAAAAA",
                  }}
                >
                  Photo coming soon
                </span>
              </div>
            )}
          </div>

          {/* Text — 60% on desktop */}
          <div className="w-full md:w-3/5 flex items-center justify-center">
            {/* Desktop: single paragraph unchanged */}
            <p className="hidden md:block text-foreground/80 leading-relaxed text-xl font-light text-left">
              Dermadoll Aesthetics is a premier face clinic dedicated to
              enhancing your natural beauty. Led by Niamh — a skilled,
              experienced practitioner — every treatment is tailored to you,
              combining the latest techniques with a warm, professional
              approach. Your comfort and results are our priority.
            </p>
            {/* Mobile: 3 short paragraphs */}
            <div className="md:hidden text-center">
              <p style={{ fontSize: "15px", lineHeight: "1.7", marginBottom: "16px", color: "#555555" }}>
                A premier face clinic dedicated to enhancing your natural beauty.
              </p>
              <p style={{ fontSize: "15px", lineHeight: "1.7", marginBottom: "16px", color: "#555555" }}>
                Led by <span style={{ color: "#C9A96E" }}>Niamh</span> — every treatment is tailored to you, combining the latest techniques with a warm, professional approach.
              </p>
              <p style={{ fontSize: "15px", lineHeight: "1.7", marginBottom: "16px", color: "#C9A96E" }}>
                Your comfort and results are our priority.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Divider */}
        <div className="h-px w-24 bg-primary mx-auto mb-12 opacity-50" />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="font-serif text-5xl text-primary mb-2">62</div>
            <div className="text-sm uppercase tracking-widest text-foreground/60 font-medium">
              Treatments Performed
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="font-serif text-5xl text-primary mb-2">★ 5.0</div>
            <div className="text-sm uppercase tracking-widest text-foreground/60 font-medium">
              Rating
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="font-serif text-5xl text-primary mb-2">5</div>
            <div className="text-sm uppercase tracking-widest text-foreground/60 font-medium">
              Five-Star Reviews
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
