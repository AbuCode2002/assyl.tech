/** Public company info. */
export const site = {
  name: "assyl.tech",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://assyltech.kz",
  city: { ru: "Алматы", kz: "Алматы", en: "Almaty" },
  coords: "43.2389° N · 76.8897° E",
  timezone: "Asia/Almaty",
  contacts: {
    email: "akopbulsynov@gmail.com",
    phone: "+7 771 032 16 38",
    instagram: "assyl.tech",
    telegram: "Abdurrakhim02",
    whatsapp: "77710321638",
  },
} as const;

export const contactLinks = {
  email: `mailto:${site.contacts.email}`,
  phone: `tel:${site.contacts.phone.replace(/[^\d+]/g, "")}`,
  instagram: `https://instagram.com/${site.contacts.instagram}`,
  telegram: `https://t.me/${site.contacts.telegram}`,
  whatsapp: `https://wa.me/${site.contacts.whatsapp}`,
} as const;
