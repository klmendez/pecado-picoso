// src/pages/ArmarPedido.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "../data/products";
import { NEQUI_PHONE } from "../data/constants";
import { type PaymentMethod, type Service } from "../lib/whatsapp";

import type { CategoryTabValue } from "../components/CategoryTabs";
import ArmarPedidoHeader from "../components/armar-pedido/ArmarPedidoHeader";
import ProductSelectionSection from "../components/armar-pedido/ProductSelectionSection";
import ProductConfigSection from "../components/armar-pedido/ProductConfigSection";
import CustomerInfoSection from "../components/armar-pedido/CustomerInfoSection";
import OrderPricingSidebar from "../components/armar-pedido/OrderPricingSidebar";
import Stepper, { type Step } from "../components/armar-pedido/Stepper";
import { useOrderItems } from "../hooks/useOrderItems";
import { useBarrioSelection } from "../hooks/useBarrioSelection";
import { useOrderPricingValidation } from "../hooks/useOrderPricingValidation";
import { useOrderMessage } from "../hooks/useOrderMessage";

const STEP_SEQUENCE = ["productos", "configuracion", "datos", "resumen"] as const;
type StepId = (typeof STEP_SEQUENCE)[number];

const WHATSAPP_DESTINATION = "573178371144";

const STEP_META: Record<StepId, { title: string; description: string }> = {
  productos: { title: "Productos", description: "Elige y agrega" },
  configuracion: { title: "Configura", description: "Ajusta tus selecciones" },
  datos: { title: "Datos", description: "Contacto y pago" },
  resumen: { title: "Resumen", description: "Revisa y envía" },
};

