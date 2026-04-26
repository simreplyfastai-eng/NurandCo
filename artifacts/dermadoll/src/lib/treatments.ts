export interface Treatment {
  id: string;
  name: string;
  display: string;
  duration: string;
  price: string;
}

export interface TreatmentGroup {
  group: string;
  items: { subname: string; treatments: Treatment[] }[];
}

export const SERVICES: Record<"[location-1-slug]" | "[location-2-slug]", TreatmentGroup[]> = {
  hornchurch: [
    {
      group: "SIGNATURE TREATMENTS",
      items: [
        {
          subname: "NaturalèLips™",
          treatments: [
            { id: "nl-05", name: "NaturalèLips™ 0.5ml", display: "0.5ml", duration: "45 mins", price: "£140" },
            { id: "nl-08", name: "NaturalèLips™ 0.8ml", display: "0.8ml", duration: "45 mins", price: "£185" },
            { id: "nl-11", name: "NaturalèLips™ 1.1ml", display: "1.1ml", duration: "45 mins", price: "£200" },
          ],
        },
        {
          subname: "HD Sculpt Lips",
          treatments: [
            { id: "hd-08", name: "HD Sculpt Lips 0.8ml", display: "0.8ml", duration: "1 hr", price: "£195" },
            { id: "hd-11", name: "HD Sculpt Lips 1.1ml", display: "1.1ml", duration: "1 hr", price: "£225" },
          ],
        },
      ],
    },
    {
      group: "DERMAL FILLERS",
      items: [
        {
          subname: "Facial Contouring",
          treatments: [
            { id: "fc-cheek", name: "Cheek Filler", display: "Cheek Filler", duration: "45 mins", price: "£180" },
            { id: "fc-jaw", name: "Jaw Filler", display: "Jaw Filler", duration: "45 mins", price: "£180" },
            { id: "fc-chin", name: "Chin Filler", display: "Chin Filler", duration: "30 mins", price: "£150" },
            { id: "fc-tt", name: "Tear Trough", display: "Tear Trough", duration: "45 mins", price: "£220" },
          ],
        },
      ],
    },
    {
      group: "SKIN TREATMENTS",
      items: [
        {
          subname: "Injectables",
          treatments: [
            { id: "sb-prof", name: "Profhilo (2-session course)", display: "Profhilo", duration: "30 mins", price: "£280" },
            { id: "sb-pdrn", name: "Polynucleotides", display: "Polynucleotides", duration: "45 mins", price: "£180" },
            { id: "sb-lumi", name: "Lumi Eyes", display: "Lumi Eyes", duration: "30 mins", price: "£150" },
          ],
        },
        {
          subname: "Facials",
          treatments: [
            { id: "skin-dp", name: "Dermaplaning", display: "Dermaplaning", duration: "45 mins", price: "£55" },
            { id: "skin-mn", name: "Microneedling", display: "Microneedling", duration: "1 hr", price: "£120" },
          ],
        },
      ],
    },
    {
      group: "ANTI-WRINKLE",
      items: [
        {
          subname: "Toxin Treatments",
          treatments: [
            { id: "aw-1", name: "Anti-Wrinkle, 1 Area", display: "1 Area", duration: "20 mins", price: "£140" },
            { id: "aw-2", name: "Anti-Wrinkle, 2 Areas", display: "2 Areas", duration: "20 mins", price: "£170" },
            { id: "aw-3", name: "Anti-Wrinkle, 3 Areas", display: "3 Areas", duration: "30 mins", price: "£200" },
            { id: "aw-lb", name: "Lip Blush Tox", display: "Lip Blush Tox", duration: "20 mins", price: "£80" },
          ],
        },
      ],
    },
    {
      group: "EYELASH & BROW",
      items: [
        {
          subname: "Lash Extensions",
          treatments: [
            { id: "lb-classic", name: "Classic Lash Set", display: "Classic Set", duration: "1.5 hrs", price: "£55" },
            { id: "lb-hybrid", name: "Hybrid Lash Set", display: "Hybrid Set", duration: "2 hrs", price: "£65" },
            { id: "lb-volume", name: "Russian Volume", display: "Russian Volume", duration: "2.5 hrs", price: "£75" },
            { id: "lb-infill", name: "Lash Infill", display: "Infill", duration: "1 hr", price: "£35" },
          ],
        },
        {
          subname: "Brows",
          treatments: [
            { id: "br-laminate", name: "Brow Lamination", display: "Lamination", duration: "45 mins", price: "£45" },
            { id: "br-tint", name: "Brow Tint & Shape", display: "Tint & Shape", duration: "30 mins", price: "£22" },
            { id: "br-henna", name: "Henna Brows", display: "Henna Brows", duration: "45 mins", price: "£35" },
          ],
        },
      ],
    },
  ],
  marylebone: [
    {
      group: "SIGNATURE TREATMENTS",
      items: [
        {
          subname: "NaturalèLips™",
          treatments: [
            { id: "m-nl-05", name: "NaturalèLips™ 0.5ml", display: "0.5ml", duration: "45 mins", price: "£160" },
            { id: "m-nl-08", name: "NaturalèLips™ 0.8ml", display: "0.8ml", duration: "45 mins", price: "£205" },
            { id: "m-nl-11", name: "NaturalèLips™ 1.1ml", display: "1.1ml", duration: "45 mins", price: "£220" },
          ],
        },
        {
          subname: "HD Sculpt Lips",
          treatments: [
            { id: "m-hd-08", name: "HD Sculpt Lips 0.8ml", display: "0.8ml", duration: "1 hr", price: "£215" },
            { id: "m-hd-11", name: "HD Sculpt Lips 1.1ml", display: "1.1ml", duration: "1 hr", price: "£245" },
          ],
        },
      ],
    },
    {
      group: "DERMAL FILLERS",
      items: [
        {
          subname: "Facial Contouring",
          treatments: [
            { id: "m-fc-cheek", name: "Cheek Filler", display: "Cheek Filler", duration: "45 mins", price: "£200" },
            { id: "m-fc-jaw", name: "Jaw Filler", display: "Jaw Filler", duration: "45 mins", price: "£200" },
            { id: "m-fc-chin", name: "Chin Filler", display: "Chin Filler", duration: "30 mins", price: "£170" },
            { id: "m-fc-tt", name: "Tear Trough", display: "Tear Trough", duration: "45 mins", price: "£240" },
          ],
        },
      ],
    },
    {
      group: "SKIN TREATMENTS",
      items: [
        {
          subname: "Injectables",
          treatments: [
            { id: "m-sb-prof", name: "Profhilo (2-session course)", display: "Profhilo", duration: "30 mins", price: "£300" },
            { id: "m-sb-pdrn", name: "Polynucleotides", display: "Polynucleotides", duration: "45 mins", price: "£200" },
            { id: "m-sb-lumi", name: "Lumi Eyes", display: "Lumi Eyes", duration: "30 mins", price: "£170" },
          ],
        },
      ],
    },
    {
      group: "ANTI-WRINKLE",
      items: [
        {
          subname: "Toxin Treatments",
          treatments: [
            { id: "m-aw-1", name: "Anti-Wrinkle, 1 Area", display: "1 Area", duration: "20 mins", price: "£160" },
            { id: "m-aw-2", name: "Anti-Wrinkle, 2 Areas", display: "2 Areas", duration: "20 mins", price: "£190" },
            { id: "m-aw-3", name: "Anti-Wrinkle, 3 Areas", display: "3 Areas", duration: "30 mins", price: "£220" },
          ],
        },
      ],
    },
    {
      group: "EYELASH & BROW",
      items: [
        {
          subname: "Lash Extensions",
          treatments: [
            { id: "m-lb-classic", name: "Classic Lash Set", display: "Classic Set", duration: "1.5 hrs", price: "£65" },
            { id: "m-lb-hybrid", name: "Hybrid Lash Set", display: "Hybrid Set", duration: "2 hrs", price: "£75" },
            { id: "m-lb-volume", name: "Russian Volume", display: "Russian Volume", duration: "2.5 hrs", price: "£85" },
            { id: "m-lb-infill", name: "Lash Infill", display: "Infill", duration: "1 hr", price: "£40" },
          ],
        },
        {
          subname: "Brows",
          treatments: [
            { id: "m-br-laminate", name: "Brow Lamination", display: "Lamination", duration: "45 mins", price: "£55" },
            { id: "m-br-tint", name: "Brow Tint & Shape", display: "Tint & Shape", duration: "30 mins", price: "£28" },
            { id: "m-br-henna", name: "Henna Brows", display: "Henna Brows", duration: "45 mins", price: "£42" },
          ],
        },
      ],
    },
  ],
};

export function findTreatment(locationSlug: string, treatmentId: string): Treatment | null {
  const loc = SERVICES[locationSlug as "[location-1-slug]" | "[location-2-slug]"];
  if (!loc) return null;
  for (const group of loc) {
    for (const item of group.items) {
      for (const t of item.treatments) {
        if (t.id === treatmentId) return t;
      }
    }
  }
  return null;
}
