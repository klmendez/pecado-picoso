type TabValue = "todos" | "gomitas" | "frutafresh";

const LABELS: Record<TabValue, string> = {
  todos: "Todo",
  gomitas: "Gomitas",
  frutafresh: "FrutaFresh",
};

export default function CategoryTabs({ value, onChange }: { value: TabValue; onChange: (value: TabValue) => void }) {
  return (
    <div className="inline-flex rounded-2xl border border-neutral-800 bg-neutral-900 p-1 text-sm font-bold">
      {(Object.keys(LABELS) as TabValue[]).map((tab) => {
        const active = value === tab;
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onChange(tab)}
            className={[
              "px-4 py-2 rounded-2xl transition",
              active ? "bg-white text-neutral-950 shadow-sm" : "text-neutral-300 hover:text-white",
            ].join(" ")}
          >
            {LABELS[tab]}
          </button>
        );
      })}
    </div>
  );
}
