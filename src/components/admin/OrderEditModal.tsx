import { useState, useMemo } from 'react';
import { X, Save, Plus, Minus, Trash2, Pencil, Cake } from 'lucide-react';
import { deleteField } from 'firebase/firestore';
import { OrderService } from '../../services/orderService';
import type { PedidoFirestore, OrderStatus, PaymentDetail } from '../../types/order';
import type { AppliedPromotion } from '../../types/promotion';
import type { OrderItem, PaymentMethod, Service } from '../../lib/whatsapp';
import { cop } from '../../lib/format';
import { BARRIOS } from '../../data/barrios';
import type { Barrio } from '../../data/barrios';
import { EXTRAS } from '../../data/extras';
import { getBasePrice, extrasTotal, deliveryCost } from '../../lib/pricing';
import { getAvailableSizes, maxToppingsFor, labelSize, toppingsNames, extrasLine } from '../armar-pedido/utils';
import { BIRTHDAY_DISCOUNT_PERCENT } from '../../data/constants';
import { isBirthdayToday } from '../../lib/birthday';
import Toppings from '../Toppings';
import Referencias from '../Referencias';

interface OrderEditModalProps {
  order: PedidoFirestore & { id: string };
  onClose: () => void;
  onSave: () => void;
}

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'no_pagado', label: 'Sin Pagar' },
  { value: 'pagado', label: 'Pagado' },
  { value: 'preparando', label: 'Preparando' },
  { value: 'en_camino', label: 'En Camino' },
  { value: 'entregado', label: 'Entregado' },
  { value: 'cancelado', label: 'Cancelado' }
];

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'Transferencia', label: 'Transferencia' },
  { value: 'Efectivo', label: 'Efectivo' }
];

const SERVICE_OPTIONS: { value: Service; label: string }[] = [
  { value: 'domicilio', label: 'Domicilio' },
  { value: 'llevar', label: 'Para llevar' },
  { value: 'local', label: 'En el local' }
];

function lineTotal(item: OrderItem): number {
  const baseUnit = getBasePrice(
    item.product,
    item.product.category === 'gomitas' ? item.version : null,
    item.size,
  );
  const extrasUnit = extrasTotal(item.extrasQty ?? {}, EXTRAS);
  return (baseUnit + extrasUnit) * item.qty;
}

function baseLineTotal(item: OrderItem): number {
  const baseUnit = getBasePrice(
    item.product,
    item.product.category === 'gomitas' ? item.version : null,
    item.size,
  );
  return baseUnit * item.qty;
}

