// Public business details shown on the site. Edit these (or the VITE_ variables) before launch.
export const SITE = {
  name: "QuickFix Home",
  tagline: "Repair • Restore • Relax",
  phone: import.meta.env.VITE_SUPPORT_PHONE || "+91 85099 97120",
  email: import.meta.env.VITE_SUPPORT_EMAIL || "support@quickfixhome.in",
  whatsapp: import.meta.env.VITE_SUPPORT_WHATSAPP || "91 85099 97120",
  address: "Purulia, West Bengal",
  supportHours: "Phone & WhatsApp: 8 AM – 9 PM, every day",
  areas: ["Purulia", "Raghunathpur", "Jhalda", "Adra", "Manbazar", "Hura"],
  // Leave a value empty to hide that icon in the footer.
  social: { facebook: "", youtube: "", instagram: "" },
};

export const TIME_SLOTS = [
  { value: "09:00-12:00", label: "9 AM – 12 PM" },
  { value: "12:00-15:00", label: "12 PM – 3 PM" },
  { value: "15:00-18:00", label: "3 PM – 6 PM" },
  { value: "18:00-21:00", label: "6 PM – 9 PM" },
];

export const ROLE_HOME = {
  customer: "/dashboard",
  technician: "/technician",
  admin: "/admin",
};
export const telHref = (phone) => `tel:${String(phone).replace(/[^\d+]/g, "")}`;
