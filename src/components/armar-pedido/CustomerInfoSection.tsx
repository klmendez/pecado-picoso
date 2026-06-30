import { useEffect, useState, useCallback, useRef } from "react";
import { User, Phone, MapPin, Truck, Store, CreditCard, Banknote, MessageSquare, Navigation, X, CheckCircle2, Search, ExternalLink, History, Plus } from "lucide-react";

import type { Barrio } from "../../data/barrios";
import type { PaymentMethod, Service } from "../../lib/whatsapp";
import { cop } from "../../lib/format";
import { LocationService } from "../../services/locationService";
import { ClientService, type ClientAddress } from "../../services/clientService";

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

type Props = {
  name: string;
  phone: string;
  setName: (value: string) => void;
  setPhone: (value: string) => void;
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
  location: LocationState;
  onLocationChange: (loc: LocationState) => void;
};

export default function CustomerInfoSection({
  name,
  phone,
  setName,
  setPhone,
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
  location,
  onLocationChange,
}: Props) {
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<ClientAddress[]>([]);
  const [clientFound, setClientFound] = useState(false);
  const [addingNewAddress, setAddingNewAddress] = useState(false);
  const phoneDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  useEffect(() => {
    if (!focusRequest) return;

    const fieldToId: Record<CustomerInfoField, string> = {
      name: "customer-name",
      phone: "customer-phone",
      barrio: "customer-barrio-search",
      address: "customer-address",
    };

    const element = document.getElementById(fieldToId[focusRequest.field]);
    if (element instanceof HTMLElement) {
      element.focus({ preventScroll: true });
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    onFocusRequestConsumed();
  }, [focusRequest, onFocusRequestConsumed]);

  const hasErrors = Object.values(errors).some(Boolean);

  const labelClass = (errored: boolean) =>
    `text-[10px] font-bold uppercase tracking-wider sm:text-[11px] ${errored ? "text-red-600" : "text-gray-500"}`;

  const inputClass = (errored: boolean) =>
    [
      "mt-1.5 w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none transition",
      errored
        ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200"
        : "border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200",
    ].join(" ");

  return (
    <section className="pt-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-900">Datos y envío</h2>
        <p className="mt-1 text-sm text-gray-500">
          Completa tus datos para que podamos contactarte y entregar sin contratiempos.
        </p>
      </div>

      {showErrors && hasErrors ? (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          <X size={16} className="shrink-0" />
          Completa los campos marcados para continuar.
        </div>
      ) : null}

      {/* Datos personales */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900">
            <User size={14} className="text-white" />
          </div>
          <h3 className="text-sm font-bold text-gray-900">Datos personales</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="customer-name" className={labelClass(showErrors && errors.name)}>
              <User size={12} className="inline mr-1 -mt-0.5" />Nombre
            </label>
            <input
              id="customer-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass(showErrors && errors.name)}
              placeholder="Tu nombre completo"
            />
          </div>
          <div>
            <label htmlFor="customer-phone" className={labelClass(showErrors && errors.phone)}>
              <Phone size={12} className="inline mr-1 -mt-0.5" />Teléfono
            </label>
            <input
              id="customer-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass(showErrors && errors.phone)}
              placeholder="3xx xxx xxxx"
            />
            {clientFound && (
              <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
                <CheckCircle2 size={12} />
                Cliente registrado
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tipo de servicio */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900">
            <Truck size={14} className="text-white" />
          </div>
          <h3 className="text-sm font-bold text-gray-900">Tipo de servicio</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setService("llevar")}
            aria-pressed={service === "llevar"}
            className={[
              "relative rounded-xl border-2 px-4 py-4 text-left transition-all",
              service === "llevar"
                ? "border-gray-900 bg-gray-50 shadow-sm"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
            ].join(" ")}
          >
            {service === "llevar" && (
              <CheckCircle2 size={16} className="absolute top-3 right-3 text-gray-900" />
            )}
            <Store size={20} className={service === "llevar" ? "text-gray-900" : "text-gray-400"} />
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
                ? "border-gray-900 bg-gray-50 shadow-sm"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
            ].join(" ")}
          >
            {service === "domicilio" && (
              <CheckCircle2 size={16} className="absolute top-3 right-3 text-gray-900" />
            )}
            <Truck size={20} className={service === "domicilio" ? "text-gray-900" : "text-gray-400"} />
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
                ? "border-gray-900 bg-gray-50 shadow-sm"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
            ].join(" ")}
          >
            {service === "local" && (
              <CheckCircle2 size={16} className="absolute top-3 right-3 text-gray-900" />
            )}
            <Store size={20} className={service === "local" ? "text-gray-900" : "text-gray-400"} />
            <div className="mt-2 text-sm font-bold text-gray-900">En el local</div>
            <div className="mt-0.5 text-xs text-gray-500">Consumes en nuestro local</div>
          </button>
        </div>
      </div>

      {/* Sección domicilio */}
      {deliverySectionEnabled ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900">
              <MapPin size={14} className="text-white" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">Datos de entrega</h3>
          </div>

          {/* Direcciones guardadas - se muestran PRIMERO */}
          {savedAddresses.length > 0 && !addingNewAddress && (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 sm:text-[11px]">
                <History size={12} className="inline mr-1 -mt-0.5" />Direcciones guardadas
              </label>
              <div className="mt-1.5 space-y-1.5">
                {savedAddresses.map((addr, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setAddress(addr.direccion);
                      if (addr.referencia) setReference(addr.referencia);
                      // Auto-seleccionar el barrio guardado
                      if (addr.barrio) {
                        const matchedBarrio = filteredBarrios.find(b => b.name === addr.barrio)
                          || [...filteredBarrios, ...[]].find(b => b.name === addr.barrio);
                        if (matchedBarrio) {
                          setBarrio(matchedBarrio);
                        } else {
                          // Buscar en todos los barrios disponibles
                          const found = filteredBarrios.find(b => b.name.toLowerCase() === addr.barrio!.toLowerCase());
                          if (found) setBarrio(found);
                        }
                      }
                      setAddingNewAddress(false);
                    }}
                    className={[
                      "w-full rounded-lg border px-3 py-2.5 text-left text-sm transition-all",
                      address === addr.direccion
                        ? "border-gray-900 bg-gray-50 shadow-sm"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-gray-800">{addr.direccion}</span>
                      {addr.barrio && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{addr.barrio}</span>
                      )}
                    </div>
                    {addr.referencia && (
                      <div className="text-[11px] text-gray-400 mt-0.5">Ref: {addr.referencia}</div>
                    )}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => { setAddress(""); setReference(""); setBarrio(null); setAddingNewAddress(true); }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 mt-1"
                >
                  <Plus size={12} /> Agregar nueva dirección
                </button>
              </div>
            </div>
          )}

          {/* Barrio - solo se muestra si NO hay direcciones guardadas o si está agregando nueva */}
          {(savedAddresses.length === 0 || addingNewAddress) && (
          <div>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <label htmlFor="customer-barrio-search" className={labelClass(showErrors && errors.barrio)}>
                <MapPin size={12} className="inline mr-1 -mt-0.5" />Barrio
              </label>
              <span className="text-[11px] text-gray-400">
                Si no encuentras tu barrio, elige uno cercano.
              </span>
            </div>

            <div
              className={[
                "mt-2 rounded-xl border p-3",
                showErrors && errors.barrio ? "border-red-300 bg-red-50/30" : "border-gray-200 bg-gray-50",
              ].join(" ")}
            >
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="customer-barrio-search"
                  value={barrioQuery}
                  onChange={(e) => setBarrioQuery(e.target.value)}
                  className={[
                    "w-full rounded-lg border bg-white pl-9 pr-3 py-2.5 text-sm text-black outline-none transition",
                    showErrors && errors.barrio
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
                    <CheckCircle2 size={12} className="text-emerald-500" /> {barrio.name}
                  </span>
                ) : (
                  <span>Sin barrio seleccionado</span>
                )}
              </div>
            </div>

            {/* Botón para volver a direcciones guardadas */}
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

          {/* Dirección y referencia */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="customer-address" className={labelClass(showErrors && errors.address)}>
                <MapPin size={12} className="inline mr-1 -mt-0.5" />Dirección
              </label>
              <input
                id="customer-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={inputClass(showErrors && errors.address)}
                placeholder="Cra 7 # 12-34"
              />
            </div>

            <div>
              <label htmlFor="customer-reference" className="text-[10px] font-bold uppercase tracking-wider text-gray-500 sm:text-[11px]">
                Referencia (opcional)
              </label>
              <input
                id="customer-reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
                placeholder="Portón negro, edificio azul..."
              />
            </div>
          </div>

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
              <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
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
      ) : null}

      {/* Pago */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900">
              <CreditCard size={14} className="text-white" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">Pago</h3>
          </div>
          <div className="text-[11px] text-gray-400">
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
                ? "border-gray-900 bg-gray-50 shadow-sm"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
            ].join(" ")}
          >
            {paymentMethod === "Transferencia" && (
              <CheckCircle2 size={14} className="absolute top-2 right-2 text-gray-900" />
            )}
            <CreditCard size={16} className={paymentMethod === "Transferencia" ? "text-gray-900" : "text-gray-400"} />
            <span className="text-sm font-medium">Transferencia</span>
          </button>

          <button
            type="button"
            onClick={() => setPaymentMethod("Efectivo")}
            className={[
              "relative flex items-center gap-2 rounded-xl border-2 px-4 py-3 text-left transition-all",
              paymentMethod === "Efectivo"
                ? "border-gray-900 bg-gray-50 shadow-sm"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
            ].join(" ")}
          >
            {paymentMethod === "Efectivo" && (
              <CheckCircle2 size={14} className="absolute top-2 right-2 text-gray-900" />
            )}
            <Banknote size={16} className={paymentMethod === "Efectivo" ? "text-gray-900" : "text-gray-400"} />
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
            className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-200 resize-none"
            rows={3}
            placeholder="Instrucciones especiales, alergias, etc."
            aria-label="Comentarios adicionales (opcional)"
          />
        </div>
      </div>
    </section>
  );
}
