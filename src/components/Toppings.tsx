import { TOPPINGS } from "../data/toppings";

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  max: number;
  min?: number;
  small?: boolean;
  title?: string;
  subtitle?: string;
  disabledIds?: string[];
};

export default function Toppings({
  value,
  onChange,
  max,
  min = 0,
  title = "Elige tus toppings",
  subtitle = "Toca para agregar o quitar",
  disabledIds = [],
}: Props) {
  const count = value.length;

  const toggle = (id: string) => {
    if (disabledIds.includes(id)) return;
    const active = value.includes(id);
    if (active) {
      onChange(value.filter((x) => x !== id));
      return;
    }
    if (max <= 0) return;
    if (value.length >= max) return;
    onChange([...value, id]);
  };

  const ok = count >= min && (max <= 0 ? count === 0 : count <= max);

  return (
    <section className="w-full">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{title}</div>
          <div className="text-[11px] text-gray-500">
            {subtitle}{" "}
            <span className="text-gray-400">({count}/{max})</span>
          </div>
        </div>
        {ok && count > 0 ? (
          <span className="text-[10px] text-rojo">✓</span>
        ) : null}
      </div>

      <div className="mt-2 grid grid-cols-4 sm:grid-cols-5 gap-3 justify-items-center">
        {TOPPINGS.map((t) => {
          const active = value.includes(t.id);
          const disabled = disabledIds.includes(t.id);

          return (
            <button
              key={t.id}
              type="button"
              onClick={() => toggle(t.id)}
              disabled={disabled}
              className={["flex flex-col items-center gap-1", disabled ? "cursor-not-allowed" : ""].join(" ")}
              aria-pressed={active}
              aria-disabled={disabled}
              title={disabled ? "No disponible" : t.title ?? t.name}
            >
              <div className={[
                "relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden",
                disabled ? "opacity-40 grayscale ring-1 ring-gray-200" : active ? "ring-2 ring-rojo" : "ring-1 ring-gray-200",
              ].join(" ")}>
                <img
                  src={t.imageSrc}
                  alt={t.title ?? t.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                {disabled ? (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="text-white text-[7px] font-bold uppercase text-center leading-tight px-0.5">No disp.</span>
                  </div>
                ) : active ? (
                  <div className="absolute inset-0 bg-rojo/20 flex items-center justify-center">
                    <span className="bg-rojo text-white text-[9px] font-medium w-4 h-4 flex items-center justify-center rounded-full">✓</span>
                  </div>
                ) : null}
              </div>
              <span className={[
                "text-[9px] text-center leading-tight",
                disabled ? "text-gray-300" : active ? "text-rojo font-medium" : "text-gray-500",
              ].join(" ")}>
                {t.name}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-1.5 text-[10px] text-gray-400">
        {min > 0 ? `Mínimo ${min}. ` : null}
        {max > 0 ? `Máximo ${max}.` : "Sin toppings para este producto."}
      </div>
    </section>
  );
}