export default function ArmarPedido() {
  const [category, setCategory] = useState<CategoryTabValue>("todos");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState<Service>("llevar");
  const [address, setAddress] = useState("");
  const [reference, setReference] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Transferencia");
  const [comments, setComments] = useState("");

  const { items, selectedIds, toggleProduct, updateItem, updateQty } = useOrderItems();
  const {
    barrio,
    setBarrio,
    barrioQuery,
    setBarrioQuery,
    filteredBarrios,
    deliverySectionEnabled,
    totalBarrios,
  } = useBarrioSelection(service);

  const { pricedItems, subtotal, delivery, total, checklist, canSend, sendDisabledHint, validation } =
    useOrderPricingValidation({ items, service, barrio, address, name, phone });

  const { openWhatsApp } = useOrderMessage({
    name,
    phone,
    service,
    barrio,
    address,
    reference,
    paymentMethod,
    comments,
    items,
    subtotal,
    delivery,
    total,
    destination: WHATSAPP_DESTINATION,
  });

  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);
  const summaryOpenRef = useRef(false);
  const didMountRef = useRef(false);

  const scrollToStepperTop = () => {
    const anchor = scrollAnchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const offset = window.innerWidth >= 1024 ? 104 : window.innerWidth >= 640 ? 88 : 72;
    const targetTop = Math.max(0, rect.top + window.scrollY - offset);
    window.scrollTo({ top: targetTop, behavior: "smooth" });
  };

  const handleFocusProduct = (productId: string | null) => {
    setActiveProductId(productId);
    if (productId === null) {
      requestAnimationFrame(() => scrollToStepperTop());
    }
  };

  const currentStepId = STEP_SEQUENCE[stepIndex];

  const handleToggleProduct = (product: Product) => {
    const alreadySelected = selectedIds.includes(product.id);
    toggleProduct(product);
    
    if (!alreadySelected) {
      // Si es un producto nuevo, ir al paso de configuración y activarlo
      setStepIndex(1);
      setActiveProductId(product.id);
    } else {
      // Si se quitó el producto y estaba activo, desactivarlo
      if (activeProductId === product.id) {
        setActiveProductId(null);
      }
    }
  };

  const handleQtyChange = (productId: string, qty: number) => {
    updateQty(productId, qty);
    if (qty <= 0 && activeProductId === productId) {
      setActiveProductId(null);
    }
  };

  useEffect(() => {
    if (!items.length) {
      setActiveProductId(null);
      return;
    }

    if (activeProductId && items.some((it) => it.product.id === activeProductId)) {
      return;
    }

    if (activeProductId && !items.some((it) => it.product.id === activeProductId)) {
      setActiveProductId(null);
    }
  }, [items, activeProductId]);

  const { itemsOk, itemsConfigOk, customerOk, deliveryOk } = validation;

  useEffect(() => {
    if (currentStepId === "configuracion" && !itemsOk) {
      setStepIndex(0);
      return;
    }

    if (currentStepId === "datos") {
      if (!itemsOk) {
        setStepIndex(0);
        return;
      }
      if (!itemsConfigOk) {
        setStepIndex(1);
        return;
      }
    }

    if (currentStepId === "resumen") {
      if (!itemsOk) {
        setStepIndex(0);
        return;
      }
      if (!itemsConfigOk) {
        setStepIndex(1);
        return;
      }
      if (!(customerOk && deliveryOk)) {
        setStepIndex(2);
      }
    }
  }, [currentStepId, itemsOk, itemsConfigOk, customerOk, deliveryOk]);

  const handleSend = () => {
    if (!canSend) return;
    openWhatsApp();
  };

  const canAdvanceFromStep = (id: StepId) => {
    switch (id) {
      case "productos":
        return items.length > 0;
      case "configuracion":
        return itemsConfigOk;
      case "datos":
        return customerOk && deliveryOk;
      default:
        return false;
    }
  };

  const goToNextStep = () => {
    if (stepIndex >= STEP_SEQUENCE.length - 1) return;
    if (!canAdvanceFromStep(currentStepId)) return;
    setStepIndex((prev) => Math.min(prev + 1, STEP_SEQUENCE.length - 1));
  };

  const goToPreviousStep = () => {
    setStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleSelectStep = (id: string) => {
    const targetIndex = STEP_SEQUENCE.indexOf(id as StepId);
    if (targetIndex === -1) return;
    if (targetIndex < stepIndex) setStepIndex(targetIndex);
  };

  const steps: Step[] = STEP_SEQUENCE.map((id, index) => {
    const status: Step["status"] = index < stepIndex ? "done" : index === stepIndex ? "current" : "todo";
    return { id, title: STEP_META[id].title, description: STEP_META[id].description, status };
  });

  useEffect(() => {
    summaryOpenRef.current = summaryOpen;
  }, [summaryOpen]);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    if (summaryOpenRef.current) return;

    const anchor = scrollAnchorRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const offset = window.innerWidth >= 1024 ? 104 : window.innerWidth >= 640 ? 88 : 72;
    const targetTop = Math.max(0, rect.top + window.scrollY - offset);

    window.scrollTo({ top: targetTop, behavior: "smooth" });
  }, [stepIndex]);

  // Bloquear scroll del body cuando el resumen está abierto (mejor UX móvil)
  useEffect(() => {
    if (!summaryOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [summaryOpen]);

  // Texto y acciones del “footer sticky” mobile según el paso
  const footerCTA = useMemo(() => {
    const back =
      stepIndex > 0
        ? { label: "Atrás", onClick: goToPreviousStep, disabled: false }
        : { label: "Atrás", onClick: goToPreviousStep, disabled: true };

    if (currentStepId === "productos") {
      return {
        back,
        next: {
          label: "Personalizar producto",
          onClick: goToNextStep,
          disabled: !canAdvanceFromStep("productos"),
        },
      };
    }

    if (currentStepId === "configuracion") {
      return {
        back: { label: "Productos", onClick: () => setStepIndex(0), disabled: false },
        next: {
          label: "Continuar",
          onClick: goToNextStep,
          disabled: !canAdvanceFromStep("configuracion"),
        },
      };
    }

    if (currentStepId === "datos") {
      return {
        back,
        next: {
          label: "Ir al resumen",
          onClick: goToNextStep,
          disabled: !canAdvanceFromStep("datos"),
        },
      };
    }

    // resumen
    return {
      back,
      next: {
        label: "Enviar por WhatsApp",
        onClick: handleSend,
        disabled: !canSend,
      },
    };
  }, [currentStepId, stepIndex, canSend, itemsConfigOk, customerOk, deliveryOk, items.length]);

  const renderProductsStep = () => (
    <div className="space-y-5 sm:space-y-6">
      <ProductSelectionSection
        category={category}
        onChangeCategory={setCategory}
        selectedIds={selectedIds}
        onToggleProduct={handleToggleProduct}
      />

      {/* Desktop CTA (en móvil lo maneja el footer sticky) */}
      <div className="hidden sm:flex sm:justify-end">
        <button
          type="button"
          onClick={goToNextStep}
          disabled={!canAdvanceFromStep("productos")}
          className={[
            "rounded-full border border-white/25 px-6 py-2 text-sm font-black",
            canAdvanceFromStep("productos") ? "text-white hover:bg-white/[0.06]" : "text-white/35 cursor-not-allowed",
          ].join(" ")}
        >
          Continuar a configuración
        </button>
      </div>
    </div>
  );

  const renderConfigStep = () => (
    <div className="space-y-5 sm:space-y-6">
      <ProductConfigSection
        items={items}
        updateItem={updateItem}
        updateQty={handleQtyChange}
        activeProductId={activeProductId}
        onFocusProduct={handleFocusProduct}
      />

      {/* Desktop CTA (en móvil lo maneja el footer sticky) */}
      <div className="hidden sm:flex sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => setStepIndex(0)}
          className="rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-white/70 hover:border-white/40 hover:text-white"
        >
          Agregar otro producto
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={goToPreviousStep}
            className="rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-white/70 hover:border-white/40 hover:text-white"
          >
            Volver a productos
          </button>

          <button
            type="button"
            onClick={goToNextStep}
            disabled={!canAdvanceFromStep("configuracion")}
            className={[
              "rounded-full border border-white/25 px-6 py-2 text-sm font-black",
              canAdvanceFromStep("configuracion") ? "text-white hover:bg-white/[0.06]" : "text-white/35 cursor-not-allowed",
            ].join(" ")}
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  );

  const renderDatosStep = () => (
    <div className="space-y-5 sm:space-y-6">
      <CustomerInfoSection
        name={name}
        setName={setName}
        phone={phone}
        setPhone={setPhone}
        service={service}
        setService={setService}
        barrio={barrio}
        setBarrio={setBarrio}
        barrioQuery={barrioQuery}
        setBarrioQuery={setBarrioQuery}
        address={address}
        setAddress={setAddress}
        reference={reference}
        setReference={setReference}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        comments={comments}
        setComments={setComments}
        deliverySectionEnabled={deliverySectionEnabled}
        filteredBarrios={filteredBarrios}
        totalBarrios={totalBarrios}
        nequiPhone={NEQUI_PHONE}
      />

      {/* Desktop CTA (en móvil lo maneja el footer sticky) */}
      <div className="hidden sm:flex sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={goToPreviousStep}
          className="rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-white/70 hover:border-white/40 hover:text-white"
        >
          Volver a configuración
        </button>

        <button
          type="button"
          onClick={goToNextStep}
          disabled={!canAdvanceFromStep("datos")}
          className={[
            "rounded-full border border-white/25 px-6 py-2 text-sm font-black",
            canAdvanceFromStep("datos") ? "text-white hover:bg-white/[0.06]" : "text-white/35 cursor-not-allowed",
          ].join(" ")}
        >
          Continuar al resumen
        </button>
      </div>
    </div>
  );

  const renderResumenStep = () => (
    <div className="mx-auto max-w-xl space-y-6">
      <OrderPricingSidebar
        items={pricedItems}
        subtotal={subtotal}
        delivery={delivery}
        total={total}
        canSend={canSend}
        onSend={handleSend}
        onRemove={(productId) => updateQty(productId, 0)}
        sendDisabledHint={sendDisabledHint}
        checklist={checklist}
      />

      {/* Desktop CTA (en móvil lo maneja el footer sticky) */}
      <div className="hidden sm:flex sm:justify-start">
        <button
          type="button"
          onClick={goToPreviousStep}
          className="rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-white/70 hover:border-white/40 hover:text-white"
        >
          Volver a datos
        </button>
      </div>
    </div>
  );

  const stepContent = (() => {
    switch (currentStepId) {
      case "productos":
        return renderProductsStep();
      case "configuracion":
        return renderConfigStep();
      case "datos":
        return renderDatosStep();
      case "resumen":
        return renderResumenStep();
      default:
        return null;
    }
  })();

  return (
    <div className="bg-neutral-950 text-white pt-20 sm:pt-24 lg:pt-28">
      <ArmarPedidoHeader selectedCount={items.length} />

      <div ref={scrollAnchorRef} className="mx-auto max-w-5xl px-4 pb-24 sm:pb-16">
        {/* Stepper sticky (mobile) */}
        <div className="sticky top-[72px] z-40 -mx-4 px-4 py-3 bg-neutral-950/95 backdrop-blur border-b border-white/10 sm:static sm:top-auto sm:z-auto sm:-mx-0 sm:px-0 sm:py-0 sm:bg-transparent sm:backdrop-blur-0 sm:border-b-0">
          <Stepper steps={steps} onSelectStep={handleSelectStep} />
        </div>

        {/* En desktop mantenemos botón normal; en móvil usamos FAB */}
        <div className="hidden sm:mt-4 sm:flex sm:justify-end">
          <button
            type="button"
            onClick={() => setSummaryOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
          >
            <span aria-hidden>🛒</span>
            Ver resumen
          </button>
        </div>

        {/* Contenido principal con spacing móvil más compacto */}
        <div className="mt-5 sm:mt-8">{stepContent}</div>
      </div>

      {/* FAB móvil */}
      <button
        type="button"
        onClick={() => setSummaryOpen(true)}
        className="sm:hidden fixed right-4 bottom-[88px] z-50 inline-flex items-center justify-center h-12 w-12 rounded-full border border-white/20 bg-neutral-950/95 backdrop-blur shadow-[0_12px_30px_rgba(0,0,0,0.55)] active:scale-95"
        aria-label="Ver resumen"
      >
        <span aria-hidden className="text-lg">
          🛒
        </span>
      </button>

      {/* Footer sticky mobile (CTA siempre visible) */}
      <div className="sm:hidden fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-neutral-950/95 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={footerCTA.back.onClick}
              disabled={footerCTA.back.disabled}
              className={[
                "h-11 flex-1 rounded-full border px-4 text-sm font-black",
                footerCTA.back.disabled
                  ? "border-white/10 text-white/25 cursor-not-allowed"
                  : "border-white/15 text-white/75 active:scale-[0.99]",
              ].join(" ")}
            >
              {footerCTA.back.label}
            </button>

            <button
              type="button"
              onClick={footerCTA.next.onClick}
              disabled={footerCTA.next.disabled}
              className={[
                "h-11 flex-[1.4] rounded-full border px-4 text-sm font-black",
                !footerCTA.next.disabled
                  ? "border-white/25 text-white active:scale-[0.99]"
                  : "border-white/10 text-white/25 cursor-not-allowed",
              ].join(" ")}
            >
              {footerCTA.next.label}
            </button>
          </div>
        </div>
      </div>

      {/* Resumen: bottom sheet en mobile, modal centrado en desktop */}
      {summaryOpen ? (
        <div
          className="fixed inset-0 z-50 bg-black/80"
          onClick={() => setSummaryOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={[
              "absolute left-0 right-0",
              "sm:inset-0 sm:flex sm:items-center sm:justify-center sm:px-4 sm:py-10",
              "bottom-0 sm:bottom-auto",
            ].join(" ")}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile sheet */}
            <div className="sm:hidden w-full rounded-t-3xl border border-white/10 bg-neutral-950/98 shadow-[0_-20px_60px_rgba(0,0,0,0.65)]">
              <div className="px-4 pt-3 pb-2">
                <div className="mx-auto h-1.5 w-10 rounded-full bg-white/15" aria-hidden />
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-sm font-black">Resumen del pedido</div>
                  <button
                    type="button"
                    onClick={() => setSummaryOpen(false)}
                    className="rounded-full border border-white/20 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white/70"
                  >
                    ✕ Cerrar
                  </button>
                </div>
              </div>

              <div className="max-h-[72vh] overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+12px)]">
                <OrderPricingSidebar
                  items={pricedItems}
                  subtotal={subtotal}
                  delivery={delivery}
                  total={total}
                  canSend={canSend}
                  onSend={handleSend}
                  onRemove={(productId) => updateQty(productId, 0)}
                  sendDisabledHint={sendDisabledHint}
                  checklist={checklist}
                />
              </div>
            </div>

            {/* Desktop modal */}
            <div className="hidden sm:block relative w-full max-w-xl">
              <button
                type="button"
                onClick={() => setSummaryOpen(false)}
                className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70 hover:border-white/40 hover:text-white"
              >
                <span aria-hidden>✕</span>
                Cerrar
              </button>

              <div className="max-h-[75vh] overflow-y-auto rounded-3xl border border-white/10 bg-neutral-950/95 p-5 shadow-[0_25px_60px_rgba(0,0,0,0.55)]">
                <OrderPricingSidebar
                  items={pricedItems}
                  subtotal={subtotal}
                  delivery={delivery}
                  total={total}
                  canSend={canSend}
                  onSend={handleSend}
                  onRemove={(productId) => updateQty(productId, 0)}
                  sendDisabledHint={sendDisabledHint}
                  checklist={checklist}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
