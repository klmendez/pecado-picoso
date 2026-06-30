import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, MessageCircle, Star, Flame } from "lucide-react";
import { waLink } from "../../data/constants";
import bg1 from "../../assets/home/1.jpeg";
import FloatingPecado from "./FloatingPecado";

export default function Hero() {
  const [loaded, setLoaded] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden min-h-[85dvh] sm:min-h-[90dvh] lg:min-h-[92dvh] flex items-center"
    >
      {/* Background layers */}
      <img
        src={bg1}
        alt="Pecado Picoso"
        className="absolute inset-0 w-full h-full object-cover scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-red-950/90 via-red-900/75 to-red-950/60" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,transparent_40%,rgba(0,0,0,0.45)_100%)]" />

      {/* Animated floating shapes */}
      <div className="absolute top-1/4 left-[8%] w-3 h-3 rounded-full bg-orange-400/70 animate-float hidden sm:block" />
      <div className="absolute top-[40%] left-[15%] w-2 h-2 rounded-full bg-white/50 animate-float-delay hidden sm:block" />
      <div className="absolute bottom-[30%] right-[20%] w-4 h-4 rounded-full bg-orange-300/60 animate-float hidden lg:block" />
      <div className="absolute bottom-[20%] left-[40%] w-2 h-2 rounded-full bg-white/40 animate-float-delay hidden lg:block" />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Text content */}
          <div className="max-w-2xl">
            {/* Badge */}
            <div
              className={`inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 mb-6 transition-all duration-700 ${
                loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <Flame size={14} className="text-amber-300" />
              <span className="text-white/90 text-xs sm:text-sm font-medium">
                Dulce, ácido y picoso — Popayán
              </span>
            </div>

            {/* Headline */}
            <h1
              className={`text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.1] mb-5 transition-all duration-700 delay-100 ${
                loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              El antojo más{" "}
              <span className="text-white italic">
                atrevido
              </span>{" "}
              de la ciudad
            </h1>

            {/* Subheadline */}
            <p
              className={`hidden sm:block text-gray-200/90 text-base sm:text-lg lg:text-xl max-w-lg leading-relaxed mb-8 transition-all duration-700 delay-200 ${
                loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              Gomitas premium ahogadas en chamoy artesanal y tajín. Hechas con
              receta propia, entregadas frescas a tu puerta.
            </p>
            <p
              className={`sm:hidden text-gray-200/90 text-sm max-w-md leading-relaxed mb-6 transition-all duration-700 delay-200 ${
                loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              Gomitas ahogadas en chamoy artesanal y tajín.
            </p>

            {/* Social proof mini */}
            <div
              className={`flex items-center gap-3 mb-8 transition-all duration-700 delay-300 ${
                loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className="text-yellow-400 fill-yellow-400"
                    />
                  ))}
                </div>
                <span className="text-white/80 text-xs sm:text-sm font-medium">
                  Pedidos entregados con amor
                </span>
              </div>
            </div>

            {/* CTAs */}
            <div
              className={`flex flex-wrap gap-3 sm:gap-4 transition-all duration-700 delay-400 ${
                loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
            >
              <Link
                to="/armar"
                className="group bg-white hover:bg-gray-100 text-rojo font-semibold px-6 py-3 sm:px-8 sm:py-3.5 text-sm sm:text-base flex items-center gap-2 transition-all shadow-lg shadow-black/20 hover:shadow-black/30 hover:-translate-y-0.5"
              >
                Armar mi pedido
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
              <a
                href={waLink("Hola, quiero información sobre sus productos")}
                target="_blank"
                rel="noreferrer"
                className="group bg-white hover:bg-gray-100 text-rojo font-semibold px-6 py-3 sm:px-8 sm:py-3.5 text-sm sm:text-base flex items-center gap-2 transition-all shadow-lg shadow-black/20 hover:shadow-black/30 hover:-translate-y-0.5"
              >
                <MessageCircle size={16} />
                WhatsApp
              </a>
            </div>

          </div>

          {/* Right visual — floating product image */}
          <div
            className={`flex items-center justify-center relative transition-all duration-1000 delay-300 ${
              loaded ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"
            }`}
          >
            <FloatingPecado
              className="w-[200px] h-[200px] sm:w-[260px] sm:h-[260px] lg:w-[320px] lg:h-[320px] xl:w-[380px] xl:h-[380px]"
            />
          </div>
        </div>
      </div>

      {/* Bottom curve */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto block"
          preserveAspectRatio="none"
        >
          <path
            d="M0 80V40C240 0 480 0 720 20C960 40 1200 80 1440 60V80H0Z"
            fill="#FAFAF7"
          />
        </svg>
      </div>
    </section>
  );
}
