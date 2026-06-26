import { Link } from "react-router-dom";
import { useRef, useState } from "react";
import { ArrowRight, Truck, ShieldCheck, Heart, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useStoreProducts } from "../hooks/useStoreProducts";
import type { Product } from "../data/products";
import { waLink } from "../data/constants";
import bg1 from "../assets/home/1.jpeg";

const cop = (n: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0 }).format(n);

function getPrecioDesde(product: Product) {
  const prices: any = product.prices;
  if ("ahogada" in prices) {
    const vals = Object.values(prices as Record<string, Record<string, number>>).flatMap((v) => Object.values(v)).filter((v) => v > 0);
    return vals.length ? Math.min(...vals) : 0;
  }
  if ("fijo" in prices && typeof prices.fijo === "number") {
    return prices.fijo;
  }
  if ("porSize" in prices && prices.porSize) {
    const vals = Object.values(prices.porSize).filter((v): v is number => typeof v === "number");
    return vals.length ? Math.min(...vals) : 0;
  }
  return 0;
}

export default function Home() {
  const { products: storeProducts, categories: storeCategories, loading: storeLoading } = useStoreProducts();
  const productosDestacados = storeProducts.length > 0 ? storeProducts.slice(0, 4) : [];
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const CARD_W = 300;
  const categorias = storeCategories.length > 0
    ? storeCategories.map((c) => ({ id: c.id, nombre: c.name, desc: c.description || "", photo: c.image || bg1 }))
    : [];

  function goTo(idx: number) {
    const el = carouselRef.current;
    if (!el) return;
    const total = categorias.length;
    if (total === 0) return;
    const clamped = ((idx % total) + total) % total;
    setActiveIndex(clamped);
    const offset = clamped * CARD_W - (el.clientWidth - CARD_W) / 2;
    el.scrollTo({ left: Math.max(0, offset), behavior: "smooth" });
  }

  function scroll(dir: number) {
    goTo(activeIndex + dir);
  }

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="relative overflow-hidden min-h-[280px] sm:min-h-[380px] lg:min-h-[420px] flex items-center">
        <img src={bg1} alt="Pecado Picoso" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-red-900/85 via-red-800/60 to-transparent" />
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14">
          <div className="max-w-xl">
            <span className="inline-block bg-rojo text-white font-medium text-[10px] sm:text-xs px-2.5 py-0.5 mb-3 uppercase tracking-widest">
              Dulce, ácido y picoso
            </span>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-semibold text-white leading-tight mb-3">
              El antojo más <span className="text-rojo-light">atrevido</span> de Popayán
            </h1>
            <p className="text-gray-200 text-sm sm:text-base mb-5 sm:mb-8 max-w-md leading-relaxed">
              Gomitas ahogadas en chamoy artesanal y tajín.
            </p>
            <div className="flex flex-row gap-2 sm:gap-3">
              <Link to="/armar" className="bg-rojo hover:bg-rojo-dark text-white font-medium px-4 py-2 sm:px-6 sm:py-3 text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors">
                Armar pedido <ArrowRight size={15} />
              </Link>
              <a href={waLink("Hola, quiero información sobre sus productos")} target="_blank" rel="noreferrer"
                className="bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white font-medium px-4 py-2 sm:px-6 sm:py-3 text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors border border-white/30">
                <MessageCircle size={14} />
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Carousel de categorías */}
      <section className="py-6 sm:py-10 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <div className="flex flex-col items-center mb-2">
            <h2 className="text-lg sm:text-2xl font-semibold text-black tracking-tight">Nuestras categorías</h2>
            <div className="mt-2 h-[3px] w-24 bg-rojo" />
          </div>
          {categorias.length > 1 && (
            <div className="flex justify-end gap-2 -mt-8">
              <button onClick={() => scroll(-1)} className="w-9 h-9 border border-gray-300 flex items-center justify-center hover:border-black transition-colors" aria-label="Anterior">
                <ChevronLeft size={18} strokeWidth={2} />
              </button>
              <button onClick={() => scroll(1)} className="w-9 h-9 border border-gray-300 flex items-center justify-center hover:border-black transition-colors" aria-label="Siguiente">
                <ChevronRight size={18} strokeWidth={2} />
              </button>
            </div>
          )}
        </div>

        {storeLoading ? (
          <div className="flex items-center justify-center h-[280px] text-gray-400 text-sm">Cargando categorías...</div>
        ) : categorias.length === 0 ? (
          <div className="flex items-center justify-center h-[280px] text-gray-400 text-sm">No hay categorías disponibles.</div>
        ) : (
          <>
            <div ref={carouselRef} className="flex overflow-x-auto scrollbar-hide" style={{ scrollBehavior: "smooth" }}>
              {categorias.map((cat, i) => {
                const isActive = i === activeIndex;
                return (
                  <Link
                    key={cat.id}
                    to={`/armar?categoria=${cat.id}`}
                    onClick={(e) => {
                      if (!isActive) {
                        e.preventDefault();
                        goTo(i);
                      }
                    }}
                    className="flex-shrink-0 relative overflow-hidden cursor-pointer block"
                    style={{ width: `${CARD_W}px`, height: "280px" }}
                  >
                    <img src={cat.photo} alt={cat.nombre} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700" style={{ transform: isActive ? "scale(1)" : "scale(1.04)" }} />
                    <div className="absolute inset-0 transition-all duration-500" style={{ background: isActive ? "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)" : "rgba(0,0,0,0.55)" }} />
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 p-5">
                        <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">Categoría</p>
                        <div className="flex items-end justify-between gap-2">
                          <span className="text-white font-bold text-lg leading-tight">{cat.nombre}</span>
                          <span className="w-8 h-8 bg-rojo flex items-center justify-center flex-shrink-0">
                            <ArrowRight size={14} strokeWidth={2.5} className="text-white" />
                          </span>
                        </div>
                      </div>
                    )}
                    {!isActive && (
                      <div className="absolute bottom-5 left-5 right-5">
                        <span className="text-white/50 font-bold text-sm">{cat.nombre}</span>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>

            {categorias.length > 1 && (
              <div className="flex justify-center gap-2 mt-5">
                {categorias.map((_, i) => (
                  <button key={i} onClick={() => goTo(i)} className={`h-1.5 transition-all duration-300 ${i === activeIndex ? "w-6 bg-black" : "w-1.5 bg-gray-300"}`} />
                ))}
              </div>
            )}
          </>
        )}
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
                  {getPrecioDesde(p) > 0 && <p className="font-semibold text-gray-900 text-sm mt-2">Desde {cop(getPrecioDesde(p))}</p>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA WhatsApp */}
      <section className="py-6 sm:py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-lg sm:text-2xl font-semibold text-gray-900">
            ¿Algo especial?
          </h2>
          <p className="text-gray-400 text-sm mt-1 mb-4 sm:mb-6">Escríbenos por WhatsApp</p>
          <a href={waLink("Hola, quiero más información sobre sus productos")} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium px-5 py-2.5 sm:px-8 sm:py-3 text-sm transition-colors">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Comprar ahora por WhatsApp
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="py-5 sm:py-8 bg-rojo-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
