import { useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import { User, Phone, MapPin, Truck, Store, CreditCard, Banknote, MessageSquare, Navigation, X, CheckCircle2, Search, ExternalLink, History, Plus, Cake, Mail } from "lucide-react";

import type { Barrio } from "../../data/barrios";
import type { PaymentMethod, Service } from "../../lib/whatsapp";
import { cop } from "../../lib/format";
import { LocationService } from "../../services/locationService";
import { ClientService, type ClientAddress } from "../../services/clientService";
import { isBirthdayToday, toBirthdayKey } from "../../lib/birthday";

export type CustomerInfoField = "name" | "phone" | "barrio" | "address";
export type CustomerInfoErrors = Record<CustomerInfoField, boolean>;
export type CustomerInfoFocusRequest = { field: CustomerInfoField; id: number } | null;

export type LocationState = {
  lat: number;
  lng: number;
  accuracy?: number;
  mapsLink: string;
  timestamp?: number;
} | null;

type SubStep = "personal" | "entrega" | "pago";

function StepHeader({ n, children }: { n: number; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white">
        {n}
      </span>
      <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">{children}</h3>
    </div>
  );
}

function NextButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex justify-end border-t border-gray-100 pt-5">
      <button
        type="button"
        onClick={onClick}
        className="w-full sm:w-auto border border-rojo bg-rojo px-8 py-3 text-xs font-bold uppercase tracking-[0.15em] text-white transition active:bg-rojo-dark"
      >
        Siguiente →
      </button>
    </div>
  );
}

