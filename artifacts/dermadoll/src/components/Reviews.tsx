import { motion, AnimatePresence } from "framer-motion";
import { Star } from "lucide-react";
import { useState, useRef } from "react";

const reviews = [
  {
    name: "Ellisha W.",
    date: "February 2026",
    text: "I have only ever been to Niamh for my aesthetics and she does everything so professionally! I am always so pleased with the results."
  },
  {
    name: "Donna S.",
    date: "February 2026",
    text: "Very good at her job — the best I've been to for my treatment."
  },
  {
    name: "Donna S.",
    date: "December 2025",
    text: "The best."
  }
];

function ReviewCard({ review }: { review: typeof reviews[0] }) {
  return (
    <div className="bg-white p-8 border border-primary/10 rounded-sm shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col h-full w-full">
      <div className="flex gap-1 text-primary mb-6">
        {[1,2,3,4,5].map((s) => <Star key={s} size={14} fill="currentColor" />)}
      </div>
      <p className="text-foreground/80 font-light leading-relaxed mb-8 flex-grow">
        "{review.text}"
      </p>
      <div className="border-t border-primary/10 pt-4 mt-auto">
        <div className="font-medium text-sm">{review.name}</div>
        <div className="text-xs text-foreground/50 mt-1">{review.date}</div>
      </div>
    </div>
  );
}

export default function Reviews() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const paginate = (dir: number) => {
    setDirection(dir);
    setCurrent((c) => (c + dir + reviews.length) % reviews.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) paginate(diff > 0 ? 1 : -1);
    touchStartX.current = null;
  };

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  };

  return (
    <section id="reviews" className="py-[100px] bg-white">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-[2rem] md:text-[56px] mb-5"
          >
            What Our Clients Say
          </motion.h2>
          <div className="w-[60px] h-px bg-primary mx-auto mb-5" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center gap-2"
          >
            <div className="flex gap-1 text-primary">
              {[1,2,3,4,5].map((s) => <Star key={s} size={20} fill="currentColor" />)}
            </div>
            <div className="text-foreground/70 font-medium tracking-wide">
              5.0 <span className="font-light mx-2">|</span> 5 Reviews
            </div>
            <div className="text-xs text-foreground/50 uppercase tracking-widest mt-2">
              Powered by Faces
            </div>
          </motion.div>
        </div>

        {/* Mobile carousel */}
        <div className="md:hidden">
          <div
            className="relative overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <AnimatePresence custom={direction} mode="wait">
              <motion.div
                key={current}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <ReviewCard review={reviews[current]} />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {reviews.map((_, i) => (
              <button
                key={i}
                onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
                className="w-2 h-2 rounded-full transition-all duration-300"
                style={{ backgroundColor: i === current ? "hsl(var(--primary))" : "hsl(var(--primary)/0.25)" }}
              />
            ))}
          </div>
        </div>

        {/* Desktop grid */}
        <div className="hidden md:grid grid-cols-3 gap-8">
          {reviews.map((review, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 + 0.2, duration: 0.6 }}
              className="flex flex-col h-full"
            >
              <ReviewCard review={review} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
