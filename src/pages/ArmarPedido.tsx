import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation as useRouterLocation, useNavigate, useSearchParams } from "react-router-dom";
import type { Product } from "../data/products";
import { NEQUI_PHONE } from "../data/constants";
import { type PaymentMethod, type Service } from "../lib/whatsapp";

import type { CategoryTabValue } from "../components/CategoryTabs";
import ArmarPedidoHeader from "../components/armar-pedido/ArmarPedidoHeader";
import ProductSelectionSection from "../components/armar-pedido/ProductSelectionSection";
import ProductConfigSection, { isItemConfigComplete } from "../components/armar-pedido/ProductConfigSection";
import CustomerInfoSection, {
  type CustomerInfoErrors,
  type CustomerInfoFocusRequest,
  type CustomerInfoField,
  type LocationState,
} from "../components/armar-pedido/CustomerInfoSection";
import OrderPricingSidebar from "../components/armar-pedido/OrderPricingSidebar";
import Stepper, { type Step } from "../components/armar-pedido/Stepper";
import CartDrawer from "../components/CartDrawer";
import { useOrderItems } from "../hooks/useOrderItems";
import { useBarrioSelection } from "../hooks/useBarrioSelection";
import { useOrderPricingValidation } from "../hooks/useOrderPricingValidation";
import { useStoreProducts } from "../hooks/useStoreProducts";
import { usePromotions } from "../hooks/usePromotions";
import { toBirthdayKey } from "../lib/birthday";

const STEP_SEQUENCE = ["productos", "configuracion", "datos", "resumen"] as const;
type StepId = (typeof STEP_SEQUENCE)[number];

const STEP_META: Record<StepId, { title: string; description: string }> = {
  productos: { title: "Elige", description: "Agrega productos" },
  configuracion: { title: "Personaliza", description: "Ajusta cada uno" },
  datos: { title: "Datos", description: "Tu info y envío" },
  resumen: { title: "Resumen", description: "Confirma y envía" },
};

