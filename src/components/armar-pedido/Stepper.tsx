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
    <nav aria-label="Progreso del pedido" className="w-full">
      <ol className="flex items-center w-full">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const interactive = Boolean(onSelectStep) && step.status !== "todo";

          const textColor =
            step.status === "done"
              ? "text-rojo"
              : step.status === "current"
              ? "text-gray-900"
              : "text-gray-300";

          const connectorColor =
            step.status === "done" ? "bg-rojo" : "bg-gray-200";

          return (
            <li key={step.id} className="flex items-center flex-1 min-w-0">
              <button
                type="button"
                onClick={() => (interactive ? onSelectStep?.(step.id) : null)}
                disabled={!interactive}
                className={[
                  "flex items-center gap-1.5 min-w-0",
                  interactive ? "cursor-pointer" : "cursor-default",
                ].join(" ")}
              >
                <span className={["shrink-0 text-xs font-medium", textColor].join(" ")}>
                  {step.status === "done" ? "✓" : `${index + 1}`}
                </span>

                <span
                  className={[
                    "truncate text-[11px] sm:text-sm font-medium leading-none",
                    textColor,
                  ].join(" ")}
                  title={step.title}
                >
                  {step.title}
                </span>
              </button>

              {!isLast ? (
                <span
                  className={["mx-2 sm:mx-3 h-px flex-1", connectorColor].join(" ")}
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
