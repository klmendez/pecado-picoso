// src/components/Toppings.tsx
import { motion } from "framer-motion";
import { TOPPINGS } from "../data/toppings";

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  max: number;        // ej: gomitas -> toppingsIncludedMax, frutafresh -> 2
  min?: number;       // ej: gomitas -> 1, frutafresh -> 0
  small?: boolean;
  title?: string;
  subtitle?: string;
};

export default function Toppings({
  value,
  onChange,
  max,
  min = 0,
  small = true,
  title = "Elige tus toppings",
  subtitle = "Toca para agregar o quitar",
}: Props) {
  const sizeClass = small ? "w-24 sm:w-28" : "w-36 md:w-44";
  const gapClass = small ? "gap-4" : "gap-6";

  const count = value.length;

  const toggle = (id: string) => {
    const active = value.includes(id);

    if (active) {
      onChange(value.filter((x) => x !== id));
      return;
    }

    // si max es 0, no permitir agregar
    if (max <= 0) return;

    // si ya llegó al max, no permitir
    if (value.length >= max) return;

    onChange([...value, id]);
  };

  const ok = count >= min && (max <= 0 ? count === 0 : count <= max);

  return (
    <section className="w-full">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-sm font-black text-white">{title}</div>
          <div className="text-xs text-white/60">
            {subtitle}{" "}
            <span className="text-white/50">
              ({count}/{max})
            </span>
          </div>
        </div>

        {ok ? (
          <span className="text-[10px] uppercase tracking-[0.25em] rounded-full bg-white text-neutral-950 px-2 py-1">
            listo
          </span>
        ) : null}
      </div>

      <div className={`mt-3 grid grid-cols-3 sm:grid-cols-4 ${gapClass} justify-items-start`}>
        {TOPPINGS.map((t, idx) => {
          const active = value.includes(t.id);

          return (
            <motion.button
              key={t.id}
              type="button"
              onClick={() => toggle(t.id)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.03 }}
              className={[
                "group relative aspect-square rounded-full overflow-hidden text-left",
                sizeClass,
                active ? "ring-2 ring-white/90" : "ring-1 ring-white/15 hover:ring-white/40",
              ].join(" ")}
              aria-pressed={active}
              title={t.title ?? t.name}
            >
              <img
                src={t.imageSrc}
                alt={t.title ?? t.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />

              {/* bottom label */}
              <div className="absolute inset-x-0 bottom-2 text-center">
                <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-[0.22em] text-white drop-shadow">
                  {t.name}
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
                  <div className="text-[11px] sm:text-xs font-black text-white">{t.title ?? t.name}</div>
                  {t.subtitle ? (
                    <div className="mt-1 text-[10px] sm:text-[11px] text-white/80 whitespace-pre-line leading-snug">
                      {t.subtitle}
                    </div>
                  ) : null}
                  <div className="mt-2 text-[10px] text-white/50">
                    {active ? "Toca para quitar" : "Toca para agregar"}
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Mensajito de regla */}
      <div className="mt-2 text-[10px] text-white/40">
        {min > 0 ? `Mínimo ${min}. ` : null}
        {max > 0 ? `Máximo ${max}.` : "Sin toppings para este producto."}
      </div>
    </section>
  );
}