export default function ArmarPedido() {
  const navigate = useNavigate();
  const routerLocation = useRouterLocation();
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get("categoria") || "todos";
  const [category, setCategory] = useState<CategoryTabValue>(initialCategory);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState("");
  const [email, setEmail] = useState("");
  const [service, setService] = useState<Service>("domicilio");
  const [address, setAddress] = useState("");
  const [reference, setReference] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Transferencia");
  const [comments, setComments] = useState("");

  const { items, selectedIds, selectedCountByProduct, addProduct, updateItem, duplicateItem, removeItem, removeLastOfProduct } =
    useOrderItems();
  const { products: storeProducts, categories: storeCategories } = useStoreProducts();
  const {
    barrio,
    setBarrio,
    barrioQuery,
    setBarrioQuery,
    filteredBarrios,
    deliverySectionEnabled,
    totalBarrios,
  } = useBarrioSelection(service);

  const { promotions } = usePromotions();

  const { pricedItems, subtotal, delivery, total, descuentoTotal, appliedPromotions, canSend, sendDisabledHint, validation } =
    useOrderPricingValidation({ items, service, barrio, address, name, phone, promotions, birthdayKey: toBirthdayKey(birthday) });

  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);
  const isSyncingRouteRef = useRef(false);
  const didMountRef = useRef(false);
  const focusSequenceRef = useRef(0);
  const manualProductCloseRef = useRef(false);
  const [showCustomerErrors, setShowCustomerErrors] = useState(false);
  const [showConfigWarning, setShowConfigWarning] = useState(false);
  const [focusRequest, setFocusRequest] = useState<CustomerInfoFocusRequest>(null);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [customerLocation, setCustomerLocation] = useState<LocationState>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const cat = searchParams.get("categoria");
    if (cat) setCategory(cat);
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 639px)");
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(event.matches);
    };

    handleChange(mq);
    mq.addEventListener("change", handleChange as (ev: MediaQueryListEvent) => void);
    return () => mq.removeEventListener("change", handleChange as (ev: MediaQueryListEvent) => void);
  }, []);

  const customerErrors = useMemo<CustomerInfoErrors>(() => {
    return {
      name: !name.trim(),
      phone: !phone.trim(),
      barrio: service === "domicilio" ? !barrio : false,
      address: service === "domicilio" ? !address.trim() : false,
    };
  }, [name, phone, service, barrio, address]);

  useEffect(() => {
    if (!showCustomerErrors) return;
    if (!Object.values(customerErrors).some(Boolean)) {
      setShowCustomerErrors(false);
    }
  }, [customerErrors, showCustomerErrors]);

  const requestFocusForField = (field: CustomerInfoField) => {
    focusSequenceRef.current += 1;
    setFocusRequest({ field, id: focusSequenceRef.current });
  };

  const consumeFocusRequest = () => {
    setFocusRequest(null);
  };

  const scrollToStepperTop = () => {
    const anchor = scrollAnchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const offset = window.innerWidth >= 1024 ? 104 : window.innerWidth >= 640 ? 88 : 72;
    const targetTop = Math.max(0, rect.top + window.scrollY - offset);
    window.scrollTo({ top: targetTop, behavior: "smooth" });
  };

  const handleFocusProduct = (itemId: string | null) => {
    if (itemId === null) {
      manualProductCloseRef.current = true;
      setActiveProductId(null);
      requestAnimationFrame(() => scrollToStepperTop());
    } else {
      manualProductCloseRef.current = false;
      setActiveProductId(itemId);
    }
  };

  const currentStepId = STEP_SEQUENCE[stepIndex];

  const handleAddProduct = (product: Product) => {
    manualProductCloseRef.current = false;
    addProduct(product);
  };

  const handleRemoveItem = (itemId: string) => {
    removeItem(itemId);
    if (activeProductId === itemId) {
      setActiveProductId(null);
    }
  };

  useEffect(() => {
    if (!items.length) {
      setActiveProductId(null);
      manualProductCloseRef.current = false;
      return;
    }

    if (!activeProductId) {
      if (manualProductCloseRef.current) return;
      setActiveProductId(items[items.length - 1].id);
      return;
    }

    if (items.some((it) => it.id === activeProductId)) return;

    setActiveProductId(items[items.length - 1]?.id ?? null);
  }, [items, activeProductId]);

  const { itemsOk, itemsConfigOk, customerOk, deliveryOk } = validation;

  useEffect(() => {
    if (showConfigWarning && itemsConfigOk) {
      setShowConfigWarning(false);
    }
  }, [showConfigWarning, itemsConfigOk]);

  useEffect(() => {
    if (currentStepId === "configuracion" && !itemsOk) {
      setStepIndex(0);
      return;
    }

    if (currentStepId === "datos" || currentStepId === "resumen") {
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
      if (!customerOk || !deliveryOk) {
        setStepIndex(2);
        return;
      }
    }
  }, [currentStepId, itemsOk, itemsConfigOk, customerOk, deliveryOk]);

  const handleSend = () => {
    if (!canSend) return;
    setCartDrawerOpen(true);
  };

  const handleClearCart = () => {
    items.forEach(item => removeItem(item.id));
    setActiveProductId(null);
    setStepIndex(0);
  };

  const canAdvanceFromStep = (id: StepId) => {
    switch (id) {
      case "productos":
        return items.length > 0;
      case "configuracion":
        return itemsConfigOk;
      case "datos":
        return customerOk && deliveryOk;
      case "resumen":
        return canSend;
      default:
        return false;
    }
  };

  const goToNextStep = () => {
    if (stepIndex >= STEP_SEQUENCE.length - 1) return;
    if (!canAdvanceFromStep(currentStepId)) {
      if (currentStepId === "configuracion") {
        setShowConfigWarning(true);
        const firstIncomplete = items.find((it) => !isItemConfigComplete(it));
        if (firstIncomplete) {
          manualProductCloseRef.current = false;
          setActiveProductId(firstIncomplete.id);
        }
      }
      if (currentStepId === "datos") {
        setShowCustomerErrors(true);
        const firstErrorEntry = Object.entries(customerErrors).find(([, hasError]) => hasError);
        if (firstErrorEntry) {
          requestFocusForField(firstErrorEntry[0] as CustomerInfoField);
        }
      }
      return;
    }
    setShowConfigWarning(false);
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
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    const anchor = scrollAnchorRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const offset = window.innerWidth >= 1024 ? 104 : window.innerWidth >= 640 ? 88 : 72;
    const targetTop = Math.max(0, rect.top + window.scrollY - offset);

    window.scrollTo({ top: targetTop, behavior: "smooth" });
  }, [stepIndex]);

  useEffect(() => {
    if (!isMobile) {
      if (routerLocation.pathname !== "/armar") {
        navigate("/armar", { replace: true });
      }
      return;
    }

    const targetPath = stepIndex === 0 ? "/armar" : "/armar/personalizar";
    if (routerLocation.pathname !== targetPath) {
      isSyncingRouteRef.current = true;
      navigate(targetPath, { replace: true });
    }
  }, [isMobile, stepIndex, routerLocation.pathname, navigate]);

  useEffect(() => {
    if (!isMobile) return;
    if (isSyncingRouteRef.current) {
      isSyncingRouteRef.current = false;
      return;
    }

    const path = routerLocation.pathname;
    if (path === "/armar" && stepIndex !== 0) {
      setStepIndex(0);
    } else if (path.startsWith("/armar/personalizar") && stepIndex === 0) {
      setStepIndex(1);
    }
  }, [isMobile, routerLocation.pathname, stepIndex]);

  const footerCTA = useMemo(() => {
    const back =
      stepIndex > 0
        ? { label: "Atrás", onClick: goToPreviousStep, disabled: false }
        : { label: "Atrás", onClick: goToPreviousStep, disabled: true };

    if (currentStepId === "productos") {
      return {
        back,
        next: {
          label: "Personalizar",
          onClick: goToNextStep,
          disabled: !canAdvanceFromStep("productos"),
        },
      };
    }

    if (currentStepId === "configuracion") {
      return {
        back: { label: "Productos", onClick: () => setStepIndex(0), disabled: false },
        next: {
          label: "Datos",
          onClick: goToNextStep,
          disabled: !canAdvanceFromStep("configuracion"),
        },
      };
    }

    if (currentStepId === "datos") {
      return {
        back: { label: "Personalizar", onClick: () => setStepIndex(1), disabled: false },
        next: {
          label: "Ver resumen",
          onClick: goToNextStep,
          disabled: !canAdvanceFromStep("datos"),
        },
      };
    }

    return {
      back: { label: "Datos", onClick: () => setStepIndex(2), disabled: false },
      next: {
        label: "Confirmar pedido",
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
        selectedCountByProduct={selectedCountByProduct}
        onAddProduct={handleAddProduct}
        onRemoveLastOfProduct={removeLastOfProduct}
        extraProducts={storeProducts}
        categories={storeCategories}
      />

      <div className="hidden sm:flex sm:justify-end">
        <button
          type="button"
          onClick={goToNextStep}
          disabled={!canAdvanceFromStep("productos")}
          className={[
            "border border-gray-300 px-6 py-2 text-sm font-semibold transition",
            canAdvanceFromStep("productos") ? "text-black hover:border-black" : "text-gray-300 cursor-not-allowed",
          ].join(" ")}
        >
          Personalizar
        </button>
      </div>
    </div>
  );

  const renderConfigStep = () => (
    <div className="space-y-5 sm:space-y-6">
      <ProductConfigSection
        items={items}
        updateItem={updateItem}
        duplicateItem={duplicateItem}
        removeItem={handleRemoveItem}
        activeProductId={activeProductId}
        onFocusProduct={handleFocusProduct}
        onGoToNext={goToNextStep}
        showIncompleteWarning={showConfigWarning}
      />

      <div className="hidden sm:flex sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => setStepIndex(0)}
          className="border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-500 hover:border-gray-400 hover:text-black"
        >
          + Agregar más
        </button>

        <button
          type="button"
          onClick={goToNextStep}
          disabled={!canAdvanceFromStep("configuracion")}
          className={[
            "border border-gray-300 px-6 py-2 text-sm font-semibold transition",
            canAdvanceFromStep("configuracion") ? "text-black hover:border-black" : "text-gray-300 cursor-not-allowed",
          ].join(" ")}
        >
          Datos y envío
        </button>
      </div>
    </div>
  );

  const renderDatosStep = () => (
    <div className="space-y-6">
      <CustomerInfoSection
        name={name}
        setName={setName}
        phone={phone}
        setPhone={setPhone}
        birthday={birthday}
        setBirthday={setBirthday}
        email={email}
        setEmail={setEmail}
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
        showErrors={showCustomerErrors}
        errors={customerErrors}
        focusRequest={focusRequest}
        onFocusRequestConsumed={consumeFocusRequest}
        location={customerLocation}
        onLocationChange={setCustomerLocation}
      />

      {/* Indicador de lo que falta */}
      {!canAdvanceFromStep("datos") && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Completa para continuar
          </div>
          <ul className="space-y-1.5">
            {customerErrors.name && (
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-rojo">○</span> Falta tu nombre
              </li>
            )}
            {customerErrors.phone && (
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-rojo">○</span> Falta tu teléfono
              </li>
            )}
            {service === "domicilio" && customerErrors.barrio && (
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-rojo">○</span> Falta seleccionar un barrio
              </li>
            )}
            {service === "domicilio" && customerErrors.address && (
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-rojo">○</span> Falta tu dirección
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="hidden sm:flex sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={goToPreviousStep}
          className="border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-500 hover:border-gray-400 hover:text-black"
        >
          Volver a personalización
        </button>
        <button
          type="button"
          onClick={goToNextStep}
          disabled={!canAdvanceFromStep("datos")}
          className={[
            "border border-gray-300 px-6 py-2 text-sm font-semibold transition",
            canAdvanceFromStep("datos") ? "text-black hover:border-black" : "text-gray-300 cursor-not-allowed",
          ].join(" ")}
        >
          Ver resumen
        </button>
      </div>
    </div>
  );

  const renderResumenStep = () => (
    <div className="space-y-6">
      <OrderPricingSidebar
        items={pricedItems}
        subtotal={subtotal}
        delivery={delivery}
        total={total}
        canSend={canSend}
        onSend={handleSend}
        onRemove={handleRemoveItem}
        sendDisabledHint={sendDisabledHint}
        descuentoTotal={descuentoTotal}
        appliedPromotions={appliedPromotions}
      />

      <div className="hidden sm:flex sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={goToPreviousStep}
          className="border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-500 hover:border-gray-400 hover:text-black"
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

  const mobileDetailMode = isMobile;

  const desktopOrCatalogLayout = (
    <div className="bg-crema text-neutral-900 pt-[56px] sm:pt-20 lg:pt-24">
      <ArmarPedidoHeader selectedCount={items.length} />

      <div ref={scrollAnchorRef} className="mx-auto max-w-5xl px-4 pb-20 sm:pb-16">
        <div className="sticky top-[56px] z-40 -mx-4 px-4 py-1.5 bg-crema/95 backdrop-blur border-b border-gray-100 sm:static sm:top-auto sm:z-auto sm:-mx-0 sm:px-0 sm:py-0 sm:bg-transparent sm:backdrop-blur-0 sm:border-b-0">
          <Stepper steps={steps} onSelectStep={handleSelectStep} />
        </div>

        <div className="mt-3 sm:mt-8">{stepContent}</div>
      </div>
    </div>
  );

  const mobileDetailLayout = (
    <div className="bg-crema text-neutral-900 min-h-dvh flex flex-col pt-[56px]">
      <div className="fixed left-0 right-0 top-[56px] z-40 flex items-center justify-between gap-3 border-b border-gray-100 bg-crema/95 px-4 py-1.5 backdrop-blur sm:hidden">
        <button
          type="button"
          onClick={footerCTA.back.onClick}
          disabled={footerCTA.back.disabled}
          className="inline-flex items-center gap-1.5 text-sm font-bold active:opacity-70 disabled:text-gray-300"
          style={{ color: footerCTA.back.disabled ? undefined : '#D64045' }}
        >
          <span aria-hidden>←</span>
          {footerCTA.back.label}
        </button>

        <div className="text-xs font-bold uppercase tracking-[0.2em] text-gray-900">
          {STEP_META[currentStepId].title}
        </div>

        <button
          type="button"
          onClick={footerCTA.next.onClick}
          disabled={footerCTA.next.disabled}
          className="inline-flex items-center gap-1.5 text-sm font-bold active:opacity-70 disabled:text-gray-300"
          style={{ color: footerCTA.next.disabled ? undefined : '#D64045' }}
        >
          {footerCTA.next.label}
          <span aria-hidden>→</span>
        </button>
      </div>

      <div className="flex-1 px-4 pt-[36px]">
        {stepContent}
      </div>

      <div className="sticky bottom-0 z-40 flex items-center gap-2 border-t border-gray-200 bg-white px-4 py-3">
        <button
          type="button"
          onClick={footerCTA.back.onClick}
          disabled={footerCTA.back.disabled}
          className={[
            "flex-1 border px-3 py-2.5 text-[10px] font-medium uppercase tracking-[0.15em]",
            footerCTA.back.disabled
              ? "border-gray-200 text-gray-300"
              : "border-gray-300 text-gray-600 active:bg-gray-100",
          ].join(" ")}
        >
          {footerCTA.back.label}
        </button>

        <button
          type="button"
          onClick={footerCTA.next.onClick}
          disabled={footerCTA.next.disabled}
          className={[
            "flex-[1.5] border px-3 py-2.5 text-[10px] font-medium uppercase tracking-[0.15em]",
            !footerCTA.next.disabled
              ? currentStepId === "resumen"
                ? "border-rojo bg-rojo text-white active:bg-rojo-dark"
                : "border-rojo bg-rojo text-white active:bg-rojo-dark"
              : "border-gray-200 text-gray-300",
          ].join(" ")}
        >
          {footerCTA.next.label}
        </button>
      </div>
    </div>
  );

  const cartDrawerInitialLocation = useMemo(() => {
    if (!customerLocation) return null;
    return {
      lat: customerLocation.lat,
      lng: customerLocation.lng,
      accuracy: customerLocation.accuracy,
      timestamp: customerLocation.timestamp ?? Date.now(),
    };
  }, [customerLocation]);

  return (
    <>
      {mobileDetailMode ? mobileDetailLayout : desktopOrCatalogLayout}

      <CartDrawer
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        items={items}
        subtotal={subtotal}
        delivery={delivery}
        total={total}
        descuentoTotal={descuentoTotal}
        appliedPromotions={appliedPromotions}
        name={name}
        phone={phone}
        birthday={birthday}
        email={email}
        service={service}
        barrio={barrio}
        address={address}
        reference={reference}
        paymentMethod={paymentMethod}
        comments={comments}
        initialLocation={cartDrawerInitialLocation}
        onClearCart={handleClearCart}
      />
    </>
  );
}
