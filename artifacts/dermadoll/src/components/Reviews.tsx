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
    quote: "Been to the Marylebone clinic twice now. The space is beautiful and Eva's expertise is second to none. Worth every penny.",
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
    quote: "I trained with Eva through Starr Academy and it was genuinely life-changing. Brilliant educator and incredible practitioner.",
    name: "Natasha W.",
    location: "London",
  },
];

export default function Reviews() {
  return (
    <section id="reviews" style={{ background: "#F5F0EB", padding: "100px 0" }}>
      <style>{`
        .reviews-outer { max-width: 1100px; margin: 0 auto; padding: 0 32px; }
        .reviews-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        @media (max-width: 768px) {
          .reviews-outer { padding: 0 !important; }
          .reviews-grid {
            display: flex !important;
            flex-direction: row !important;
            overflow-x: auto !important;
            scroll-snap-type: x mandatory !important;
            -webkit-overflow-scrolling: touch !important;
            gap: 12px !important;
            padding: 0 24px 16px !important;
            scrollbar-width: none !important;
          }
          .reviews-grid::-webkit-scrollbar { display: none !important; }
          .review-card {
            min-width: calc(85vw) !important;
            max-width: calc(85vw) !important;
            scroll-snap-align: center !important;
            flex-shrink: 0 !important;
          }
          .reviews-header { padding: 0 24px !important; }
        }
      `}</style>
      <div className="reviews-outer">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="reviews-header"
          style={{ textAlign: "center", marginBottom: 48 }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ height: 1, width: 28, background: "#C9A96E" }} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: "#C9A96E" }}>Client Love</span>
            <div style={{ height: 1, width: 28, background: "#C9A96E" }} />
          </div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 400, color: "#5C1A1A", margin: 0 }}>
            What Our Clients Say
          </h2>
        </motion.div>

        <div className="reviews-grid">
          {reviews.map((r, i) => (
            <motion.div
              key={i}
              className="review-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              style={{ background: "#FFFFFF", padding: "32px 28px", border: "1px solid #F0EBE3" }}
            >
              <div style={{ display: "flex", gap: 2, marginBottom: 16 }}>
                {Array.from({ length: 5 }).map((_, si) => (
                  <Star key={si} size={13} fill="#C9A96E" color="#C9A96E" />
                ))}
              </div>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "1rem", color: "#3D3D3D", lineHeight: 1.7, margin: "0 0 20px" }}>
                "{r.quote}"
              </p>
              <div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "0.95rem", color: "#5C1A1A" }}>{r.name}</div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "#C9A96E", marginTop: 2 }}>{r.location}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
