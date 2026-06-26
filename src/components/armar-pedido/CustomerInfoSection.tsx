import { useEffect, useState, useCallback } from "react";

import type { Barrio } from "../../data/barrios";
import type { PaymentMethod, Service } from "../../lib/whatsapp";
import { cop } from "../../lib/format";
import { LocationService } from "../../services/locationService";

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
    `text-[10px] font-black uppercase tracking-[0.12em] sm:text-[11px] ${errored ? "text-red-600" : "text-gray-500"}`;

  const inputClass = (errored: boolean) =>
    [
      "mt-1 w-full border bg-transparent px-3 py-2 text-[13px] outline-none sm:text-sm",
      errored
        ? "border-red-500/70 focus:border-red-400/80 focus:ring-2 focus:ring-red-500/30"
        : "border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200",
    ].join(" ");

  return (
    <section className="border-t border-gray-200 pt-6">
      <div className="text-[13px] font-black uppercase tracking-[0.16em] text-gray-700 sm:text-sm sm:tracking-[0.18em]">
        3) Datos y envío
      </div>

      <div className="mt-1 text-[11px] leading-relaxed text-gray-500 sm:text-xs">
        Elige si quieres que llevemos tu pedido a domicilio o si prefieres recogerlo tú.
        Completa luego tus datos para que podamos contactarte y entregar sin contratiempos.
      </div>

      {showErrors && hasErrors ? (
        <div className="mt-3 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">
          Llena estos datos para continuar.
        </div>
      ) : null}

      <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3">
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="customer-name" className={labelClass(showErrors && errors.name)}>Nombre</label>
          <input
            id="customer-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass(showErrors && errors.name)}
            placeholder="Tu nombre"
          />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="customer-phone" className={labelClass(showErrors && errors.phone)}>Teléfono</label>
          <input
            id="customer-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass(showErrors && errors.phone)}
            placeholder="+57 3xx xxx xxxx"
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setService("llevar")}
          aria-pressed={service === "llevar"}
          className={[
            "border border-gray-200 px-3 py-3 text-left",
            service === "llevar" ? "text-black" : "text-gray-400 hover:text-black",
          ].join(" ")}
        >
          <div className="text-xs font-black">Para llevar</div>
          <div className="text-[11px] text-gray-400">Recoges tú en el punto acordado.</div>
        </button>

        <button
          type="button"
          onClick={() => setService("domicilio")}
          aria-pressed={service === "domicilio"}
          className={[
            "border border-gray-200 px-3 py-3 text-left",
            service === "domicilio" ? "text-black" : "text-gray-400 hover:text-black",
          ].join(" ")}
        >
          <div className="text-xs font-black">Domicilio</div>
          <div className="text-[11px] text-gray-400">Te lo llevamos a tu barrio (aplica costo de envío).</div>
        </button>
      </div>

      {deliverySectionEnabled ? (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <label htmlFor="customer-barrio-search" className={labelClass(showErrors && errors.barrio)}>Barrio</label>
              <span
                className={[
                  "text-[11px] text-gray-400 sm:text-xs",
                  showErrors && errors.barrio ? "text-red-600" : "",
                ].join(" ")}
              >
                Si no encuentras tu barrio, elige uno cercano o tu zona.
              </span>
            </div>
            <div
              className={[
                "mt-1 rounded-2xl border bg-gray-50 p-3",
                showErrors && errors.barrio ? "border-red-300" : "border-gray-300",
              ].join(" ")}
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  id="customer-barrio-search"
                  value={barrioQuery}
                  onChange={(e) => setBarrioQuery(e.target.value)}
                  className={[
                    "w-full rounded-xl border bg-gray-100 px-3 py-2 text-sm text-black outline-none",
                    showErrors && errors.barrio
                      ? "border-red-500/70 focus:border-red-400/80 focus:ring-2 focus:ring-red-500/30"
                      : "border-gray-200 focus:border-gray-400 focus:ring-2 focus:ring-gray-200",
                  ].join(" ")}
                  placeholder="Buscar barrio (ej: Centro, Campanario…)"
                />

                <div className="flex shrink-0 gap-2">
                  {barrio ? (
                    <button
                      type="button"
                      onClick={() => setBarrio(null)}
                      className="rounded-xl border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-500 hover:border-gray-400 hover:text-black"
                    >
                      Quitar selección
                    </button>
                  ) : null}
                  {barrioQuery ? (
                    <button
                      type="button"
                      onClick={() => setBarrioQuery("")}
                      className="rounded-xl border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-500 hover:border-gray-400 hover:text-black"
                    >
                      Ver todos
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="mt-3 max-h-64 space-y-1 overflow-y-auto pr-1">
                {filteredBarrios.length ? (
                  filteredBarrios.map((b) => {
                    const selected = barrio?.id === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setBarrio(b)}
                        className={[
                          "w-full rounded-xl border px-3 py-2 text-left text-sm transition",
                          selected
                            ? "border-gray-400 bg-gray-100 text-black"
                            : "border-gray-200 bg-gray-100 text-gray-700 hover:border-gray-300 hover:bg-gray-100 hover:text-black",
                        ].join(" ")}
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="font-semibold tracking-wide">{b.name}</span>
                          <span className="text-xs text-gray-500">{b.price == null ? "Por confirmar" : cop(b.price)}</span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-600">
                    No encontramos ese barrio. Verifica la ortografía o elige uno cercano a tu zona.
                  </div>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-400">
                <span>
                  {filteredBarrios.length}/{totalBarrios} barrios disponibles
                </span>
                <span>{barrio ? `Seleccionado: ${barrio.name}` : "Sin barrio seleccionado"}</span>
              </div>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label htmlFor="customer-address" className={labelClass(showErrors && errors.address)}>Dirección</label>
            <input
              id="customer-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={inputClass(showErrors && errors.address)}
              placeholder="Cra 7 # 12-34"
            />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label htmlFor="customer-reference" className="text-[11px] font-black text-gray-500">Referencia</label>
            <input
              id="customer-reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="mt-1 w-full border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
              placeholder="Portón negro…"
            />
          </div>

          {/* Ubicación en tiempo real */}
          <div className="col-span-2 mt-1">
            <label className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-500 sm:text-[11px]">
              Ubicación (Google Maps)
            </label>
            <div className="mt-1 text-[11px] text-gray-400">
              Comparte tu ubicación para que podamos llegar más rápido.
            </div>

            {!location ? (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={handleShareLocation}
                  disabled={locationLoading}
                  className={[
                    "flex h-11 w-full items-center justify-center gap-2 rounded-xl border text-xs font-black transition active:scale-[0.98]",
                    locationLoading
                      ? "border-gray-200 text-gray-300 cursor-wait"
                      : "border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-100",
                  ].join(" ")}
                >
                  {locationLoading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400/30 border-t-blue-400" />
                      Obteniendo ubicación…
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                      Compartir mi ubicación
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="mt-2 rounded-xl border border-emerald-300 bg-emerald-50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                    Ubicación compartida
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveLocation}
                    className="text-[10px] font-bold text-gray-400 hover:text-gray-700"
                  >
                    Quitar
                  </button>
                </div>

                <div className="mt-2 text-[11px] text-gray-500">
                  {location.accuracy ? `Precisión: ~${Math.round(location.accuracy)}m` : "Ubicación obtenida"}
                </div>

                <a
                  href={location.mapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-gray-50 px-3 py-1.5 text-[11px] font-bold text-gray-700 transition hover:bg-gray-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
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

      <div className="mt-5 border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-black">Pago</div>
          <div className="text-[11px] text-gray-400">
            Nequi: <span className="font-black text-gray-700">{nequiPhone}</span>
          </div>
        </div>

        <label htmlFor="payment-method" className="sr-only">Método de pago</label>
        <select
          id="payment-method"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
          className="mt-2 w-full border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
          aria-label="Método de pago"
        >
          <option value="Transferencia">Transferencia</option>
          <option value="Efectivo">Efectivo</option>
        </select>

        <label htmlFor="comments" className="sr-only">Comentarios</label>
        <textarea
          id="comments"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          className="mt-2 w-full border border-gray-200 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
          rows={3}
          placeholder="Comentarios (opcional)"
          aria-label="Comentarios adicionales (opcional)"
        />
      </div>
    </section>
  );
}
