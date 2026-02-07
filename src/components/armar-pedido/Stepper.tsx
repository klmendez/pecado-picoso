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
    <nav aria-label="Progreso del pedido" className="py-2 w-full max-w-full overflow-hidden">
      {/* MOBILE: 1 fila, sin pill/card, sin scroll horizontal */}
      <ol className="flex items-center w-full max-w-full min-w-0">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const interactive = Boolean(onSelectStep) && step.status !== "todo";

          const baseColor =
            step.status === "done"
              ? "text-emerald-300"
              : step.status === "current"
              ? "text-white"
              : "text-white/45";

          // Indicador (sin “pill” en mobile)
          const indicatorColor =
            step.status === "done"
              ? "text-emerald-300"
              : step.status === "current"
              ? "text-white"
              : "text-white/45";

          const connectorColor =
            step.status === "done" ? "bg-emerald-300/40" : "bg-white/15";

          return (
            <li key={step.id} className="flex items-center flex-1 min-w-0">
              <button
                type="button"
                onClick={() => (interactive ? onSelectStep?.(step.id) : null)}
                disabled={!interactive}
                className={[
                  "group flex items-center gap-2 min-w-0",
                  "w-full text-left transition-colors",
                  // ✅ Mobile: sin fondo, sin rounded, sin borde (no pill/card)
                  "py-1 px-0",
                  // ✅ Desktop: mantiene look más “botón”
                  "sm:w-auto sm:px-3 sm:py-2 sm:rounded-full sm:border sm:border-white/10",
                  interactive
                    ? "sm:hover:bg-white/[0.05] sm:focus-visible:outline sm:focus-visible:outline-2 sm:focus-visible:outline-white/60"
                    : "cursor-default",
                ].join(" ")}
              >
                {/* Número / check */}
                <span
                  className={[
                    // ✅ Mobile: texto simple (sin circulito)
                    "shrink-0 font-black text-[11px] leading-none",
                    indicatorColor,
                    // ✅ Desktop: sí puede ir con “circulito”
                    "sm:flex sm:h-8 sm:w-8 sm:items-center sm:justify-center sm:rounded-full sm:border sm:text-xs sm:tracking-[0.22em] sm:uppercase",
                    step.status === "done"
                      ? "sm:border-emerald-300 sm:text-emerald-200"
                      : step.status === "current"
                      ? "sm:border-white/70 sm:text-white"
                      : "sm:border-white/20 sm:text-white/45",
                  ].join(" ")}
                >
                  {step.status === "done" ? "✓" : index + 1}
                </span>

                {/* ✅ Mobile: mostrar título en la misma fila (compacto, sin segunda fila) */}
                <span className="min-w-0">
                  <span
                    className={[
                      "block truncate text-[11px] leading-tight font-black",
                      baseColor,
                      step.status === "current" ? "underline underline-offset-4 decoration-white/40" : "",
                      // Desktop un poquito más grande
                      "sm:text-sm sm:no-underline",
                    ].join(" ")}
                    title={step.title}
                  >
                    {step.title}
                  </span>

                  {/* Description solo desktop */}
                  {step.description ? (
                    <span className="mt-0.5 hidden sm:block text-[11px] text-white/45">
                      {step.description}
                    </span>
                  ) : null}
                </span>
              </button>

              {/* Conector entre pasos (se estira, no causa scroll) */}
              {!isLast ? (
                <span
                  className={[
                    "mx-2 h-px flex-1 min-w-0",
                    connectorColor,
                    // En desktop puedes usar uno fijo si quieres
                    "sm:mx-3 sm:w-10 sm:flex-none",
                  ].join(" ")}
                  aria-hidden
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
