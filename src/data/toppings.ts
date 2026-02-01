// src/data/toppings.ts
import aros from "../assets/topings/aros.jpg";
import banderasSandia from "../assets/topings/banderas-sandia.jpg";
import banderasColombia from "../assets/topings/colombia.jpg";
import gusanos from "../assets/topings/gusanos.jpg";
import mangoBiche from "../assets/topings/mango-biche.jpg";
//import ositos from "../assets/topings/ositos.webp";
//import tiburones from "../assets/topings/tiburones.jpg";
import tortugas from "../assets/topings/tortugas.webp";

export type Topping = {
  id: string;
  name: string;
  imageSrc: string;
  title?: string;
  subtitle?: string;
};

export const TOPPINGS: Topping[] = [
  { id: "aros", name: "Aritos", imageSrc: aros, title: "ARITOS ÁCIDOS", subtitle: "Explosión\nácida" },
  { id: "banderas-sandia", name: "Banderas Sandia", imageSrc: banderasSandia, title: "BANDERAS", subtitle: "Dulce y\nácido" },
  { id: "gusanos", name: "Gusanos", imageSrc: gusanos, title: "GUSANOS PICOSOS", subtitle: "Picante\nsuave" },
  { id: "mango-biche", name: "Mango", imageSrc: mangoBiche, title: "MANGO BICHE", subtitle: "Ácido\nrico" },
 // { id: "ositos", name: "Ositos", imageSrc: ositos, title: "OSITOS", subtitle: "Clásicos\nsuaves" },
  //{ id: "tiburones", name: "Tiburones", imageSrc: tiburones, title: "TIBURONES", subtitle: "Textura\nfirme" },
  { id: "tortugas", name: "Tortugas", imageSrc: tortugas, title: "TORTUGUITAS", subtitle: "Dulce\nchewy" },
  { id: "banderas-colombia", name: "Banderas Colombia", imageSrc: banderasColombia, title: "BANDERAS", subtitle: "Dulce y\nácido" },
];
