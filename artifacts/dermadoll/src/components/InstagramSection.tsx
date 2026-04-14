import { motion } from "framer-motion";

const posts = [
  { src: "result-1.jpg", alt: "Liquid Rhinoplasty" },
  { src: "result-4.jpg", alt: "Teeth Whitening" },
  { src: "result-2.jpg", alt: "Lip Filler" },
  { src: "result-3.jpg", alt: "Glass Skin Facial" },
  { src: "result-1.jpg", alt: "Liquid Rhinoplasty" },
  { src: "result-2.jpg", alt: "Lip Filler" },
];

const floatVariants = [
  { y: [0, -12, 0], rotate: [-1.5, 1, -1.5], duration: 6 },
  { y: [0, 10, 0], rotate: [1, -1.5, 1], duration: 7 },
  { y: [0, -8, 0], rotate: [-0.5, 2, -0.5], duration: 5.5 },
  { y: [0, 14, 0], rotate: [2, -1, 2], duration: 8 },
  { y: [0, -10, 0], rotate: [-1, 1.5, -1], duration: 6.5 },
  { y: [0, 8, 0], rotate: [0.5, -2, 0.5], duration: 7.5 },
];

export default function InstagramSection() {
  return (
    <section className="py-[100px] overflow-hidden" style={{ backgroundColor: "#FAF7F2" }}>
      <div className="container mx-auto px-6 max-w-5xl">
        {/* Heading */}
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-sans text-xs uppercase tracking-[0.35em] mb-4"
            style={{ color: "#C9A96E" }}
          >
            Follow Along
          </motion.p>
          <motion.a
            href="https://instagram.com/facebyniamh"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-serif text-[2rem] md:text-[48px] text-white hover:text-primary transition-colors duration-300 block"
          >
            @facebyniamh
          </motion.a>
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="w-[60px] h-px bg-primary mx-auto mt-5"
          />
        </div>

        {/* Floating posts grid */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 md:gap-4 mb-14">
          {posts.map((post, i) => {
            const variant = floatVariants[i % floatVariants.length];
            return (
              <motion.a
                key={`${post.src}-${i}`}
                href="https://instagram.com/facebyniamh"
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.5 }}
                animate={{
                  y: variant.y,
                  rotate: variant.rotate,
                }}
                whileHover={{ scale: 1.06, zIndex: 10 }}
                style={{
                  transition: "box-shadow 0.3s",
                  // @ts-ignore
                  "--hover-shadow": "0 12px 40px rgba(201,169,110,0.25)",
                }}
              >
                <motion.div
                  animate={{ y: variant.y, rotate: variant.rotate }}
                  transition={{
                    duration: variant.duration,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.4,
                  }}
                  className="relative overflow-hidden rounded-sm shadow-lg aspect-square"
                  style={{ border: "1px solid rgba(201,169,110,0.2)" }}
                >
                  <img
                    src={`${import.meta.env.BASE_URL}${post.src}`}
                    alt={post.alt}
                    className="w-full h-full object-cover"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300"
                    style={{ background: "rgba(201,169,110,0.18)" }}>
                    <svg width="28" height="28" fill="white" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </div>
                </motion.div>
              </motion.a>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <a
            href="https://instagram.com/facebyniamh"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-3.5 rounded-full text-sm uppercase tracking-wider font-medium transition-all duration-300 hover:opacity-90"
            style={{
              border: "1px solid #C9A96E",
              color: "#C9A96E",
              backgroundColor: "transparent",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "#C9A96E";
              (e.currentTarget as HTMLAnchorElement).style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "transparent";
              (e.currentTarget as HTMLAnchorElement).style.color = "#C9A96E";
            }}
          >
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            Follow on Instagram
          </a>
        </motion.div>
      </div>
    </section>
  );
}
