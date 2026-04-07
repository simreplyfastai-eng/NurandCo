import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

function ComparisonSlider({ 
  beforeSrc, 
  afterSrc, 
  label 
}: { 
  beforeSrc: string; 
  afterSrc: string; 
  label: string 
}) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setPosition(percent);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    handleMove(e.clientX);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <div className="flex flex-col gap-4">
      <div 
        ref={containerRef}
        className="relative w-full aspect-[4/5] bg-[#E8E6E1] overflow-hidden rounded-sm cursor-ew-resize select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* Fallback/After Image */}
        <div className="absolute inset-0 w-full h-full flex items-center justify-center">
          <img 
            src={afterSrc} 
            alt={`After ${label}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement!.innerHTML = `<div class="text-foreground/40 font-serif italic text-lg">After Image</div>`;
            }}
          />
        </div>

        {/* Before Image (clipped) */}
        <div 
          className="absolute inset-0 h-full overflow-hidden border-r-2 border-primary"
          style={{ width: `${position}%` }}
        >
          <div className="absolute inset-0 w-[100vw] max-w-[400px] sm:max-w-none h-full flex items-center justify-center bg-[#F2F0EB]">
             <img 
              src={beforeSrc} 
              alt={`Before ${label}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement!.innerHTML = `<div class="text-foreground/40 font-serif italic text-lg">Before Image</div>`;
              }}
            />
          </div>
        </div>

        {/* Draggable handle line is handled by border-r-2 above, add a knob */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center border border-primary/20 pointer-events-none"
          style={{ left: `${position}%` }}
        >
          <div className="flex gap-1">
            <div className="w-0.5 h-3 bg-primary/40 rounded-full"></div>
            <div className="w-0.5 h-3 bg-primary/40 rounded-full"></div>
          </div>
        </div>

        {/* Labels */}
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white text-[10px] uppercase tracking-widest px-3 py-1 rounded-full pointer-events-none">
          Before
        </div>
        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white text-[10px] uppercase tracking-widest px-3 py-1 rounded-full pointer-events-none">
          After
        </div>
      </div>
      <h4 className="text-center font-sans text-xs uppercase tracking-[0.2em] text-primary font-medium">
        {label}
      </h4>
    </div>
  );
}

export default function BeforeAfter() {
  const examples = [
    { label: "Lip Filler", before: "before-after-1-before.jpg", after: "before-after-1-after.jpg" },
    { label: "Cheek Filler", before: "before-after-2-before.jpg", after: "before-after-2-after.jpg" },
    { label: "Botox 3 Areas", before: "before-after-3-before.jpg", after: "before-after-3-after.jpg" },
    { label: "Jawline Filler", before: "before-after-4-before.jpg", after: "before-after-4-after.jpg" },
  ];

  return (
    <section className="py-24 bg-secondary">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-4xl md:text-5xl mb-4"
          >
            Real Results
          </motion.h2>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-8 lg:gap-16">
          {examples.map((ex, i) => (
            <motion.div
              key={ex.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
            >
              <ComparisonSlider beforeSrc={ex.before} afterSrc={ex.after} label={ex.label} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
