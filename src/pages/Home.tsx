import { Link } from "react-router-dom";
import { ArrowRight, Truck, ShieldCheck, Heart, Flame } from "lucide-react";
import { useStoreProducts } from "../hooks/useStoreProducts";
import type { Product } from "../data/products";
import { waLink } from "../data/constants";
import Hero from "../components/home/Hero";
import FloatingPecado from "../components/home/FloatingPecado";

const cop = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);

function getPriceLabel(product: Product): string {
  const prices: any = product.prices;
  
  // Gomitas: ahogada/picosa con tamaños
  if ("ahogada" in prices && "picosa" in prices) {
    const ahogada = prices.ahogada as Record<string, number>;
    const picosa = prices.picosa as Record<string, number>;
    const ahogadaMin = Math.min(...Object.values(ahogada).filter((v): v is number => v > 0));
    const picosaMin = Math.min(...Object.values(picosa).filter((v): v is number => v > 0));
    const parts: string[] = [];
    if (ahogadaMin > 0) parts.push(`Ahogada ${cop(ahogadaMin)}`);
    if (picosaMin > 0) parts.push(`Picosa ${cop(picosaMin)}`);
    return parts.length ? parts.join(" • ") : "Precio por confirmar";
  }
  
  // Precio fijo
  if ("fijo" in prices && typeof prices.fijo === "number" && prices.fijo > 0) {
    return cop(prices.fijo);
  }
  
  // Por tamaño
  if ("porSize" in prices && prices.porSize && typeof prices.porSize === "object") {
    const porSize = prices.porSize as Record<string, number>;
    const parts: string[] = [];
    if (porSize.pequeno) parts.push(`Pequeño ${cop(porSize.pequeno)}`);
    if (porSize.mediano) parts.push(`Mediano ${cop(porSize.mediano)}`);
    if (porSize.grande) parts.push(`Grande ${cop(porSize.grande)}`);
    return parts.length ? parts.join(" • ") : "Precio por confirmar";
  }
  
  return "Precio por confirmar";
}

export default function Home() {
  const { products: storeProducts } = useStoreProducts();
  const productosDestacados = storeProducts.length > 0 ? storeProducts.slice(0, 4) : [];

  return (
    <main className="flex-1">
      <Hero />

      {/* Chamoy Artesanal */}
      <section className="py-16 sm:py-24 lg:py-32 bg-amber-50/50 overflow-hidden relative">
        {/* Decorative background blobs */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-orange-100/40 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-rojo/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="inline-flex items-center gap-1.5 bg-rojo/10 text-rojo font-semibold text-[11px] sm:text-xs px-3 py-1.5 rounded-full mb-5 uppercase tracking-wider">
            <Flame size={12} />
            El secreto está en el chamoy
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-8 leading-[1.15]">
            Hecho a mano, <span className="text-rojo">sin atajos</span>
          </h2>

          <blockquote className="border-l-4 border-rojo pl-5 py-1 text-left sm:text-center sm:border-l-0 sm:pl-0">
            <p className="text-gray-700 text-base sm:text-lg leading-relaxed italic">
              "El chamoy es el alma de cada gomita. Por eso no compramos frascos industriales:
              lo preparamos nosotros desde cero, probando y ajustando hasta que el dulce,
              el ácido y el picante bailen en la medida exacta."
            </p>
          </blockquote>
        </div>
      </section>

      {/* Productos destacados */}
      <section className="py-6 sm:py-10 bg-crema">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex flex-col">
              <h2 className="text-lg sm:text-2xl font-semibold text-black flex items-center gap-2">
                Productos destacados <Heart size={16} strokeWidth={1.5} className="text-rojo" />
              </h2>
              <div className="mt-1 h-[2px] w-16 bg-rojo" />
            </div>
            <Link to="/catalogo" className="text-xs sm:text-sm font-medium text-gray-500 flex items-center gap-1 hover:text-black transition-colors">
              Ver todos <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-8">
            {productosDestacados.map((p) => (
              <Link key={p.id} to="/armar" className="group flex gap-3 border-b border-gray-200 pb-4 last:border-b-0">
                <div className="relative w-24 sm:w-32 flex-shrink-0 overflow-hidden bg-gray-100" style={{ aspectRatio: "4/5" }}>
                  {p.image && <img src={p.image} alt={p.name} className="w-full h-full object-cover" loading="lazy" />}
                </div>
                <div className="flex flex-col justify-center min-w-0 flex-1">
                  <h3 className="font-medium text-gray-900 text-sm sm:text-base leading-tight">{p.name}</h3>
                  {p.description && <p className="text-gray-400 text-xs mt-1 line-clamp-2">{p.description}</p>}
                  <p className="font-semibold text-gray-900 text-sm mt-2">{getPriceLabel(p)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA WhatsApp */}
      <section className="py-10 sm:py-16 bg-crema overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="order-2 lg:order-1 flex justify-center">
              <FloatingPecado
                showBadges={false}
                glowColor="bg-green-500/10"
                className="w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] lg:w-[260px] lg:h-[260px]"
              />
            </div>
            <div className="order-1 lg:order-2 text-center lg:text-left">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                ¿Tienes un antojo?
              </h2>
              <p className="text-gray-500 text-sm sm:text-base mb-6 max-w-md mx-auto lg:mx-0">
                Escríbenos por WhatsApp y arma tu pedido personalizado. Respondemos rápido.
              </p>
              <a href={waLink("Hola, quiero más información sobre sus productos")} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 sm:px-8 sm:py-3.5 text-sm transition-colors shadow-lg shadow-green-500/20">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Comprar ahora por WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-5 sm:py-8 bg-rojo-light relative overflow-hidden">
        <div className="absolute -right-10 top-1/2 -translate-y-1/2 opacity-10 pointer-events-none hidden lg:block">
          <FloatingPecado
            showBadges={false}
            glowColor="bg-transparent"
            className="w-[180px] h-[180px]"
          />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
            {[
              { icon: <Truck size={20} className="text-rojo-dark" />, title: "Envíos rápidos", desc: "A la puerta de tu casa" },
              { icon: <ShieldCheck size={20} className="text-rojo-dark" />, title: "Chamoy artesanal", desc: "Recetas propias" },
              { icon: <Heart size={20} className="text-rojo" />, title: "Hecho con amor", desc: "Fresco y con dedicación" },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3 py-2.5 sm:py-4 border-b border-rojo/10 last:border-b-0 sm:border-b-0 sm:border-r sm:border-rojo/10 sm:last:border-r-0 sm:pr-6">
                <div className="flex-shrink-0">{icon}</div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{title}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