function BackNextButtons({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  return (
    <div className="flex gap-2 border-t border-gray-100 pt-5">
      <button
        type="button"
        onClick={onBack}
        className="border border-gray-900 bg-gray-900 px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] text-white transition hover:bg-black"
      >
        ← Atrás
      </button>
      <button
        type="button"
        onClick={onNext}
        className="flex-1 border border-rojo bg-rojo px-8 py-3 text-xs font-bold uppercase tracking-[0.15em] text-white transition active:bg-rojo-dark"
      >
        Siguiente →
      </button>
    </div>
  );
}

type Props = {
  name: string;
  phone: string;
  setName: (value: string) => void;
  setPhone: (value: string) => void;
  birthday: string;
  setBirthday: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  service: Service;
  setService: (value: Service) => void;
  barrio: Barrio | null;
  setBarrio: (value: Barrio | null) => void;
  barrioQuery: string;
  setBarrioQuery: (value: string) => void;
  address: string;
  setAddress: (value: string) => void;
  reference: string;
  setReference: (value: string) => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (value: PaymentMethod) => void;
  comments: string;
  setComments: (value: string) => void;
  deliverySectionEnabled: boolean;
  filteredBarrios: Barrio[];
  totalBarrios: number;
  nequiPhone: string;
  showErrors: boolean;
  errors: CustomerInfoErrors;
  focusRequest: CustomerInfoFocusRequest;
  onFocusRequestConsumed: () => void;
  onComplete: () => void;
  location: LocationState;
  onLocationChange: (loc: LocationState) => void;
};

export default function CustomerInfoSection({
  name,
  phone,
  setName,
  setPhone,
  birthday,
  setBirthday,
  email,
  setEmail,
  service,
  setService,
  barrio,
  setBarrio,
  barrioQuery,
  setBarrioQuery,
  address,
  setAddress,
  reference,
  setReference,
  paymentMethod,
  setPaymentMethod,
  comments,
  setComments,
  deliverySectionEnabled,
  filteredBarrios,
  totalBarrios,
  nequiPhone,
  showErrors,
  errors,
  focusRequest,
  onFocusRequestConsumed,
  onComplete,
  location,
  onLocationChange,
}: Props) {
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<ClientAddress[]>([]);
  const [clientFound, setClientFound] = useState(false);
  const [addingNewAddress, setAddingNewAddress] = useState(false);
  const phoneDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [subStep, setSubStep] = useState<SubStep>("personal");
  const [subStepAttempted, setSubStepAttempted] = useState(false);
  const sectionTopRef = useRef<HTMLDivElement | null>(null);
  const prevSubStepRef = useRef<SubStep>("personal");

  const visibleSubSteps: SubStep[] = deliverySectionEnabled ? ["personal", "entrega", "pago"] : ["personal", "pago"];
  const effectiveSubStep: SubStep = subStep === "entrega" && !deliverySectionEnabled ? "pago" : subStep;
  const subStepPosition = visibleSubSteps.indexOf(effectiveSubStep) + 1;
  const showFieldErrors = showErrors || subStepAttempted;

  // Buscar cliente cuando cambia el teléfono
  useEffect(() => {
    if (phoneDebounceRef.current) clearTimeout(phoneDebounceRef.current);

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 7) {
      setSavedAddresses([]);
      setClientFound(false);
      return;
    }

    phoneDebounceRef.current = setTimeout(async () => {
      const client = await ClientService.getClientByPhone(cleanPhone);
      if (client) {
        setClientFound(true);
        setSavedAddresses(client.direcciones || []);
        if (!name.trim() && client.nombres) {
          setName(client.nombres);
        }
        if (!birthday && client.fechaNacimiento) {
          setBirthday(`2000-${client.fechaNacimiento}`);
        }
        if (!email.trim() && client.correo) {
          setEmail(client.correo);
        }
      } else {
        setClientFound(false);
        setSavedAddresses([]);
      }
    }, 600);

    return () => {
      if (phoneDebounceRef.current) clearTimeout(phoneDebounceRef.current);
    };
  }, [phone]);

  const handleShareLocation = useCallback(async () => {
    setLocationLoading(true);
    setLocationError(null);
    try {
      const loc = await LocationService.getCurrentLocation();
      const mapsLink = LocationService.generateMapsLink(loc);
      onLocationChange({ lat: loc.lat, lng: loc.lng, accuracy: loc.accuracy, mapsLink, timestamp: loc.timestamp });
    } catch (err: any) {
      setLocationError(err?.message || "No se pudo obtener la ubicación");
    } finally {
      setLocationLoading(false);
    }
  }, [onLocationChange]);

  const handleRemoveLocation = useCallback(() => {
    onLocationChange(null);
    setLocationError(null);
  }, [onLocationChange]);

  // Si el usuario cambia el tipo de servicio y deja de aplicar domicilio
  // mientras está en ese sub-paso, lo mandamos directo a pago.
  useEffect(() => {
    if (!deliverySectionEnabled && subStep === "entrega") {
      setSubStep("pago");
    }
  }, [deliverySectionEnabled, subStep]);

  // Scroll hacia el inicio de la sección cada vez que cambia el sub-paso,
  // para que se sienta como pasar a otra página.
  useEffect(() => {
    if (prevSubStepRef.current === effectiveSubStep) return;
    prevSubStepRef.current = effectiveSubStep;
    const timeout = window.setTimeout(() => {
      sectionTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
    }, 60);
    return () => window.clearTimeout(timeout);
  }, [effectiveSubStep]);

  // Si el error que originó el intento de avanzar ya se corrigió, ocultamos el aviso.
  useEffect(() => {
    if (!subStepAttempted) return;
    if (effectiveSubStep === "personal" && !errors.name && !errors.phone) setSubStepAttempted(false);
    if (effectiveSubStep === "entrega" && !errors.barrio && !errors.address) setSubStepAttempted(false);
  }, [errors, subStepAttempted, effectiveSubStep]);

  const goNextSubStep = () => {
    if (effectiveSubStep === "personal") {
      if (errors.name || errors.phone) {
        setSubStepAttempted(true);
        const fieldId = errors.name ? "customer-name" : "customer-phone";
        window.setTimeout(() => {
          const element = document.getElementById(fieldId);
          element?.focus({ preventScroll: true });
          element?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 0);
        return;
      }
      setSubStepAttempted(false);
      setSubStep(deliverySectionEnabled ? "entrega" : "pago");
      return;
    }
    if (effectiveSubStep === "entrega") {
      if (errors.barrio || errors.address) {
        setSubStepAttempted(true);
        const fieldId = errors.barrio ? "customer-barrio-search" : "customer-address";
        window.setTimeout(() => {
          const element = document.getElementById(fieldId);
          element?.focus({ preventScroll: true });
          element?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 0);
        return;
      }
      setSubStepAttempted(false);
      setSubStep("pago");
    }
  };

  const goBackSubStep = () => {
    setSubStepAttempted(false);
    if (effectiveSubStep === "pago") {
      setSubStep(deliverySectionEnabled ? "entrega" : "personal");
      return;
    }
    if (effectiveSubStep === "entrega") {
      setSubStep("personal");
    }
  };

  useEffect(() => {
    if (!focusRequest) return;

    const fieldToSubStep: Record<CustomerInfoField, SubStep> = {
      name: "personal",
      phone: "personal",
      barrio: "entrega",
      address: "entrega",
    };
    const targetSubStep = fieldToSubStep[focusRequest.field];
    const needsSwitch = targetSubStep !== effectiveSubStep;
    if (needsSwitch) {
      setSubStepAttempted(false);
      setSubStep(targetSubStep);
    }

    const fieldToId: Record<CustomerInfoField, string> = {
      name: "customer-name",
      phone: "customer-phone",
      barrio: "customer-barrio-search",
      address: "customer-address",
    };

    const timeout = window.setTimeout(() => {
      const element = document.getElementById(fieldToId[focusRequest.field]);
      if (element instanceof HTMLElement) {
        element.focus({ preventScroll: true });
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      onFocusRequestConsumed();
    }, needsSwitch ? 120 : 0);

    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRequest, onFocusRequestConsumed]);

  const hasErrors = Object.values(errors).some(Boolean);

  const labelClass = (errored: boolean) =>
    `text-[10px] font-bold uppercase tracking-wider sm:text-[11px] ${errored ? "text-red-600" : "text-gray-500"}`;

  const inputClass = (errored: boolean) =>
    [
      "mt-1.5 w-full rounded-lg border bg-white px-3 py-2.5 text-base sm:text-sm outline-none transition",
      errored
        ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200"
        : "border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200",
    ].join(" ");

  return (
    <section ref={sectionTopRef} className="scroll-mt-24 pt-0 sm:pt-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-900">Datos y envío</h2>
        <p className="mt-1 text-sm text-gray-500">
          Completa tus datos para que podamos contactarte y entregar sin contratiempos.
        </p>
      </div>

      {/* Progreso del sub-paso actual */}
      <div className="flex items-center gap-3">
        <div className="flex flex-1 items-center gap-1.5">
          {visibleSubSteps.map((s, i) => (
            <div
              key={s}
              className={[
                "h-1.5 flex-1 rounded-full transition-colors",
                i <= subStepPosition - 1 ? "bg-rojo" : "bg-gray-200",
              ].join(" ")}
            />
          ))}
        </div>
        <span className="shrink-0 text-[11px] font-medium text-gray-400">
          Paso {subStepPosition} de {visibleSubSteps.length}
        </span>
      </div>

      {showFieldErrors && hasErrors ? (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          <X size={16} className="shrink-0" />
          Completa los campos marcados para continuar.
        </div>
      ) : null}

      {effectiveSubStep === "personal" ? (
        <>
          {/* Datos personales */}
          <div className="border-t border-gray-200 pt-5">
            <StepHeader n={1}>Tus datos personales</StepHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="customer-name" className={labelClass(showFieldErrors && errors.name)}>
                  <User size={12} className="inline mr-1 -mt-0.5" />Nombre
                </label>
                <input
                  id="customer-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass(showFieldErrors && errors.name)}
                  placeholder="Tu nombre completo"
                />
                {showFieldErrors && errors.name ? (
                  <p className="mt-1 text-xs font-medium text-red-600">Falta ingresar tu nombre.</p>
                ) : null}
              </div>
              <div>
                <label htmlFor="customer-phone" className={labelClass(showFieldErrors && errors.phone)}>
                  <Phone size={12} className="inline mr-1 -mt-0.5" />Teléfono
                </label>
                <input
                  id="customer-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClass(showFieldErrors && errors.phone)}
                  placeholder="3xx xxx xxxx"
                />
                {showFieldErrors && errors.phone ? (
                  <p className="mt-1 text-xs font-medium text-red-600">Falta ingresar tu teléfono.</p>
                ) : null}
                {clientFound && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-rojo font-medium">
                    <CheckCircle2 size={12} />
                    Cliente registrado
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="customer-birthday" className="text-[10px] font-bold uppercase tracking-wider text-gray-500 sm:text-[11px]">
                  <Cake size={12} className="inline mr-1 -mt-0.5" />Cumpleaños (opcional)
                </label>
                <input
                  id="customer-birthday"
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  className={inputClass(false)}
                />
                {isBirthdayToday(toBirthdayKey(birthday)) && (
                  <div className="mt-2 rounded-lg border border-rojo/30 bg-rojo-light p-3">
                    <div className="flex items-center gap-1.5 text-[11px] text-rojo font-bold">
                      🎂 ¡Feliz cumpleaños! Tienes un descuento especial esperándote.
                    </div>
                    <p className="mt-1.5 text-[10px] text-rojo/80">
                      Para reclamarlo, envíanos por WhatsApp una foto de tu cédula que coincida con el nombre de este pedido. Lo confirmamos por ahí.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="customer-email" className="text-[10px] font-bold uppercase tracking-wider text-gray-500 sm:text-[11px]">
                  <Mail size={12} className="inline mr-1 -mt-0.5" />Correo (opcional)
                </label>
                <input
                  id="customer-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass(false)}
                  placeholder="tucorreo@ejemplo.com"
                />
              </div>
            </div>
          </div>

          {/* Tipo de servicio */}
          <div className="border-t border-gray-200 pt-5">
            <StepHeader n={2}>¿Cómo quieres recibirlo?</StepHeader>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setService("llevar")}
                aria-pressed={service === "llevar"}
                className={[
                  "relative rounded-xl border-2 px-4 py-4 text-left transition-all",
                  service === "llevar"
                    ? "border-rojo bg-rojo-light shadow-sm"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
                ].join(" ")}
              >
                {service === "llevar" && (
                  <CheckCircle2 size={16} className="absolute top-3 right-3 text-rojo" />
                )}
                <Store size={20} className={service === "llevar" ? "text-rojo" : "text-gray-400"} />
                <div className="mt-2 text-sm font-bold text-gray-900">Para llevar</div>
                <div className="mt-0.5 text-xs text-gray-500">Recoges en el punto acordado</div>
              </button>

              <button
                type="button"
                onClick={() => setService("domicilio")}
                aria-pressed={service === "domicilio"}
                className={[
                  "relative rounded-xl border-2 px-4 py-4 text-left transition-all",
                  service === "domicilio"
                    ? "border-rojo bg-rojo-light shadow-sm"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
                ].join(" ")}
              >
                {service === "domicilio" && (
                  <CheckCircle2 size={16} className="absolute top-3 right-3 text-rojo" />
                )}
                <Truck size={20} className={service === "domicilio" ? "text-rojo" : "text-gray-400"} />
                <div className="mt-2 text-sm font-bold text-gray-900">Domicilio</div>
                <div className="mt-0.5 text-xs text-gray-500">Te lo llevamos a tu barrio</div>
              </button>

              <button
                type="button"
                onClick={() => setService("local")}
                aria-pressed={service === "local"}
                className={[
                  "relative rounded-xl border-2 px-4 py-4 text-left transition-all",
                  service === "local"
                    ? "border-rojo bg-rojo-light shadow-sm"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
                ].join(" ")}
              >
                {service === "local" && (
                  <CheckCircle2 size={16} className="absolute top-3 right-3 text-rojo" />
                )}
                <Store size={20} className={service === "local" ? "text-rojo" : "text-gray-400"} />
                <div className="mt-2 text-sm font-bold text-gray-900">En el local</div>
                <div className="mt-0.5 text-xs text-gray-500">Consumes en nuestro local</div>
              </button>
            </div>
          </div>

          <NextButton onClick={goNextSubStep} />
        </>
      ) : null}

      {effectiveSubStep === "entrega" ? (
        <>
          {/* Sección domicilio */}
          <div className="border-t border-gray-200 pt-5 space-y-5">
            <StepHeader n={3}>¿A dónde lo llevamos?</StepHeader>

            {/* Direcciones guardadas - se muestran PRIMERO */}
            {savedAddresses.length > 0 && !addingNewAddress && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-rojo-light">
                    <MapPin size={14} className="text-rojo" />
                  </div>
                  <label className="text-sm font-bold text-gray-900">
                    Direcciones guardadas
                  </label>
                </div>
                <div className="mt-1.5 space-y-2">
                  {savedAddresses.map((addr, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setAddress(addr.direccion);
                        if (addr.referencia) setReference(addr.referencia);
                        if (addr.barrio) {
                          const matchedBarrio = filteredBarrios.find(b => b.name === addr.barrio)
                            || [...filteredBarrios, ...[]].find(b => b.name === addr.barrio);
                          if (matchedBarrio) {
                            setBarrio(matchedBarrio);
                          } else {
                            const found = filteredBarrios.find(b => b.name.toLowerCase() === addr.barrio!.toLowerCase());
                            if (found) setBarrio(found);
                          }
                        }
                        setAddingNewAddress(false);
                      }}
                      className={[
                        "w-full rounded-lg border px-3 py-3 text-left transition-all",
                        address === addr.direccion
                          ? "border-rojo bg-rojo-light shadow-sm"
                          : "border-gray-200 bg-white hover:border-gray-300",
                      ].join(" ")}
                    >
                      <div className="flex items-start gap-2.5">
                        <MapPin size={14} className={address === addr.direccion ? "text-rojo shrink-0 mt-0.5" : "text-gray-400 shrink-0 mt-0.5"} />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-900 text-sm">{addr.direccion}</div>
                          <div className="flex items-center gap-2 mt-1">
                            {addr.barrio && (
                              <span className={[
                                "text-[11px] font-medium px-2 py-0.5 rounded-full",
                                address === addr.direccion ? "bg-white text-rojo" : "bg-gray-100 text-gray-500",
                              ].join(" ")}>{addr.barrio}</span>
                            )}
                            {addr.referencia && (
                              <span className="text-[11px] text-gray-400 truncate">Ref: {addr.referencia}</span>
                            )}
                          </div>
                        </div>
                        {address === addr.direccion && (
                          <CheckCircle2 size={16} className="text-rojo shrink-0 mt-0.5" />
                        )}
                      </div>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => { setAddress(""); setReference(""); setBarrio(null); setAddingNewAddress(true); }}
                    className="inline-flex items-center gap-2 text-sm font-bold text-rojo hover:text-rojo-dark mt-2 transition-colors"
                  >
                    <Plus size={16} /> Agregar nueva dirección
                  </button>
                </div>
              </div>
            )}

            {/* Barrio - solo se muestra si NO hay direcciones guardadas o si está agregando nueva */}
            {(savedAddresses.length === 0 || addingNewAddress) && (
            <div>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <label htmlFor="customer-barrio-search" className={labelClass(showFieldErrors && errors.barrio)}>
                  <MapPin size={12} className="inline mr-1 -mt-0.5" />Barrio
                </label>
                <span className="text-[11px] text-gray-400">
                  Si no encuentras tu barrio, elige uno cercano.
                </span>
              </div>

              <div
                className={[
                  "mt-2 rounded-xl border p-3",
                  showFieldErrors && errors.barrio ? "border-red-300 bg-red-50/30" : "border-gray-200 bg-gray-50",
                ].join(" ")}
              >
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="customer-barrio-search"
                    value={barrioQuery}
                    onChange={(e) => setBarrioQuery(e.target.value)}
                    className={[
                      "w-full rounded-lg border bg-white pl-9 pr-3 py-2.5 text-base sm:text-sm text-black outline-none transition",
                      showFieldErrors && errors.barrio
                        ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                        : "border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200",
                    ].join(" ")}
                    placeholder="Buscar barrio..."
                  />
                </div>

                <div className="mt-2 flex gap-2">
                  {barrio ? (
                    <button
                      type="button"
                      onClick={() => setBarrio(null)}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition"
                    >
                      <X size={12} /> Quitar
                    </button>
                  ) : null}
                  {barrioQuery ? (
                    <button
                      type="button"
                      onClick={() => setBarrioQuery("")}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition"
                    >
                      Ver todos
                    </button>
                  ) : null}
                </div>

                <div className="mt-2 max-h-52 space-y-1.5 overflow-y-auto">
                  {filteredBarrios.length ? (
                    filteredBarrios.map((b) => {
                      const selected = barrio?.id === b.id;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setBarrio(b)}
                          className={[
                            "w-full rounded-lg border px-3 py-2.5 text-left text-sm transition-all",
                            selected
                              ? "border-gray-900 bg-white text-black shadow-sm"
                              : "border-gray-100 bg-white text-gray-700 hover:border-gray-300 hover:shadow-sm",
                          ].join(" ")}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-medium">{b.name}</span>
                            <span className={`text-xs font-semibold ${selected ? "text-gray-900" : "text-gray-400"}`}>
                              {b.price == null ? "Por confirmar" : cop(b.price)}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-600">
                      No encontramos ese barrio. Verifica la ortografía o elige uno cercano.
                    </div>
                  )}
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400">
                  <span>{filteredBarrios.length}/{totalBarrios} barrios</span>
                  {barrio ? (
                    <span className="flex items-center gap-1 font-medium text-gray-700">
                      <CheckCircle2 size={12} className="text-rojo" /> {barrio.name}
                    </span>
                  ) : (
                    <span>Sin barrio seleccionado</span>
                  )}
                </div>
              </div>

              {/* Botón para volver a direcciones guardadas */}
              {showFieldErrors && errors.barrio ? (
                <p className="mt-1 text-xs font-medium text-red-600">Falta seleccionar tu barrio.</p>
              ) : null}

              {savedAddresses.length > 0 && addingNewAddress && (
                <button
                  type="button"
                  onClick={() => setAddingNewAddress(false)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 mt-2"
                >
                  <History size={12} /> Usar dirección guardada
                </button>
              )}
            </div>
            )}

            {/* Dirección y referencia - solo si no hay guardadas o está agregando nueva */}
            {(savedAddresses.length === 0 || addingNewAddress) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="customer-address" className={labelClass(showFieldErrors && errors.address)}>
                  <MapPin size={12} className="inline mr-1 -mt-0.5" />Dirección
                </label>
                <input
                  id="customer-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={inputClass(showFieldErrors && errors.address)}
                  placeholder="Cra 7 # 12-34"
                />
                {showFieldErrors && errors.address ? (
                  <p className="mt-1 text-xs font-medium text-red-600">Falta ingresar tu dirección.</p>
                ) : null}
              </div>

              <div>
                <label htmlFor="customer-reference" className="text-[10px] font-bold uppercase tracking-wider text-gray-500 sm:text-[11px]">
                  Referencia (opcional)
                </label>
                <input
                  id="customer-reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-base sm:text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
                  placeholder="Portón negro, edificio azul..."
                />
              </div>
            </div>
            )}

            {/* Ubicación */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 sm:text-[11px]">
                <Navigation size={12} className="inline mr-1 -mt-0.5" />Ubicación (opcional)
              </label>
              <p className="mt-0.5 text-[11px] text-gray-400">
                Comparte tu ubicación para que lleguemos más rápido.
              </p>

              {!location ? (
                <button
                  type="button"
                  onClick={handleShareLocation}
                  disabled={locationLoading}
                  className={[
                    "mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl border text-xs font-bold transition-all active:scale-[0.98]",
                    locationLoading
                      ? "border-gray-200 text-gray-300 cursor-wait"
                      : "border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:border-blue-300",
                  ].join(" ")}
                >
                  {locationLoading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400/30 border-t-blue-400" />
                      Obteniendo ubicación...
                    </>
                  ) : (
                    <>
                      <Navigation size={14} />
                      Compartir mi ubicación
                    </>
                  )}
                </button>
              ) : (
                <div className="mt-2 rounded-xl border border-rojo bg-rojo-light p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-rojo">
                      <CheckCircle2 size={14} />
                      Ubicación compartida
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveLocation}
                      className="flex items-center gap-1 text-[11px] font-medium text-gray-400 hover:text-gray-700 transition"
                    >
                      <X size={12} /> Quitar
                    </button>
                  </div>

                  {location.accuracy && (
                    <div className="mt-1.5 text-[11px] text-gray-500">
                      Precisión: ~{Math.round(location.accuracy)}m
                    </div>
                  )}

                  <a
                    href={location.mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-bold text-gray-700 transition hover:bg-gray-50"
                  >
                    <ExternalLink size={12} />
                    Ver en Google Maps
                  </a>
                </div>
              )}

              {locationError ? (
                <div className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-600">
                  {locationError}
                </div>
              ) : null}
            </div>
          </div>

          <BackNextButtons onBack={goBackSubStep} onNext={goNextSubStep} />
        </>
      ) : null}

      {effectiveSubStep === "pago" ? (
        <>
          {/* Pago */}
          <div className="border-t border-gray-200 pt-5">
            <div className="flex items-center justify-between gap-3">
              <StepHeader n={4}>¿Cómo vas a pagar?</StepHeader>
              <div className="mb-4 shrink-0 text-[11px] text-gray-400">
                Nequi: <span className="font-bold text-gray-700">{nequiPhone}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod("Transferencia")}
                className={[
                  "relative flex items-center gap-2 rounded-xl border-2 px-4 py-3 text-left transition-all",
                  paymentMethod === "Transferencia"
                    ? "border-rojo bg-rojo-light shadow-sm"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
                ].join(" ")}
              >
                {paymentMethod === "Transferencia" && (
                  <CheckCircle2 size={14} className="absolute top-2 right-2 text-rojo" />
                )}
                <CreditCard size={16} className={paymentMethod === "Transferencia" ? "text-rojo" : "text-gray-400"} />
                <span className="text-sm font-medium">Transferencia</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("Efectivo")}
                className={[
                  "relative flex items-center gap-2 rounded-xl border-2 px-4 py-3 text-left transition-all",
                  paymentMethod === "Efectivo"
                    ? "border-rojo bg-rojo-light shadow-sm"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
                ].join(" ")}
              >
                {paymentMethod === "Efectivo" && (
                  <CheckCircle2 size={14} className="absolute top-2 right-2 text-rojo" />
                )}
                <Banknote size={16} className={paymentMethod === "Efectivo" ? "text-rojo" : "text-gray-400"} />
                <span className="text-sm font-medium">Efectivo</span>
              </button>
            </div>

            <div className="mt-4">
              <label htmlFor="comments" className="text-[10px] font-bold uppercase tracking-wider text-gray-500 sm:text-[11px]">
                <MessageSquare size={12} className="inline mr-1 -mt-0.5" />Comentarios (opcional)
              </label>
              <textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-base sm:text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200 resize-none"
                rows={3}
                placeholder="Instrucciones especiales, alergias, etc."
                aria-label="Comentarios adicionales (opcional)"
              />
            </div>
          </div>

          <BackNextButtons onBack={goBackSubStep} onNext={onComplete} />
        </>
      ) : null}
    </section>
  );
}
