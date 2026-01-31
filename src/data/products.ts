import minipecadoImg from "../assets/products/minipecado-40.png";
import pecadoCadaUnoImg from "../assets/products/pecado-cada-uno.png";
import picosaSupremaImg from "../assets/products/picosa-suprema.png";
import pecadoRealImg from "../assets/products/pecado-real.png";
import leyendaPicosaImg from "../assets/products/leyenda-picosa.png";
import duoShotImg from "../assets/products/duo-shot.png";
import mangoShotImg from "../assets/products/mango-shot.png";
import pinasonImg from "../assets/products/pinason-picoso.png";
export type Category = "gomitas" | "frutafresh";
export type Size = "pequeno" | "mediano" | "grande";
export type Version = "ahogada" | "picosa";

type BaseProduct = {
  id: string;
  category: Category;
  name: string;
  description: string;
  badge?: string;
  image?: string;
};

type GomitasProduct = BaseProduct & {
  category: "gomitas";
  toppingsIncludedMax: number;
  sizes: Size[];
  prices: Record<Version, Record<Size, number>>;
};

type FrutafreshPriceMap = {
  fijo?: number;
  porSize?: Partial<Record<Size, number>>;
};

type FrutafreshProduct = BaseProduct & {
  category: "frutafresh";
  sizes?: Size[];
  prices: FrutafreshPriceMap;
};

export type Product = GomitasProduct | FrutafreshProduct;

export function isFixedPrice(prices: FrutafreshPriceMap): prices is { fijo: number } {
  return typeof prices.fijo === "number";
}

export const PRODUCTS: Product[] = [
  // =====================
  // GOMITAS
  // =====================
  {
    id: "minipecado-40",
    category: "gomitas",
    name: "Minipecado 40g",
    description:
      "La dosis perfecta para un antojo rápido. Gomitas con equilibrio entre dulce, ácido y picante.",
    badge: "Mini",
    image: minipecadoImg,
    toppingsIncludedMax: 4,
    sizes: ["pequeno"],
    prices: {
      ahogada: { pequeno: 5900, mediano: 0, grande: 0 },
      picosa: { pequeno: 5900, mediano: 0, grande: 0 },
    },
  },

  // Según tu tabla:
  // Pecado Para cada uno: Ahogada 8500 / Picosa 9500
  {
    id: "pecado-cada-uno",
    category: "gomitas",
    name: "Pecado para cada uno",
    description:
      "Presentación individual para disfrutar en cualquier momento. Textura firme y sabor intenso.",
    image: pecadoCadaUnoImg,
    toppingsIncludedMax: 4,
    sizes: ["pequeno"],
    prices: {
      ahogada: { pequeno: 8500, mediano: 0, grande: 0 },
      picosa: { pequeno: 9500, mediano: 0, grande: 0 },
    },
  },

  // Según tu tabla:
  // Picosa Suprema: Ahogada 13500 / Picosa 14500
  {
    id: "picosa-suprema",
    category: "gomitas",
    name: "Picosa Suprema",
    description:
      "Versión intensa para quienes disfrutan el picante marcado y el contraste ácido.",
    badge: "Especial",
    image: picosaSupremaImg,
    toppingsIncludedMax: 4,
    sizes: ["pequeno"],
    prices: {
      ahogada: { pequeno: 13500, mediano: 0, grande: 0 },
      picosa: { pequeno: 14500, mediano: 0, grande: 0 },
    },
  },

  // Según tu tabla:
  // Pecado Real: Ahogada 18000 / Picosa 19500
  {
    id: "pecado-real",
    category: "gomitas",
    name: "Pecado Real",
    description:
      "Presentación grande pensada para compartir. La opción más completa para un antojo fuerte.",
    badge: "Familiar",
    image: pecadoRealImg,
    toppingsIncludedMax: 4,
    sizes: ["pequeno"],
    prices: {
      ahogada: { pequeno: 18000, mediano: 0, grande: 0 },
      picosa: { pequeno: 19500, mediano: 0, grande: 0 },
    },
  },

  // Según tu tabla:
  // Leyenda Picosa: Ahogada 28000 / Picosa 32000
  {
    id: "leyenda-picosa",
    category: "gomitas",
    name: "Leyenda Picosa",
    description:
      "Una combinación equilibrada de tamaño y sabor, con un toque de picante que se vuelve clásico.",
    badge: "Recomendada",
    image: leyendaPicosaImg,
    toppingsIncludedMax: 4,
    sizes: ["pequeno"],
    prices: {
      ahogada: { pequeno: 28000, mediano: 0, grande: 0 },
      picosa: { pequeno: 32000, mediano: 0, grande: 0 },
    },
  },

  // =====================
  // FRUTAFRESH
  // =====================
  {
    id: "duo-shot",
    category: "frutafresh",
    name: "Duo Shot",
    description: "Dos frutas en una sola presentación: piña y mango con chamoy y tajín.",
    badge: "Combo",
    image: duoShotImg,
    sizes: ["pequeno", "mediano"],
    prices: {
      porSize: {
        pequeno: 13500,
        mediano: 14500,
      },
    },
  },
  {
    id: "mango-shot",
    category: "frutafresh",
    name: "Mango Shot",
    description: "Vaso de mango fresco con chamoy, gomitas y un toque picoso.",
    image: mangoShotImg,
    sizes: ["pequeno", "mediano"],
    prices: {
      porSize: {
        pequeno: 13000,
        mediano: 14000,
      },
    },
  },
  {
    id: "pinason-picoso",
    category: "frutafresh",
    name: "Piñasón Picoso",
    description: "Rebanada de piña fresca bañada en chamoy artesanal y cubierta con tajín.",
    image: pinasonImg,
    prices: {
      fijo: 8000,
    },
  },
];

