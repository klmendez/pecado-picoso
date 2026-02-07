import Catalogo from "./Catalogo";

export default function CatalogoPage() {
  return (
    <div className="bg-neutral-950 text-white min-h-screen">
      <Catalogo embedded={false} showHeader={true} />
    </div>
  );
}