export default function OrderEditModal({ order, onClose, onSave }: OrderEditModalProps) {
  const [editedOrder, setEditedOrder] = useState({
    cliente: {
      nombres: order.cliente.nombres,
      celular: order.cliente.celular,
      direccion: order.cliente.direccion || '',
      barrio: order.cliente.barrio || '',
      mapsLink: order.cliente.mapsLink || ''
    },
    items: [...order.items],
    formaPago: order.formaPago,
    servicio: order.servicio,
    estado: order.estado,
    notaAdmin: order.notaAdmin || ''
  });

  const [selectedBarrio, setSelectedBarrio] = useState<Barrio | null>(
    BARRIOS.find(b => b.name === order.cliente.barrio) || null
  );
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [usarPagosMixtos, setUsarPagosMixtos] = useState(!!order.detallesPago);
  const [detallesPago, setDetallesPago] = useState<PaymentDetail[]>(
    order.detallesPago || [{ metodo: 'Efectivo', monto: order.total, entregadoDomiciliario: false }]
  );

  // Otras promociones (no la de cumpleaños) quedan fijas tal como se calcularon al crear el pedido.
  const otrosDescuentos = (order.promociones || []).filter(p => p.promoId !== 'birthday');
  const otrosDescuentosTotal = otrosDescuentos.reduce((sum, p) => sum + p.descuento, 0);

  const [aplicarDescuentoCumple, setAplicarDescuentoCumple] = useState(
    (order.promociones || []).some(p => p.promoId === 'birthday')
  );
  const [cedulaVerificada, setCedulaVerificada] = useState(order.cliente.cedula || '');

  const subtotal = useMemo(
    () => editedOrder.items.reduce((sum, item) => sum + lineTotal(item), 0),
    [editedOrder.items]
  );

  const baseSubtotal = useMemo(
    () => editedOrder.items.reduce((sum, item) => sum + baseLineTotal(item), 0),
    [editedOrder.items]
  );

  const descuentoCumpleMonto = aplicarDescuentoCumple
    ? Math.round(baseSubtotal * BIRTHDAY_DISCOUNT_PERCENT / 100)
    : 0;

  const descuentoTotal = otrosDescuentosTotal + descuentoCumpleMonto;

  const delivery = useMemo(
    () => deliveryCost(editedOrder.servicio, editedOrder.servicio === 'domicilio' ? selectedBarrio : null),
    [editedOrder.servicio, selectedBarrio]
  );

  const total = useMemo(
    () => Math.max(0, subtotal + delivery - descuentoTotal),
    [subtotal, delivery, descuentoTotal]
  );

  const updateItemField = (itemId: string, patch: Partial<OrderItem>) => {
    setEditedOrder(prev => ({
      ...prev,
      items: prev.items.map(item => (item.id === itemId ? { ...item, ...patch } : item))
    }));
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      setError('');

      // Validaciones básicas
      if (!editedOrder.cliente.nombres.trim()) {
        throw new Error('El nombre del cliente es obligatorio');
      }
      if (!editedOrder.cliente.celular.trim()) {
        throw new Error('El teléfono del cliente es obligatorio');
      }
      if (editedOrder.servicio === 'domicilio' && !editedOrder.cliente.direccion.trim()) {
        throw new Error('La dirección es obligatoria para domicilio');
      }
      if (editedOrder.servicio === 'domicilio' && !editedOrder.cliente.barrio.trim()) {
        throw new Error('El barrio es obligatorio para domicilio');
      }
      if (editedOrder.items.length === 0) {
        throw new Error('Debe haber al menos un producto');
      }
      if (aplicarDescuentoCumple && !cedulaVerificada.trim()) {
        throw new Error('Escribe la cédula que verificaste por WhatsApp para aplicar el descuento de cumpleaños');
      }

      const promociones: AppliedPromotion[] = [...otrosDescuentos];
      if (aplicarDescuentoCumple && descuentoCumpleMonto > 0) {
        promociones.push({
          promoId: 'birthday',
          nombre: `🎂 Descuento de cumpleaños (${BIRTHDAY_DISCOUNT_PERCENT}%, verificado)`,
          tipo: 'porcentaje',
          valor: BIRTHDAY_DISCOUNT_PERCENT,
          descuento: descuentoCumpleMonto,
        });
      }

      const updateData: any = {
        cliente: {
          ...editedOrder.cliente,
          ...(aplicarDescuentoCumple && cedulaVerificada.trim() ? { cedula: cedulaVerificada.trim() } : {}),
        },
        items: editedOrder.items,
        formaPago: editedOrder.formaPago,
        servicio: editedOrder.servicio,
        estado: editedOrder.estado,
        notaAdmin: editedOrder.notaAdmin,
        subtotal,
        delivery,
        total,
        promociones: promociones.length > 0 ? promociones : deleteField(),
        descuentoTotal: descuentoTotal > 0 ? descuentoTotal : deleteField(),
      };
      if (usarPagosMixtos) {
        updateData.detallesPago = detallesPago;
      } else {
        updateData.detallesPago = deleteField();
      }

      await OrderService.updateOrder(order.id, updateData);

      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating order:', error);
      setError(error instanceof Error ? error.message : 'Error al actualizar el pedido');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateItemQuantity = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      removeItem(itemId);
      return;
    }
    updateItemField(itemId, { qty: newQty });
  };

  const removeItem = (itemId: string) => {
    setEditedOrder(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
    if (expandedItemId === itemId) setExpandedItemId(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="absolute right-0 top-0 h-full w-full max-w-3xl bg-white shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-6">
            <div>
              <h2 className="text-xl font-bold text-black">Editar Pedido</h2>
              <p className="text-gray-500">{order.numeroOrden}</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-black"
            >
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Error */}
              {error && (
                <div className="border border-red-300 bg-red-50 p-4 text-red-600">
                  {error}
                </div>
              )}

              {/* Estado y configuración básica */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="mb-4 text-lg font-semibold text-black">Estado y Configuración</h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Estado</label>
                    <select
                      value={editedOrder.estado}
                      onChange={(e) => setEditedOrder(prev => ({ ...prev, estado: e.target.value as OrderStatus }))}
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-black focus:border-gray-400 focus:outline-none"
                    >
                      {STATUS_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500">Servicio</label>
                    <select
                      value={editedOrder.servicio}
                      onChange={(e) => setEditedOrder(prev => ({ ...prev, servicio: e.target.value as Service }))}
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-black focus:border-gray-400 focus:outline-none"
                    >
                      {SERVICE_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500">Método de Pago</label>
                    <div className="mt-2 flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={usarPagosMixtos}
                          onChange={(e) => setUsarPagosMixtos(e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-700">Usar pagos mixtos</span>
                      </label>
                    </div>

                    {!usarPagosMixtos ? (
                      <select
                        value={editedOrder.formaPago}
                        onChange={(e) => setEditedOrder(prev => ({ ...prev, formaPago: e.target.value as PaymentMethod }))}
                        className="mt-2 w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-black focus:border-gray-400 focus:outline-none"
                      >
                        {PAYMENT_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {detallesPago.map((pago, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-3 border-b border-gray-100">
                            <select
                              value={pago.metodo}
                              onChange={(e) => {
                                const newDetalles = [...detallesPago];
                                newDetalles[idx].metodo = e.target.value as PaymentMethod;
                                setDetallesPago(newDetalles);
                              }}
                              className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
                            >
                              {PAYMENT_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            <input
                              type="number"
                              value={pago.monto}
                              onChange={(e) => {
                                const newDetalles = [...detallesPago];
                                newDetalles[idx].monto = Number(e.target.value);
                                setDetallesPago(newDetalles);
                              }}
                              placeholder="Monto"
                              className="w-28 rounded border border-gray-300 px-2 py-1 text-sm"
                            />
                            {editedOrder.servicio === 'domicilio' && (
                              <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  checked={pago.entregadoDomiciliario || false}
                                  onChange={(e) => {
                                    const newDetalles = [...detallesPago];
                                    newDetalles[idx].entregadoDomiciliario = e.target.checked;
                                    setDetallesPago(newDetalles);
                                  }}
                                  className="w-3 h-3"
                                />
                                <span>Al domiciliario</span>
                              </label>
                            )}
                            {detallesPago.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setDetallesPago(detallesPago.filter((_, i) => i !== idx))}
                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setDetallesPago([...detallesPago, { metodo: 'Efectivo', monto: 0, entregadoDomiciliario: false }])}
                          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                        >
                          <Plus size={14} /> Agregar método de pago
                        </button>
                        <div className="text-xs text-gray-500 mt-2">
                          Total pagos: {cop(detallesPago.reduce((sum, p) => sum + p.monto, 0))} / Total pedido: {cop(total)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Información del cliente */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="mb-4 text-lg font-semibold text-black">Información del Cliente</h3>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Nombre</label>
                    <input
                      type="text"
                      value={editedOrder.cliente.nombres}
                      onChange={(e) => setEditedOrder(prev => ({
                        ...prev,
                        cliente: { ...prev.cliente, nombres: e.target.value }
                      }))}
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-black focus:border-gray-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500">Teléfono</label>
                    <input
                      type="text"
                      value={editedOrder.cliente.celular}
                      onChange={(e) => setEditedOrder(prev => ({
                        ...prev,
                        cliente: { ...prev.cliente, celular: e.target.value }
                      }))}
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-black focus:border-gray-400 focus:outline-none"
                    />
                  </div>

                  {editedOrder.servicio === 'domicilio' && (
                    <>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-500">Dirección</label>
                        <input
                          type="text"
                          value={editedOrder.cliente.direccion}
                          onChange={(e) => setEditedOrder(prev => ({
                            ...prev,
                            cliente: { ...prev.cliente, direccion: e.target.value }
                          }))}
                          className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-black focus:border-gray-400 focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-500">
                          Barrio (envío: {cop(delivery)})
                        </label>
                        <select
                          value={selectedBarrio?.id || ''}
                          onChange={(e) => {
                            const barrio = BARRIOS.find(b => b.id === e.target.value) || null;
                            setSelectedBarrio(barrio);
                            setEditedOrder(prev => ({
                              ...prev,
                              cliente: { ...prev.cliente, barrio: barrio?.name || '' }
                            }));
                          }}
                          className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-black focus:border-gray-400 focus:outline-none"
                        >
                          <option value="">Seleccionar barrio</option>
                          {BARRIOS.map(barrio => (
                            <option key={barrio.id} value={barrio.id}>
                              {barrio.name} - {barrio.price ? cop(barrio.price) : 'Por confirmar'}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Productos */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="mb-4 text-lg font-semibold text-black">Productos ({editedOrder.items.length})</h3>

                <div className="space-y-3">
                  {editedOrder.items.map((item, index) => {
                    const p = item.product;
                    const isGomitas = p.category === 'gomitas';
                    const canHaveToppings = p.category === 'gomitas' || p.category === 'frutafresh';
                    const sizes = getAvailableSizes(p);
                    const maxT = maxToppingsFor(p);
                    const showToppings = canHaveToppings && maxT > 0;
                    const extrasQty = item.extrasQty ?? {};
                    const extraSelections = item.extraSelections ?? {};
                    const isExpanded = expandedItemId === item.id;
                    const tops = item.toppingIds.length ? toppingsNames(item.toppingIds) : [];
                    const ex = extrasLine(extrasQty);

                    return (
                      <div key={item.id || index} className="border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between p-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-black">{p.name}</h4>
                            <div className="text-sm text-gray-500">
                              {item.version && `${item.version === 'ahogada' ? 'Ahogada' : 'Picosa'} • `}
                              {item.size && `${labelSize(item.size)} • `}
                              {tops.length ? `Toppings: ${tops.join(', ')}` : null}
                              {tops.length && ex.length ? ' • ' : null}
                              {ex.length ? `Extras: ${ex.join(', ')}` : null}
                            </div>
                            <div className="mt-1 text-sm font-semibold text-black">{cop(lineTotal(item))}</div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                              className={[
                                "rounded p-1.5 hover:bg-gray-100",
                                isExpanded ? "text-blue-600 bg-blue-50" : "text-gray-500",
                              ].join(" ")}
                              title="Editar toppings, extras y tamaño"
                            >
                              <Pencil size={16} />
                            </button>

                            <button
                              onClick={() => updateItemQuantity(item.id, item.qty - 1)}
                              className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-black"
                            >
                              <Minus size={16} />
                            </button>

                            <span className="w-8 text-center text-black">{item.qty}</span>

                            <button
                              onClick={() => updateItemQuantity(item.id, item.qty + 1)}
                              className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-black"
                            >
                              <Plus size={16} />
                            </button>

                            <button
                              onClick={() => removeItem(item.id)}
                              className="ml-2 rounded p-1 text-red-600 hover:bg-red-100"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-gray-100 p-4 space-y-4 bg-gray-50">
                            <div>
                              <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Tamaño</div>
                              {sizes.length ? (
                                <div className="mt-1.5 flex flex-wrap gap-1.5">
                                  {sizes.map((s) => (
                                    <button
                                      key={s}
                                      type="button"
                                      onClick={() => updateItemField(item.id, { size: s })}
                                      className={[
                                        "border px-3 py-1.5 text-xs font-medium transition rounded",
                                        item.size === s
                                          ? "border-rojo bg-rojo text-white"
                                          : "border-gray-300 bg-white text-gray-600 hover:border-gray-400",
                                      ].join(" ")}
                                    >
                                      {labelSize(s)}
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <div className="mt-1 text-xs text-gray-400">No aplica.</div>
                              )}
                            </div>

                            {isGomitas && (
                              <Referencias
                                value={item.version ?? null}
                                onChange={(v) => updateItemField(item.id, { version: v })}
                              />
                            )}

                            {showToppings && (
                              <Toppings
                                value={item.toppingIds}
                                onChange={(next) => updateItemField(item.id, { toppingIds: next })}
                                max={maxT}
                                min={isGomitas && maxT > 0 ? 1 : 0}
                                small
                                title="Toppings"
                                subtitle={isGomitas ? "Selecciona (mínimo 1)" : `Opcional (hasta ${maxT})`}
                              />
                            )}

                            <div>
                              <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">Extras</div>
                              <div className="mt-2 space-y-2">
                                {EXTRAS.map((extra) => {
                                  const qty = extrasQty[extra.id] ?? 0;
                                  const currentSelections = extraSelections[extra.id] ?? [];

                                  const applyExtrasPatch = (nextQty: number, nextSelectionIds: string[]) => {
                                    const nextExtrasQty = { ...extrasQty, [extra.id]: nextQty };
                                    const nextExtraSelections = { ...extraSelections };

                                    if (nextSelectionIds.length) nextExtraSelections[extra.id] = nextSelectionIds;
                                    else delete nextExtraSelections[extra.id];

                                    updateItemField(item.id, {
                                      extrasQty: nextExtrasQty,
                                      extraSelections: nextExtraSelections,
                                    });
                                  };

                                  return (
                                    <div key={extra.id} className="py-1.5">
                                      <div className="flex items-center justify-between gap-3">
                                        <div>
                                          <span className="text-xs font-medium text-gray-700">{extra.name}</span>
                                          <span className="ml-1.5 text-[10px] text-gray-400">{cop(extra.price)}</span>
                                        </div>

                                        <div className="flex items-center gap-1.5">
                                          <button
                                            type="button"
                                            className="h-7 w-7 border border-gray-300 bg-white rounded text-xs transition hover:border-gray-400"
                                            onClick={() => {
                                              const nextQty = Math.max(0, qty - 1);
                                              const trimmed = currentSelections.slice(0, nextQty);
                                              applyExtrasPatch(nextQty, trimmed);
                                            }}
                                          >
                                            −
                                          </button>
                                          <div className="w-5 text-center text-xs font-medium">{qty}</div>
                                          <button
                                            type="button"
                                            className="h-7 w-7 border border-gray-300 bg-white rounded text-xs transition hover:border-gray-400"
                                            onClick={() => {
                                              const nextQty = qty + 1;
                                              const trimmed = currentSelections.slice(0, nextQty);
                                              applyExtrasPatch(nextQty, trimmed);
                                            }}
                                          >
                                            +
                                          </button>
                                        </div>
                                      </div>

                                      {extra.id === 'gomitas' && qty > 0 && (
                                        <div className="mt-2">
                                          <Toppings
                                            value={currentSelections}
                                            onChange={(next) => {
                                              const trimmed = next.slice(0, qty);
                                              applyExtrasPatch(qty, trimmed);
                                            }}
                                            max={qty}
                                            min={qty}
                                            small
                                            title="Gomitas extra"
                                            subtitle={`Selecciona ${qty} ${qty === 1 ? "opción" : "opciones"}`}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() => setExpandedItemId(null)}
                                className="border border-gray-300 bg-white px-4 py-1.5 text-xs font-medium rounded text-gray-600 hover:border-gray-400"
                              >
                                Cerrar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {editedOrder.items.length === 0 && (
                    <div className="border border-dashed border-gray-300 p-6 text-center text-gray-500">
                      No hay productos en este pedido
                    </div>
                  )}
                </div>
              </div>

              {/* Descuento de cumpleaños (verificación manual) */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-black">
                  <Cake size={18} /> Descuento de cumpleaños
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                  Solo aplícalo si el cliente te envió por WhatsApp una foto de su cédula y el nombre coincide con el del pedido. No se aplica automáticamente.
                  {isBirthdayToday(order.cliente.fechaNacimiento) && (
                    <span className="ml-1 font-semibold text-rojo">🎂 Hoy es su cumpleaños según sus datos guardados.</span>
                  )}
                </p>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aplicarDescuentoCumple}
                    onChange={(e) => setAplicarDescuentoCumple(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">
                    Aplicar descuento verificado ({BIRTHDAY_DISCOUNT_PERCENT}% sobre {cop(baseSubtotal)} = {cop(Math.round(baseSubtotal * BIRTHDAY_DISCOUNT_PERCENT / 100))})
                  </span>
                </label>

                {aplicarDescuentoCumple && (
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-500">Cédula verificada</label>
                    <input
                      type="text"
                      value={cedulaVerificada}
                      onChange={(e) => setCedulaVerificada(e.target.value.replace(/\D/g, ''))}
                      placeholder="Número de cédula que coincide con el nombre del pedido"
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-black focus:border-gray-400 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Totales */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="mb-4 text-lg font-semibold text-black">Totales</h3>

                <div className="space-y-2">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal:</span>
                    <span>{cop(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Envío:</span>
                    <span>{cop(delivery)}</span>
                  </div>
                  {descuentoTotal > 0 && (
                    <div className="flex justify-between text-rojo">
                      <span>Descuento:</span>
                      <span>-{cop(descuentoTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-200 pt-2 text-lg font-semibold text-black">
                    <span>Total:</span>
                    <span>{cop(total)}</span>
                  </div>
                </div>
              </div>

              {/* Nota del admin */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="mb-4 text-lg font-semibold text-black">Nota del Administrador</h3>
                <textarea
                  value={editedOrder.notaAdmin}
                  onChange={(e) => setEditedOrder(prev => ({ ...prev, notaAdmin: e.target.value }))}
                  placeholder="Agregar nota interna..."
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-black focus:border-gray-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg border border-gray-300 py-2 font-semibold text-black hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isSubmitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>Guardando...</>
                ) : (
                  <>
                    <Save size={16} />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
