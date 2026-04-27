import { motion } from "framer-motion";
import { Star } from "lucide-react";

const reviews = [
  {
    quote: "Eva is absolutely incredible. My lips look so natural, everyone thinks I was born with them. NaturalèLips™ is unlike anything I've had before.",
    name: "Sarah M.",
    location: "Essex",
  },
  {
    quote: "I was so nervous for my first treatment but Eva made me feel completely at ease. The results are stunning and exactly what I wanted.",
    name: "Jessica R.",
    location: "London",
  },
  {
    quote: "Been to the [LOCATION_2] clinic twice now. The space is beautiful and Eva's expertise is second to none. Worth every penny.",
    name: "Amara K.",
    location: "London",
  },
  {
    quote: "Eva's attention to detail is remarkable. My tear trough filler has taken years off my face. I've never felt more confident.",
    name: "Claire B.",
    location: "Essex",
  },
  {
    quote: "The NaturalèLips™ technique is my absolute favourite. Eva really listens to what you want and delivers every single time.",
    name: "Priya S.",
    location: "Essex",
  },
  {
    quote: "I trained with Eva through Nur & Co Academy and it was genuinely life-changing. Brilliant educator and incredible practitioner.",
    name: "Natasha W.",
    location: "London",
  },
];

function ReviewCard({ r }: { r: typeof reviews[number] }) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        padding: "32px 28px",
        border: "1px solid #F0EBE3",
        width: 320,
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", gap: 2, marginBottom: 16 }}>
        {Array.from({ length: 5 }).map((_, si) => (
          <Star key={si} size={13} fill="var(--brand-accent)" color="var(--brand-accent)" />
        ))}
      </div>
      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "1rem", color: "var(--brand-text)", lineHeight: 1.7, margin: "0 0 20px" }}>
        "{r.quote}"
      </p>
      <div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "0.95rem", color: "var(--brand-primary)" }}>{r.name}</div>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "var(--brand-accent)", marginTop: 2 }}>{r.location}</div>
      </div>
    </div>
  );
}

export default function Reviews() {
  const doubled = [...reviews, ...reviews];

  return (
    <section id="reviews" style={{ background: "var(--brand-bg-alt)", padding: "100px 0", overflow: "hidden" }}>
      <style>{`
        @keyframes marquee-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .reviews-marquee-track {
          display: flex;
          gap: 16px;
          width: max-content;
          animation: marquee-scroll 30s linear infinite;
          will-change: transform;
        }
        .reviews-marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: "center", marginBottom: 48 }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ height: 1, width: 28, background: "var(--brand-accent)" }} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: "var(--brand-accent)" }}>Client Love</span>
            <div style={{ height: 1, width: 28, background: "var(--brand-accent)" }} />
          </div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 400, color: "var(--brand-primary)", margin: 0 }}>
            What Our Clients Say
          </h2>
        </motion.div>
      </div>

      <div style={{ overflow: "hidden" }}>
        <div className="reviews-marquee-track">
          {doubled.map((r, i) => (
            <ReviewCard key={i} r={r} />
          ))}
        </div>
      </div>
    </section>
  );
}
