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
    <section id="about" className="py-[100px]" style={{ background: "#F0EBE1" }}>
      <div className="container mx-auto px-4 max-w-4xl">

        {/* Eyebrow + heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <p className="font-sans uppercase tracking-[0.35em] text-[10px] mb-4" style={{ color: "#C8860A" }}>
            About
          </p>
          <h2 className="font-serif font-bold text-[#1A0F00]" style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)" }}>
            Meet Face By Niamh
          </h2>
          <div className="flex items-center justify-center gap-3 mt-5">
            <div className="h-px w-8" style={{ background: "#C8860A", opacity: 0.5 }} />
            <span style={{ color: "#C8860A", fontSize: "10px", opacity: 0.6 }}>✦</span>
            <div className="h-px w-8" style={{ background: "#C8860A", opacity: 0.5 }} />
          </div>
        </motion.div>

        {/* Two-column: photo + text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="flex flex-col md:flex-row md:items-center gap-10 md:gap-14 mb-20"
        >
          {/* Photo */}
          <div className="w-full md:w-2/5 flex-shrink-0">
            {practImage ? (
              <img
                src={practImage}
                alt="Niamh — Face By Niamh Aesthetics"
                className="w-full object-cover"
                style={{
                  border: "1px solid #E2DDD5",
                  aspectRatio: "1 / 1",
                }}
              />
            ) : (
              <div
                className="w-full flex flex-col items-center justify-center gap-3"
                style={{
                  background: "#FAF7F2",
                  border: "1px solid #E2DDD5",
                  aspectRatio: "1 / 1",
                }}
              >
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#C8C0B4" strokeWidth="1">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
                <span className="font-sans text-[12px]" style={{ color: "#C8C0B4" }}>Photo coming soon</span>
              </div>
            )}
          </div>

          {/* Text */}
          <div className="w-full md:w-3/5">
            <p className="hidden md:block font-serif text-[#1A0F00]/80 leading-relaxed text-xl font-light">
              Face By Niamh is an advanced aesthetics clinic based in Leeds and Wakefield, run by Niamh — an Advanced Aesthetics Practitioner and Student Nurse. Every treatment is tailored to you, combining the latest techniques with a warm, professional approach and a commitment to natural-looking results.
            </p>
            <div className="md:hidden text-center">
              <p className="font-sans mb-4" style={{ fontSize: "15px", lineHeight: "1.75", color: "#6B6260" }}>
                An advanced aesthetics clinic based in Leeds and Wakefield.
              </p>
              <p className="font-sans mb-4" style={{ fontSize: "15px", lineHeight: "1.75", color: "#6B6260" }}>
                Led by <span style={{ color: "#C8860A" }}>Niamh</span> — every treatment is tailored to you, combining the latest techniques with a warm, professional approach.
              </p>
              <p className="font-sans" style={{ fontSize: "15px", lineHeight: "1.75", color: "#C8860A" }}>
                Natural results. Your comfort, always our priority.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Divider */}
        <div className="h-px w-20 mx-auto mb-14" style={{ background: "#C8860A", opacity: 0.3 }} />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 text-center">
          {[
            { value: "100+", label: "Treatments Performed" },
            { value: "★ 5.0", label: "Average Rating" },
            { value: "Leeds & Wakefield", label: "Clinic Locations" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
            >
              <div className="font-serif text-4xl mb-2" style={{ color: "#C8860A" }}>{stat.value}</div>
              <div className="font-sans text-[11px] uppercase tracking-widest" style={{ color: "#6B6260" }}>
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
