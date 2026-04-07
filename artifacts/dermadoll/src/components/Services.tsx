import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

type Treatment = {
  name: string;
  price: string;
  duration: string;
};

type Category = {
  title: string;
  items: Treatment[];
};

const services: Category[] = [
  {
    title: "Botox",
    items: [
      { name: "Botox 1 Area", price: "£100", duration: "15 mins" },
      { name: "Botox 2 Areas", price: "£140", duration: "15 mins" },
      { name: "Botox 3 Areas", price: "£180", duration: "15 mins" },
      { name: "Botox 4 Areas", price: "£210", duration: "15 mins" },
      { name: "Masseter Botox", price: "£200", duration: "15 mins" },
      { name: "Nefertiti Lift Botox (Neck)", price: "£220", duration: "30 mins" },
      { name: "Chin Botox (Mentalis Muscle)", price: "£80", duration: "30 mins" },
      { name: "Nose Slimming Botox", price: "£80", duration: "30 mins" },
      { name: "Gummy Smile / Lip Flip Botox", price: "£80", duration: "30 mins" },
      { name: "Hyperhidrosis (Underarm) Botox", price: "£220", duration: "30 mins" },
      { name: "Botox Topup", price: "£20", duration: "15 mins" },
    ],
  },
  {
    title: "Dermal Filler",
    items: [
      { name: "0.5ml Lip Filler", price: "£100", duration: "30 mins" },
      { name: "0.7ml Lip Filler", price: "£120", duration: "45 mins" },
      { name: "1.1ml Lip Filler", price: "£150", duration: "45 mins" },
      { name: "1.1ml Nasal Labials", price: "£150", duration: "30 mins" },
      { name: "1.1ml Cheek Filler", price: "£150", duration: "30 mins" },
      { name: "1.5ml Cheek Filler", price: "£200", duration: "45 mins" },
      { name: "2.2ml Cheek Filler", price: "£250", duration: "45 mins" },
      { name: "1.1ml Chin Filler", price: "£150", duration: "45 mins" },
      { name: "2.2ml Jawline Filler", price: "£250", duration: "1 hr" },
      { name: "Liquid Rhinoplasty", price: "£180", duration: "45 mins" },
      { name: "Teartrough Filler", price: "£180", duration: "45 mins" },
      { name: "2.2ml Facial Contouring", price: "£230", duration: "45 mins" },
      { name: "3.3ml Facial Contouring", price: "£330", duration: "1 hr" },
      { name: "4.4ml Facial Contouring", price: "£440", duration: "1 hr" },
    ],
  },
  {
    title: "Facials",
    items: [
      { name: "Glass Skin Facial", price: "£80", duration: "1 hr" },
      { name: "Glass Skin Facial + Microneedling", price: "£120", duration: "1 hr" },
    ],
  },
  {
    title: "Skin Boosters",
    items: [
      { name: "1x Skin Booster", price: "£150", duration: "30 mins" },
      { name: "3x Lumi Pro Skin Booster", price: "£350", duration: "30 mins" },
      { name: "Plenhyage XL Strong", price: "£200", duration: "30 mins" },
      { name: "Plenhyage XL Strong 2 Treatments", price: "£350", duration: "30 mins" },
      { name: "Vitarin I - Eye Polynucleotide", price: "£170", duration: "30 mins" },
      { name: "Vitarin I - Eye Polynucleotide x2", price: "£300", duration: "30 mins" },
      { name: "B12 Injection", price: "£30", duration: "15 mins" },
    ],
  },
  {
    title: "Fat Dissolving",
    items: [
      { name: "Lemon Bottle Small Area", price: "£70", duration: "30 mins" },
      { name: "Lemon Bottle Large Area", price: "£100", duration: "30 mins" },
    ],
  },
  {
    title: "Treatment Bundles",
    items: [
      { name: "Botox 3 Areas + 1.1ml Dermal Filler", price: "£320", duration: "45 mins" },
      { name: "Botox 3 Areas + 1.1ml Lips + Lumi Pro", price: "£450", duration: "1 hr" },
      { name: "Botox 3 Areas + 1x Lumi Pro Skin Booster", price: "£300", duration: "45 mins" },
      { name: "Botox 3 Areas + 1x Plenhyage XL", price: "£350", duration: "45 mins" },
      { name: "Botox 3 Areas + Vitarin I Eye", price: "£300", duration: "45 mins" },
    ],
  },
];

function CategoryDropdown({ category, index }: { category: Category; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06 }}
      style={{ borderBottom: "1px solid #C9A96E" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left py-5 md:py-[30px]"
      >
        <span
          className="font-serif italic text-foreground hover:text-primary transition-colors duration-200"
          style={{ fontSize: "22px" }}
        >
          {category.title}
        </span>
        <div className="flex items-center gap-4 flex-shrink-0 ml-4">
          <span className="text-xs tracking-widest uppercase text-foreground/40 font-light hidden sm:block">
            {category.items.length} treatments
          </span>
          <motion.span
            animate={{ rotate: open ? 45 : 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="text-primary text-2xl leading-none font-light"
          >
            +
          </motion.span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pb-4">
              {category.items.map((item, i) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.25 }}
                  className="flex items-start justify-between py-4 border-b last:border-b-0"
                  style={{ borderColor: "rgba(201,169,110,0.15)" }}
                >
                  <div className="flex flex-col">
                    <span className="text-sm md:text-base text-foreground font-light">
                      {item.name}
                    </span>
                    <span className="text-xs text-foreground/40 mt-0.5">{item.duration}</span>
                  </div>
                  <span
                    className="font-serif flex-shrink-0 ml-6"
                    style={{ fontSize: "20px", color: "#C9A96E" }}
                  >
                    {item.price}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Services() {
  return (
    <section id="services" className="py-[100px] bg-white">
      <div className="container mx-auto px-6 max-w-3xl">
        <div className="text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-[2rem] md:text-[56px] mb-5"
          >
            Our Treatments
          </motion.h2>
          <div className="w-[60px] h-px bg-primary mx-auto mb-5" />
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-foreground/60 font-light text-lg"
          >
            Explore our full range of aesthetic treatments
          </motion.p>
        </div>

        <div style={{ borderTop: "1px solid #C9A96E" }}>
          {services.map((category, i) => (
            <CategoryDropdown key={category.title} category={category} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
