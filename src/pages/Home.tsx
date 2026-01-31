import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import ArmarPedido from "./ArmarPedido";





import bg1 from "../assets/home/1.jpeg";
import bg3 from "../assets/home/3.jpeg";
import pecadoImg from "../assets/home/pecado.png";


const INTERVAL_MS = 6500;

export default function Home() {
  const images = useMemo<string[]>(() => [bg1, bg3], []);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(t);
  }, [images.length]);

  return (
    <>
    <section className="relative isolate w-full min-h-screen overflow-hidden">
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={images[index]}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              backgroundImage: `url(${images[index]})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        </AnimatePresence>

        <div className="absolute inset-0 bg-black/70" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/15 to-black/5" />
      </div>

      <div className="relative z-10 min-h-screen w-full flex items-center">
        <div className="w-full px-6 md:px-12">
          <div className="pt-24 md:pt-28 max-w-4xl mx-auto text-center">
                    <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="
 mt-6 text-lg md:text-xl text-white/90 leading-relaxed
    uppercase
    font-bold
    text-white/100
  "
            >
              Bienvenidos a 
            </motion.span>
            <motion.img
              src={pecadoImg}
              alt="Pecado Picoso"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45 }}
              className="
    mx-auto
    mb-6
    w-40 md:w-52
    drop-shadow-[0_18px_40px_rgba(0,0,0,0.65)]
  "
            />

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="mt-6 text-lg md:text-xl text-white/100 leading-relaxed"
              style={{ textShadow: "0 12px 32px rgba(0,0,0,.6)" }}
            >
              ¡El antojo más atrevido de Popayán! 
              <br />
              Gomitas empanizadas o ahogadas en nuestro mix especial de chamoy artesanal y tajin .

              <br />
              Dulce, ácido y picoso… en una sola mordida
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="mt-8 flex flex-wrap gap-3 justify-center"
            >
              <Link
                to="/armar"
                className="
      rounded-full px-7 py-3 font-black text-sm md:text-base
      bg-gradient-to-r from-red-700 via-red-600 to-red-800
      text-white
      shadow-[0_10px_30px_rgba(220,38,38,0.45)]
      hover:scale-[1.03]
      hover:shadow-[0_14px_40px_rgba(220,38,38,0.65)]
      active:scale-[0.98]
      transition-all
    "
              >
                Armar pedido ahora
              </Link>

              <Link
                to="/catalogo"
                className="
      rounded-full px-7 py-3 font-black text-sm md:text-base
      border border-white/40
      text-white
      hover:bg-white/10
      hover:border-white/70
      transition
    "
              >
                Ver catálogo completo
              </Link>
            </motion.div>



            <div className="mt-8 text-xs text-white/70">
              *Domicilios sujetos a zona. En el local: próximamente.*
            </div>
          </div>
        </div>
      </div>
    </section>

    <ArmarPedido />
    </>

  );
 

}
