import { INSTAGRAM } from "../data/constants";

function instagramUrl(value: string) {
  if (value.startsWith("http")) return value;
  const user = value.replace("@", "").trim();
  return `https://www.instagram.com/${user}`;
}

export default function Terminos() {
  return (
    <div className="bg-neutral-950 text-white pt-24 lg:pt-28">
      <div className="mx-auto max-w-3xl px-4 pb-16">
        <header className="mb-10">
          <div className="text-xs uppercase tracking-[0.35em] text-white/50">
            Legal
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl md:text-4xl font-black tracking-tight">
            Términos y condiciones
          </h1>
          <div className="mt-4 h-px w-16 bg-white/20" />
        </header>

        <section className="space-y-6 text-sm sm:text-base text-white/80 leading-relaxed">
          <p>
            Nuestras gomitas están elaboradas para que disfrutes una experiencia
            personalizada. Puedes armar tu pedido según tus gustos, combinando
            referencias, toppings y extras disponibles.
          </p>

          <p>
            Los domicilios se realizan a través de{" "}
            <span className="font-semibold text-white">Domipop</span>. El costo
            del envío será asumido por el cliente, o bien puedes optar por recoger
            tu pedido.
          </p>

          <p className="font-semibold text-white">
            Todo pedido debe estar cancelado en su totalidad para poder ser
            preparado y despachado.
          </p>

          <p>
            Síguenos en Instagram:{" "}
            <a
              href={instagramUrl(INSTAGRAM)}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-white hover:underline underline-offset-4"
            >
              {INSTAGRAM}
            </a>
            . Si te gustó tu pedido, compártelo y etiquétanos en tus historias.
          </p>
        </section>

        {/* acento final */}
        <div className="mt-12 h-px w-full bg-gradient-to-r from-transparent via-red-600/30 to-transparent" />
      </div>
    </div>
  );
}
