export const BRAND_NAME = "Pecado Picoso";
export const INSTAGRAM = "@pecadopicoso";
export const INSTAGRAM_URL = "https://www.instagram.com/pecadopicoso.pop/";
export const WHATSAPP_PHONE = "3178371144";
export const NEQUI_PHONE = "317 770 82 26";
export const CITY = "Popayán, Colombia";

export const waLink = (msg: string) =>
  `https://api.whatsapp.com/send?phone=57${WHATSAPP_PHONE}&text=${encodeURIComponent(msg)}`;

export const BUSINESS_HOURS = {
  weekdays: "Lun - Vie: 2:00 p.m. - 9:00 p.m.",
  weekend: "Sáb - Dom: 12:00 p.m. - 10:00 p.m.",
};
