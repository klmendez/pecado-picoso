export type CategoryTabValue = "todos" | string;

type CategoryInfo = { id: string; name: string };

export default function CategoryTabs({
  value,
  onChange,
  categories,
}: {
  value: CategoryTabValue;
  onChange: (value: CategoryTabValue) => void;
  categories?: CategoryInfo[];
}) {
  const tabs: { id: CategoryTabValue; label: string }[] = [
    { id: "todos", label: "Todo" },
    ...(categories?.map((c) => ({ id: c.id, label: c.name })) ?? []),
  ];

  return (
    <div role="tablist" aria-label="Categorías de productos" className="inline-flex border border-gray-200 bg-white p-1 text-sm">
      {tabs.map((tab) => {
        const active = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={[
              "px-4 py-1.5 transition-all text-sm font-medium",
              active ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-900",
            ].join(" ")}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
