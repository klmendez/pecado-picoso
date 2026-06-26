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
  imageSrc: string;
};

export default function Referencias({
  value,
  onChange,
  title = "Referencia",
  subtitle = "Elige una",
}: Props) {
  const items: RefItem[] = [
    { key: "ahogada", name: "Ahogada", imageSrc: imgAhogado },
    { key: "picosa", name: "Picosa", imageSrc: imgPicosin },
  ];

  return (
    <section className="w-full">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{title}</div>
          <div className="text-[11px] text-gray-500">{subtitle}</div>
        </div>
        {value ? (
          <span className="text-[10px] text-emerald-600">✓</span>
        ) : null}
      </div>

      <div className="mt-2 flex gap-4 justify-center">
        {items.map((item) => {
          const active = value === item.key;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              className="flex flex-col items-center gap-1.5"
              aria-pressed={active}
            >
              <div className={[
                "relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden",
                active ? "ring-2 ring-rojo" : "ring-1 ring-gray-200",
              ].join(" ")}>
                <img src={item.imageSrc} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
                {active ? (
                  <div className="absolute inset-0 bg-rojo/20 flex items-center justify-center">
                    <span className="bg-rojo text-white text-[9px] font-medium w-4 h-4 flex items-center justify-center rounded-full">✓</span>
                  </div>
                ) : null}
              </div>
              <span className={["text-[10px] text-center", active ? "text-rojo font-medium" : "text-gray-500"].join(" ")}>
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
