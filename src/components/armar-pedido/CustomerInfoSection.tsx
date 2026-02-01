import type { Barrio } from "../../data/barrios";
import type { PaymentMethod, Service } from "../../lib/whatsapp";
import { cop } from "../../lib/format";

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
}: Props) {
  return (
    <section className="border-t border-white/10 pt-6">
      <div className="text-sm font-black">3) Datos y envío</div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="col-span-2 sm:col-span-1">
          <label className="text-[11px] font-black text-white/70">Nombre</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
            placeholder="Tu nombre"
          />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="text-[11px] font-black text-white/70">Teléfono</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
            placeholder="+57 3xx xxx xxxx"
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setService("llevar")}
          className={[
            "border border-white/10 px-3 py-3 text-left",
            service === "llevar" ? "text-white" : "text-white/55 hover:text-white",
          ].join(" ")}
        >
          <div className="text-xs font-black">Para llevar</div>
          <div className="text-[11px] text-white/55">Recoges tú</div>
        </button>

        <button
          type="button"
          onClick={() => setService("domicilio")}
          className={[
            "border border-white/10 px-3 py-3 text-left",
            service === "domicilio" ? "text-white" : "text-white/55 hover:text-white",
          ].join(" ")}
        >
          <div className="text-xs font-black">Domicilio</div>
          <div className="text-[11px] text-white/55">Según barrio</div>
        </button>
      </div>

      {deliverySectionEnabled ? (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-[11px] font-black text-white/70">Barrio</label>
            <div className="mt-1 rounded-2xl border border-white/15 bg-white/[0.04] p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  value={barrioQuery}
                  onChange={(e) => setBarrioQuery(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20"
                  placeholder="Escribe para buscar (ej: Centro, Campanario…)"
                />

                <div className="flex shrink-0 gap-2">
                  {barrio ? (
                    <button
                      type="button"
                      onClick={() => setBarrio(null)}
                      className="rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-white/70 hover:border-white/40 hover:text-white"
                    >
                      Quitar selección
                    </button>
                  ) : null}
                  {barrioQuery ? (
                    <button
                      type="button"
                      onClick={() => setBarrioQuery("")}
                      className="rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-white/70 hover:border-white/40 hover:text-white"
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
                            ? "border-white/40 bg-white/15 text-white"
                            : "border-white/10 bg-black/40 text-white/80 hover:border-white/25 hover:bg-white/10 hover:text-white",
                        ].join(" ")}
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="font-semibold tracking-wide">{b.name}</span>
                          <span className="text-xs text-white/60">{b.price == null ? "Por confirmar" : cop(b.price)}</span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-3 text-sm text-red-200">
                    No encontramos ese barrio. Verifica la ortografía o selecciona "Otro barrio".
                  </div>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-white/55">
                <span>
                  {filteredBarrios.length}/{totalBarrios} barrios disponibles
                </span>
                <span>{barrio ? `Seleccionado: ${barrio.name}` : "Sin barrio seleccionado"}</span>
              </div>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="text-[11px] font-black text-white/70">Dirección</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-1 w-full border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
              placeholder="Cra 7 # 12-34"
            />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="text-[11px] font-black text-white/70">Referencia</label>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="mt-1 w-full border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
              placeholder="Portón negro…"
            />
          </div>
        </div>
      ) : null}

      <div className="mt-5 border-t border-white/10 pt-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-black">Pago</div>
          <div className="text-[11px] text-white/55">
            Nequi: <span className="font-black text-white/80">{nequiPhone}</span>
          </div>
        </div>

        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
          className="mt-2 w-full border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
        >
          <option value="Transferencia">Transferencia</option>
          <option value="Efectivo">Efectivo</option>
        </select>

        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          className="mt-2 w-full border border-white/10 bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
          rows={3}
          placeholder="Comentarios (opcional)"
        />
      </div>
    </section>
  );
}
