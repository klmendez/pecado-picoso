export type Step = {
  id: string;
  title: string;
  description?: string;
  status: "done" | "current" | "todo";
};

type Props = {
  steps: Step[];
  onSelectStep?: (id: string) => void;
};

export default function Stepper({ steps, onSelectStep }: Props) {
  if (!steps.length) return null;

  return (
    <nav aria-label="Progreso del pedido" className="py-2">
      {/* MOBILE: grid 2 columnas, SIN scroll */}
      <ol className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-4">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const interactive = Boolean(onSelectStep) && step.status !== "todo";

          const baseColor =
            step.status === "done"
              ? "text-emerald-300"
              : step.status === "current"
              ? "text-white"
              : "text-white/45";

          const indicatorClass =
            step.status === "done"
              ? "border-emerald-300 text-emerald-200"
              : step.status === "current"
              ? "border-white/70 text-white"
              : "border-white/20 text-white/45";

          return (
            <li
              key={step.id}
              className={[
                // mobile: sin separadores, cada item es un bloque
                "sm:flex sm:items-center sm:gap-4",
              ].join(" ")}
            >
              <button
                type="button"
                onClick={() => (interactive ? onSelectStep?.(step.id) : null)}
                disabled={!interactive}
                className={[
                  "group w-full rounded-2xl border border-white/10 px-3 py-3 text-left transition-colors",
                  "flex items-center gap-3",
                  // desktop look:
                  "sm:w-auto sm:rounded-full sm:border-transparent sm:px-3 sm:py-2",
                  interactive
                    ? "hover:bg-white/[0.05] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/60"
                    : "cursor-default",
                  step.status === "current" ? "bg-white/[0.04] sm:bg-transparent" : "",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-8 w-8 items-center justify-center rounded-full border text-xs font-black uppercase tracking-[0.22em] transition-colors shrink-0",
                    indicatorClass,
                    interactive ? "group-hover:border-emerald-300/80" : "",
                  ].join(" ")}
                >
                  {step.status === "done" ? "✓" : index + 1}
                </span>

                <span className="min-w-0">
                  <span className={["block text-sm font-black leading-tight", baseColor].join(" ")}>
                    {step.title}
                  </span>

                  {/* En mobile oculta description para que no se vuelva alto */}
                  {step.description ? (
                    <span className="mt-0.5 hidden sm:block text-[11px] text-white/45">{step.description}</span>
                  ) : null}
                </span>
              </button>

              {/* Separador solo en desktop (sm+) */}
              {!isLast ? <span className="hidden sm:block h-px w-8 shrink-0 bg-white/15" aria-hidden /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
