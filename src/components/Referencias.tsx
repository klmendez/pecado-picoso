import { motion } from "framer-motion";
import imgAhogado from "../assets/referencias/ahogado.jpg";
import imgPicosin from "../assets/referencias/picosin.jpg";
import pecadoImg from "../assets/home/pecado.png";

type RefItem = {
  key: "ahogado" | "picosin";
  name: string;
  title: string;
  subtitle: string;
  imageSrc: string;
};

export default function Referencias() {
  const items: RefItem[] = [
    {
      key: "ahogado",
      name: "ahogado",
      title: "CAPRICHO AHOGADO",
      subtitle: "Pura tentación\nen cada gota",
      imageSrc: imgAhogado,
    },
    {
      key: "picosin",
      name: "picosin",
      title: "CAPRICHO PICOSIN",
      subtitle: "Intensidad que\nenamora",
      imageSrc: imgPicosin,
    },
  ];

  return (
    <section className="w-full py-10">
      <div className="mx-auto max-w-4xl px-4">
        <motion.img
          src={pecadoImg}
          alt="Pecado Picoso"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45 }}
          className="
            mx-auto mb-6
            w-20 md:w-36
            drop-shadow-[0_18px_40px_rgba(0,0,0,0.65)]
          "
        />

        <h2 className="text-center text-lg md:text-2xl font-black tracking-tight text-white">
          TENEMOS <span className="text-white/80">2 REFERENCIAS</span> de caprichos
        </h2>

        <div className="mt-8 grid grid-cols-2 gap-6 justify-items-center">
          {items.map((item, idx) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.3, delay: idx * 0.06 }}
              className="group relative aspect-square w-44 md:w-52 rounded-full overflow-hidden"
            >
              {/* Imagen */}
              <img
                src={item.imageSrc}
                alt={item.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />

              {/* Nombre visible */}
              <div className="absolute inset-x-0 bottom-3 text-center">
                <span className="text-[11px] md:text-xs font-extrabold uppercase tracking-[0.22em] text-white drop-shadow">
                  {item.name}
                </span>
              </div>

              {/* Overlay hover */}
              <div
                className="
                  absolute inset-0
                  rounded-full
                  flex items-center justify-center
                  bg-black/80
                  opacity-0 group-hover:opacity-100
                  transition-opacity duration-300
                  px-4 text-center
                "
              >
                <div>
                  <h3 className="text-sm md:text-base font-black text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-xs md:text-sm text-white/80 whitespace-pre-line leading-snug">
                    {item.subtitle}
                  </p>
                  <div className="mx-auto mt-4 h-[2px] w-10 bg-white/20" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
