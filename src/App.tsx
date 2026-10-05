import akoraLogo from "./assets/akora.png";
import pecadoLogo from "./assets/logo.webp";

const suspensionDate = "21/09/2026";
const unpaidSince = "febrero de 2026";
const demoMessage = "Hola, quiero solicitar una demo del menú web.";
const demoWhatsAppUrl = `https://api.whatsapp.com/send?phone=573148320587&text=${encodeURIComponent(demoMessage)}`;

export default function App() {
  return (
    <main className="min-h-dvh bg-crema px-5 py-8 text-neutral-950">
      <section className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-3xl flex-col items-center justify-center text-center">
        <img
          src={pecadoLogo}
          alt="Pecado Picoso"
          className="mb-8 h-24 w-auto object-contain sm:h-28"
        />

        <div className="w-full rounded-lg border border-red-200 bg-white px-6 py-8 shadow-sm sm:px-10 sm:py-10">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-rojo">
            Servicio suspendido
          </p>
          <h1 className="text-3xl font-bold leading-tight text-neutral-950 sm:text-5xl">
            Página temporalmente bloqueada
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-neutral-700 sm:text-lg">
            Esta página fue suspendida el {suspensionDate} por falta de pago
            desde {unpaidSince}.
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-neutral-700 sm:text-lg">
            Si quieres solicitar una demo o reactivar el servicio, puedes contactar a Akora.
          </p>

          <a
            href={demoWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center justify-center rounded-md bg-rojo px-7 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white shadow-sm transition hover:bg-rojo-dark focus:outline-none focus:ring-2 focus:ring-rojo focus:ring-offset-2"
          >
            Solicitar una demo
          </a>

          <div className="mt-8 flex flex-col items-center gap-3 border-t border-neutral-200 pt-6">
            <span className="text-sm font-semibold uppercase tracking-[0.14em] text-neutral-500">
              Desarrollado por
            </span>
            <img src={akoraLogo} alt="Akora" className="h-14 w-auto object-contain" />
          </div>
        </div>
      </section>
    </main>
  );
}
