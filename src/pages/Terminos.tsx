import { INSTAGRAM } from "../data/constants";

export default function Terminos() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
          Términos y condiciones
        </h1>
        <div className="mt-2 h-[2px] w-16 bg-white/20" />
      </header>

      <section className="space-y-5 text-sm md:text-base text-white/80 leading-relaxed">
        <p>
          Nuestras gomitas están elaboradas para que disfrutes una experiencia personalizada.
          Puedes armar tu pedido según tus gustos, combinando referencias, toppings y extras disponibles.
        </p>

        <p>
          Los domicilios se realizan a través de <span className="font-semibold text-white">Domipop</span>.
          El costo del envío será asumido por el cliente, o bien puedes optar por recoger tu pedido.
        </p>

        <p className="font-semibold text-white">
          Todo pedido debe estar cancelado en su totalidad para poder ser preparado y despachado.
        </p>

        <p>
          Síguenos en Instagram:{" "}
          <span className="font-semibold text-white">{INSTAGRAM}</span>.  
          Si te gustó tu pedido, compártelo y etiquétanos en tus historias.
        </p>
      </section>
    </div>
  );
}
