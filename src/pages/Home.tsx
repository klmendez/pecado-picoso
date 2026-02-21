import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import ArmarPedido from "./ArmarPedido";
import ProductCarousel from "../components/home/ProductCarousel";
import imgAhogada from "../assets/referencias/ahogado.jpg";
import imgPicosa from "../assets/referencias/picosin.jpg";

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
            </motion.div>

            <div className="mt-8 text-xs text-white/70">
              *Domicilios sujetos a zona. En el local: próximamente.*
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Intro visual gomitas */}
    <section className="bg-neutral-950 text-white pt-14 pb-10">
      <div className="mx-auto max-w-5xl px-5 text-center">
        <div className="text-[10px] uppercase tracking-[0.28em] text-white/45">Gomitas</div>
        <h2 className="mt-2 text-[1.7rem] sm:text-3xl font-black leading-tight">Ahogadas o picosas, tú decides</h2>
        <p className="mt-3 text-[0.9rem] sm:text-sm text-white/70 leading-relaxed">
          Nuestras gomitas pueden ser ahogadas en chamoy o con un toque picoso. La presentación y el precio varía según la referencia que elijas.
        </p>

        <div className="mt-9 grid grid-cols-2 gap-4 sm:gap-8">
          <div className="flex flex-col items-center gap-3">
            <div className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-full overflow-hidden ring-1 ring-white/15 shadow-[0_10px_28px_rgba(0,0,0,0.45)]">
              <img src={imgAhogada} alt="Gomitas ahogadas" className="h-full w-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-black/20" aria-hidden />
            </div>
            <div className="text-[10px] uppercase tracking-[0.26em] text-white/65">Ahogada</div>
            <p className="text-[11px] sm:text-[12px] text-white/55 max-w-[11rem] sm:max-w-[12rem]">
              Bañadas en nuestro mix especial de chamoy.
            </p>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-full overflow-hidden ring-1 ring-white/15 shadow-[0_10px_28px_rgba(0,0,0,0.45)]">
              <img src={imgPicosa} alt="Gomitas picosas" className="h-full w-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-black/20" aria-hidden />
            </div>
            <div className="text-[10px] uppercase tracking-[0.26em] text-white/65">Picosa</div>
            <p className="text-[11px] sm:text-[12px] text-white/55 max-w-[11rem] sm:max-w-[12rem]">
              Con el toque justo de picante que enamora.
            </p>
          </div>
        </div>
      </div>
    </section>

    {/* Carrusel destacado */}
    <section className="bg-neutral-950 text-white pb-12 sm:pb-16">
      <div className="mx-auto max-w-6xl px-4">

        <ProductCarousel />

        <div className="text-center mt-8 sm:mt-10">
          <Link
            to="/armar"
            className="
              inline-flex items-center justify-center rounded-full px-6 py-2.5 font-black text-xs uppercase tracking-[0.16em] sm:text-sm sm:tracking-[0.2em]
              bg-gradient-to-r from-red-700 via-red-600 to-red-800
              text-white
              shadow-[0_10px_30px_rgba(220,38,38,0.45)]
              hover:scale-[1.03]
              hover:shadow-[0_14px_40px_rgba(220,38,38,0.65)]
              active:scale-[0.98]
              transition-all
            "
          >
            Quiero armar mi pedido
          </Link>
        </div>
      </div>
    </section>

    {/* Sección para armar pedido completa debajo del catálogo */}
    <div className="bg-neutral-950">
      <ArmarPedido />
    </div>
    </>
  );
}
