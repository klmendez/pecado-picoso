import Catalogo from "./Catalogo";

export default function CatalogoPage() {
  return (
    <div className="bg-crema text-neutral-900 min-h-screen">
      <Catalogo embedded={false} showHeader={true} />
    </div>
  );
}
