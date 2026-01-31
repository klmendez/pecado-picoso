import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { Barrio } from "../data/barrios";
import { BARRIOS } from "../data/barrios";
import {
  PRODUCTS,
  isFixedPrice,
  type Product,
  type Size,
  type Version,
} from "../data/products";
import { TOPPINGS } from "../data/toppings";
import { EXTRAS } from "../data/extras";
import { getBasePrice, extrasTotal, deliveryCost } from "../lib/pricing";
import {
  buildCode,
  buildWhatsAppMessage,
  waLink,
  type PaymentMethod,
} from "../lib/whatsapp";
import { cop } from "../lib/format";
import { NEQUI_PHONE } from "../data/constants";
import Catalogo from "./Catalogo";
import OrderAside from "../components/OrderAside";
import OrderForm from "../components/OrderForm";
import ahogadoRefImg from "../assets/referencias/ahogado.jpg";
import picosinRefImg from "../assets/referencias/picosin.jpg";

const WHATSAPP_DESTINATION = "573135707125";

const VERSION_REFERENCES: Array<{
  key: Version;
  title: string;
  subtitle: string;
  image: string;
}> = [
  {
    key: "ahogada",
    title: "Capricho Ahogado",
    subtitle: "Más chamoy, más jugosita.",
    image: ahogadoRefImg,
  },
  {
    key: "picosa",
    title: "Capricho Picosín",
    subtitle: "Más chilito, más intensidad.",
    image: picosinRefImg,
  },
];

function findProductById(id: string | null): Product | null {
  if (!id) return null;
  return PRODUCTS.find((product) => product.id === id) ?? null;
}

function sizeLabel(size: Size | null) {
  if (!size) return "";
  switch (size) {
    case "pequeno":
      return "Pequeño";
    case "mediano":
      return "Mediano";
    case "grande":
      return "Grande";
    default:
      return size;
  }
}

function versionLabel(version: Version | null) {
  if (!version) return "";
  return version === "ahogada" ? "Ahogada" : "Picosa";
}

function getAvailableSizes(product: Product | null): Size[] {
  if (!product) return [];

  if (product.category === "gomitas") {
    return product.sizes;
  }

  if (isFixedPrice(product.prices)) {
    return product.sizes ?? [];
  }

  const entries = Object.entries(product.prices.porSize ?? {}) as Array<[
    Size,
    number | undefined,
  ]>;

  return entries
    .filter(([, value]) => typeof value === "number" && value > 0)
    .map(([size]) => size);
}

