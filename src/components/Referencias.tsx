import { motion } from "framer-motion";
import imgAhogado from "../assets/referencias/ahogado.jpg";
import imgPicosin from "../assets/referencias/picosin.jpg";

export type RefKey = "ahogada" | "picosa";

type Props = {
  value: RefKey | null;
  onChange: (v: RefKey) => void;
  small?: boolean;
  title?: string;
  subtitle?: string;
};

type RefItem = {
  key: RefKey;
  name: string;
  title: string;
  subtitle: string;
  imageSrc: string;
};

export default function Referencias({
  value,
  onChange,
  small = true,
  title = "Elige tu referencia",
  subtitle = "Toca una para continuar",
}: Props) {
  const items: RefItem[] = [
    {
      key: "ahogada",
      name: "ahogado",
      title: "CAPRICHO AHOGADO",
      subtitle: "Pura tentación\nen cada gota",
      imageSrc: imgAhogado,
    },
    {
      key: "picosa",
      name: "picosin",
      title: "CAPRICHO PICOSIN",
      subtitle: "Intensidad que\nenamora",
      imageSrc: imgPicosin,
    },
  ];

  const sizeClass = small ? "w-28 sm:w-32" : "w-44 md:w-52";
  const gapClass = small ? "gap-4" : "gap-6";

  return (
    <section className="w-full">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-sm font-black text-white">{title}</div>
          <div className="text-xs text-white/60">{subtitle}</div>
        </div>
        {value ? (
          <span className="text-[10px] uppercase tracking-[0.25em] rounded-full bg-white text-neutral-950 px-2 py-1">
            listo
          </span>
        ) : null}
      </div>

      <div className={`mt-3 grid grid-cols-2 ${gapClass} justify-items-start`}>
        {items.map((item, idx) => {
          const active = value === item.key;

          return (
            <motion.button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.06 }}
              className={[
                "group relative aspect-square rounded-full overflow-hidden text-left",
                sizeClass,
                active ? "ring-2 ring-white/90" : "ring-1 ring-white/15 hover:ring-white/40",
              ].join(" ")}
              aria-pressed={active}
              title={item.title}
            >
              <img
                src={item.imageSrc}
                alt={item.title}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />

              {/* bottom label */}
              <div className="absolute inset-x-0 bottom-2 text-center">
                <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.22em] text-white drop-shadow">
                  {item.name}
                </span>
              </div>

              {/* subtle overlay (always) */}
              <div className="absolute inset-0 bg-black/10" />

              {/* active badge */}
              {active ? (
                <div className="absolute top-2 right-2 rounded-full bg-white text-neutral-950 text-[10px] font-black px-2 py-0.5">
                  ✓
                </div>
              ) : null}

              {/* hover info */}
              <div
                className="
                  absolute inset-0
                  flex items-center justify-center
                  bg-black/80
                  opacity-0 group-hover:opacity-100
                  transition-opacity duration-250
                  px-3 text-center
                "
              >
                <div>
                  <div className="text-[11px] sm:text-xs font-black text-white">{item.title}</div>
                  <div className="mt-1 text-[10px] sm:text-[11px] text-white/80 whitespace-pre-line leading-snug">
                    {item.subtitle}
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
