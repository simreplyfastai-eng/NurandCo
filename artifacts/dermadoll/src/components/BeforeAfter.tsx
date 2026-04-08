import { motion } from "framer-motion";

const results = [
  { src: "result-1.jpg", label: "Liquid Rhinoplasty" },
  { src: "result-4.jpg", label: "Teeth Whitening" },
  { src: "result-2.jpg", label: "Lip Filler" },
  { src: "result-3.jpg", label: "Glass Skin Facial & Microneedling" },
];

export default function BeforeAfter() {
  return (
    <section className="py-[100px] bg-secondary">
      <div className="container mx-auto px-6 max-w-5xl">

        {/* Heading — unchanged */}
        <div className="text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-[2rem] md:text-[56px] mb-5"
          >
            Before & After
          </motion.h2>
          <div className="w-[60px] h-px bg-primary mx-auto mb-5" />
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-foreground/70 font-light text-lg"
          >
            Every result is natural, tailored and uniquely yours
          </motion.p>
        </div>

        {/* Image grid */}
        <div
          className="py-12"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
          }}
        >
          {results.map((item, i) => (
            <motion.div
              key={item.src}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.6 }}
              whileHover={{
                y: -4,
                boxShadow: "0 8px 24px rgba(201,169,110,0.2)",
              }}
              style={{
                justifySelf: "center",
                width: "100%",
                maxWidth: "420px",
                borderRadius: "12px",
                border: "2px solid #C9A96E",
                overflow: "hidden",
                cursor: "default",
                transition: "border-color 0.3s ease, box-shadow 0.3s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#B8934A";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#C9A96E";
              }}
            >
              {/* Square image */}
              <div style={{ aspectRatio: "1 / 1", width: "100%", overflow: "hidden" }}>
                <img
                  src={`${import.meta.env.BASE_URL}${item.src}`}
                  alt={item.label}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>

              {/* Label */}
              <div
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: "11px",
                  color: "#C9A96E",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  textAlign: "center",
                  marginTop: "10px",
                  paddingBottom: "14px",
                  paddingLeft: "8px",
                  paddingRight: "8px",
                }}
              >
                {item.label}
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
