import { Link } from "react-router-dom";
import logo from "../assets/logo.webp";
import homeBackground from "../assets/referencias/ahogado.jpg";

export default function Home() {
  return (
    <main
      className="relative flex-1 flex flex-col items-center justify-center text-center px-6 py-16 min-h-[75dvh] overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${homeBackground})` }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-black/60 to-rojo-dark/80" />

      {/* Glossy sauce highlight */}
      <div className="pointer-events-none absolute -top-1/3 left-1/2 -translate-x-1/2 w-[140%] aspect-square rounded-full bg-white/10 blur-3xl" />

      <img
        src={logo}
        alt="Pecado Picoso"
        className="relative z-10 w-44 sm:w-60 lg:w-72 h-auto mb-6 sm:mb-8 drop-shadow-[0_10px_25px_rgba(0,0,0,0.45)]"
      />

      <div className="relative z-10 mb-8 sm:mb-10 text-white font-['Montserrat'] drop-shadow-[0_3px_12px_rgba(0,0,0,0.65)]">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight">
          Prueba nuestro chamoy artesanal
        </h1>
        <p className="mt-3 text-base sm:text-xl font-semibold text-white/90">
          Una receta única, intensa y deliciosamente picosa.
        </p>
      </div>

      <Link
        to="/armar"
        className="home-buy-button group relative z-10 w-full max-w-xs sm:max-w-sm inline-flex items-center justify-center overflow-hidden rounded-full font-bold text-lg sm:text-xl py-4 sm:py-5 px-10 shadow-[0_10px_35px_rgba(0,0,0,0.5)] ring-1 ring-rojo/20 transition-all active:scale-[0.97] hover:-translate-y-0.5"
      >
        {/* Shine */}
        <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/50 to-transparent" />
        <span className="pointer-events-none absolute -inset-y-6 -left-1/3 w-1/4 rotate-12 bg-white/25 blur-md transition-transform duration-700 group-hover:translate-x-[420%]" />
        <span className="relative z-10">Comprar</span>
      </Link>
    </main>
  );
}