export default function ArmarPedido() {
  const [searchParams, setSearchParams] = useSearchParams();
  const preSelectedId = searchParams.get("productId");

  const [product, setProduct] = useState<Product | null>(() => findProductById(preSelectedId));
  const [version, setVersion] = useState<Version | null>(null);
  const [size, setSize] = useState<Size | null>(null);
  const [toppings, setToppings] = useState<string[]>([]);
  const [extrasQty, setExtrasQty] = useState<Record<string, number>>({});

  const [service, setService] = useState<"llevar" | "domicilio" | "local">("llevar");
  const [barrio, setBarrio] = useState<Barrio | null>(null);
  const [address, setAddress] = useState("");
  const [reference, setReference] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Transferencia");
  const [comments, setComments] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const isGomitas = product?.category === "gomitas";
  const maxToppings = isGomitas ? product.toppingsIncludedMax : 0;
  const availableSizes = useMemo(() => getAvailableSizes(product), [product]);

  useEffect(() => {
    if (service !== "domicilio") {
      setBarrio(null);
      setAddress("");
      setReference("");
    }
  }, [service]);

  useEffect(() => {
    const lookup = findProductById(preSelectedId);
    if (lookup && lookup.id !== product?.id) {
      setProduct(lookup);
    }
  }, [preSelectedId, product?.id]);

  useEffect(() => {
    if (!product) {
      setVersion(null);
      setSize(null);
      setToppings([]);
      setExtrasQty({});
      return;
    }

    setVersion(product.category === "gomitas" ? null : null);
    setSize((prev) => (prev && availableSizes.includes(prev) ? prev : availableSizes[0] ?? null));
    setToppings([]);
    setExtrasQty({});
  }, [product, availableSizes]);

  useEffect(() => {
    if (!isGomitas && toppings.length) {
      setToppings([]);
    }
  }, [isGomitas, toppings.length]);

  useEffect(() => {
    if (isGomitas && toppings.length > maxToppings) {
      setToppings((prev) => prev.slice(0, maxToppings));
    }
  }, [isGomitas, maxToppings, toppings]);

  const extrasSum = useMemo(() => extrasTotal(extrasQty, EXTRAS), [extrasQty]);

  const subtotal = useMemo(() => {
    if (!product) return 0;
    const base = getBasePrice(product, isGomitas ? version : null, size);
    return base + extrasSum;
  }, [product, isGomitas, version, size, extrasSum]);

  const delivery = useMemo(() => deliveryCost(service, barrio), [service, barrio]);
  const total = subtotal + delivery;

  const toppingsNames = useMemo(() => {
    if (!isGomitas) return [];
    const lookup = new Map(TOPPINGS.map((topping) => [topping.id, topping.name]));
    return toppings.map((id) => lookup.get(id) ?? id);
  }, [isGomitas, toppings]);

  const extrasList = useMemo(
    () =>
      EXTRAS.flatMap((extra) => {
        const qty = extrasQty[extra.id] ?? 0;
        return qty > 0 ? [`${extra.name} x${qty}`] : [];
      }),
    [extrasQty],
  );

  const detailLine = useMemo(() => {
    if (!product) return "";
    const parts: string[] = [];

    if (product.category === "gomitas") {
      if (version) parts.push(versionLabel(version));
      if (size) parts.push(sizeLabel(size));
    } else if (!isFixedPrice(product.prices) && size) {
      parts.push(sizeLabel(size));
    }

    return parts.join(" · ");
  }, [product, version, size]);

  const summaryItems = useMemo(() => {
    if (!product) return [];
    return [
      {
        id: product.id,
        title: product.name,
        detail: detailLine || undefined,
        toppings: toppingsNames.length ? toppingsNames : undefined,
        extras: extrasList.length ? extrasList : undefined,
        price: subtotal,
      },
    ];
  }, [product, detailLine, toppingsNames, extrasList, subtotal]);

  const needsVersion = isGomitas;
  const needsSize = useMemo(() => {
    if (!product) return false;
    if (product.category === "gomitas") return true;
    if (isFixedPrice(product.prices)) return false;
    return getAvailableSizes(product).length > 0;
  }, [product]);

  const toppingsValid = !isGomitas || (toppings.length >= 1 && toppings.length <= maxToppings);
  const hasVersion = !needsVersion || Boolean(version);
  const hasSize = !needsSize || Boolean(size);

  const canSend = Boolean(
    product &&
      subtotal > 0 &&
      hasVersion &&
      hasSize &&
      toppingsValid &&
      name.trim() &&
      phone.trim() &&
      service !== "local" &&
      (service !== "domicilio" || (barrio && address.trim())),
  );

  const handleSelectProduct = (next: Product | null) => {
    setProduct(next);
    const nextParams = new URLSearchParams(searchParams);
    if (next) {
      nextParams.set("productId", next.id);
    } else {
      nextParams.delete("productId");
    }
    setSearchParams(nextParams);
  };

  const handleToggleTopping = (id: string) => {
    if (!isGomitas) return;
    setToppings((prev) => {
      if (prev.includes(id)) {
        return prev.filter((topping) => topping !== id);
      }
      if (prev.length >= maxToppings) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleSetExtraQty = (id: string, qty: number) => {
    setExtrasQty((prev) => {
      if (qty <= 0) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: qty };
    });
  };

  const handleSend = () => {
    if (!canSend || !product) return;

    const origin = window.location.origin;
    const code = buildCode();
    const serviceLabel =
      service === "domicilio"
        ? "Domicilio"
        : service === "llevar"
        ? "Para llevar"
        : "En el local (Próximamente)";

    const barrioLine =
      service === "domicilio" && barrio
        ? `Barrio: ${barrio.name} ${
            barrio.price == null ? "(Se confirma)" : `(${cop(barrio.price)})`
          }`
        : undefined;

    const addressLine =
      service === "domicilio"
        ? `Dirección: ${address.trim()}${reference.trim() ? ` • Ref: ${reference.trim()}` : ""}`
        : undefined;

    const message = buildWhatsAppMessage({
      origin,
      code,
      name: name.trim(),
      phone: phone.trim(),
      serviceLabel,
      barrioLine,
      addressLine,
      product,
      detailLine,
      toppingsLine: toppingsNames.length ? toppingsNames.join(", ") : undefined,
      extrasLine: extrasList.length ? extrasList.join(", ") : undefined,
      subtotal,
      delivery,
      total,
      paymentMethod,
      comments: comments.trim() || undefined,
    });

    const url = waLink(WHATSAPP_DESTINATION, message);
    window.open(url, "_blank");
  };

  return (
    <div className="bg-neutral-950 text-white">
      <section className="px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-4xl text-center space-y-4">
          <span className="text-xs uppercase tracking-[0.35em] text-white/50">
            Arma tu pedido
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black">
            Caprichos picosos listos para compartir
          </h1>
          <p className="text-white/70">
            Elige tu producto, personaliza toppings y extras, y envía tu pedido por WhatsApp para que lo
            preparemos al instante.
          </p>
        </div>
      </section>

      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 pb-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <OrderForm
            name={name}
            phone={phone}
            setName={setName}
            setPhone={setPhone}
            product={product}
            setProduct={handleSelectProduct}
            version={version}
            setVersion={setVersion}
            size={size}
            setSize={setSize}
            sizesAvailable={availableSizes}
            isGomitas={Boolean(isGomitas)}
            maxToppings={maxToppings}
            toppings={toppings}
            toggleTopping={handleToggleTopping}
            extrasQty={extrasQty}
            setExtraQty={handleSetExtraQty}
            service={service}
            setService={setService}
            barrio={barrio}
            setBarrio={setBarrio}
            address={address}
            setAddress={setAddress}
            reference={reference}
            setReference={setReference}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            comments={comments}
            setComments={setComments}
            total={total}
            canSend={canSend}
            onSend={handleSend}
            nequiPhone={NEQUI_PHONE}
          />

          <OrderAside
            items={summaryItems}
            service={service}
            barrio={barrio}
            address={address}
            subtotal={subtotal}
            delivery={delivery}
            total={total}
            canSend={canSend}
            onSend={handleSend}
          />
        </div>

        {isGomitas ? (
          <section className="space-y-4">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-black">Explora nuestras versiones</h2>
              <p className="text-white/60">
                "Ahogada" y "Picosa" son mundos distintos. Mira la referencia visual y decide cuál va mejor con tu antojo.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {VERSION_REFERENCES.map((ref) => (
                <article
                  key={ref.key}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-sm"
                >
                  <img src={ref.image} alt={ref.title} className="h-48 w-full object-cover" loading="lazy" />
                  <div className="space-y-2 px-6 py-5">
                    <div className="text-sm uppercase tracking-[0.3em] text-white/50">Versión</div>
                    <h3 className="text-xl font-black">{ref.title}</h3>
                    <p className="text-sm text-white/65">{ref.subtitle}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black">¿Todavía no eliges tu capricho?</h2>
              <p className="text-white/60">Toca "Elegir" en el catálogo para pre-cargar la configuración en el formulario.</p>
            </div>
            <span className="text-xs uppercase tracking-[0.3em] text-white/40">Catálogo express</span>
          </div>

          <Catalogo
            embedded
            showHeader={false}
            actionLabel="Elegir"
            onSelectProduct={handleSelectProduct}
            selectedProductIds={product ? [product.id] : []}
          />
        </section>
      </div>
    </div>
  );
}
