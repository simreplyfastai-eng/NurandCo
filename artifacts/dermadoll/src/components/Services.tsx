import { motion } from "framer-motion";

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

export default function Services() {
  return (
    <section id="services" className="py-24 bg-white">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-serif text-4xl md:text-5xl mb-4"
          >
            Our Treatments
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-foreground/70 font-light text-lg"
          >
            Explore our full range of aesthetic treatments
          </motion.p>
        </div>

        <div className="space-y-20">
          {services.map((category, catIndex) => (
            <div key={category.title}>
              <div className="flex items-center gap-6 mb-8">
                <h3 className="font-serif italic text-3xl text-foreground whitespace-nowrap">
                  {category.title}
                </h3>
                <div className="h-[1px] w-full bg-primary/30" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.items.map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white p-6 border border-primary/30 rounded-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group flex flex-col justify-between"
                  >
                    <div>
                      <h4 className="font-medium text-foreground text-sm mb-3 leading-snug group-hover:text-primary transition-colors">
                        {item.name}
                      </h4>
                    </div>
                    <div className="flex justify-between items-end mt-4">
                      <span className="font-serif text-2xl text-primary">{item.price}</span>
                      <span className="text-xs text-foreground/50">{item.duration}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
