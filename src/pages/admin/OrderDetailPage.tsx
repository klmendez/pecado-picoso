import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Phone, Clock, Package, User, CreditCard, Send
} from 'lucide-react';
import type { PedidoFirestore } from '../../types/order';
import { cop } from '../../lib/format';
import { TOPPINGS } from '../../data/toppings';
import { EXTRAS } from '../../data/extras';
import { formatToppingsNames, formatExtrasNames } from '../../lib/whatsapp';
import { isFixedPrice } from '../../data/products';
import { OrderService } from '../../services/orderService';
import AdminAuth from '../../components/AdminAuth';
import AdminLayout from '../../components/admin/AdminLayout';

/* ─────────── Calculadora de cambio ─────────── */
function CalculadoraCambio({
  orderId,
  total,
  delivery,
  savedDomi,
  savedNegocio
}: {
  orderId: string;
  total: number;
  delivery: number;
  savedDomi?: number;
  savedNegocio?: number;
}) {
  const [clienteDa, setClienteDa] = useState('');
  const [domiRecibe, setDomiRecibe] = useState(
    savedDomi ? String(savedDomi) : delivery > 0 ? String(delivery) : ''
  );
  const [guardadoMsg, setGuardadoMsg] = useState<string | null>(null);

  const montoCliente = Number(clienteDa.replace(/\D/g, '')) || 0;
  const domiMonto = Number(domiRecibe.replace(/\D/g, '')) || 0;

  const cambio = montoCliente > total ? montoCliente - total : 0;
  const falta = montoCliente < total && montoCliente > 0 ? total - montoCliente : 0;
  const paraNegocio = total - domiMonto;

  const fmt = (v: string) => {
    const n = v.replace(/\D/g, '');
    return n ? Number(n).toLocaleString('es-CO') : '';
  };

  const guardar = async () => {
    if (!domiMonto) return;
    try {
      await OrderService.updateOrder(orderId, {
        montoDomiciliario: domiMonto,
        montoNegocio: paraNegocio
      });
      setGuardadoMsg('Distribucion guardada');
      setTimeout(() => setGuardadoMsg(null), 3000);
    } catch {
      setGuardadoMsg('Error al guardar');
      setTimeout(() => setGuardadoMsg(null), 3000);
    }
  };

  return (
    <div className="border-t border-gray-200 pt-4">
      <h3 className="mb-3 text-lg font-semibold text-black flex items-center gap-2">
        Calculadora de Cambio
        {(savedDomi || savedNegocio) && (
          <span className="text-xs font-normal text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Guardado</span>
        )}
      </h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Total del pedido:</span>
          <span className="font-bold text-black">{cop(total)}</span>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-500 shrink-0 w-24">Cliente da:</label>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              type="text" inputMode="numeric"
              value={clienteDa ? fmt(clienteDa) : ''}
              onChange={(e) => setClienteDa(e.target.value.replace(/\D/g, ''))}
              placeholder="0"
              className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-500"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-500 shrink-0 w-24">Para domi:</label>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              type="text" inputMode="numeric"
              value={domiRecibe ? fmt(domiRecibe) : ''}
              onChange={(e) => setDomiRecibe(e.target.value.replace(/\D/g, ''))}
              placeholder={delivery > 0 ? `Sugerido: ${cop(delivery)}` : '0'}
              className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-500"
            />
          </div>
        </div>
        {montoCliente > 0 && (
          <div className="rounded-lg space-y-2">
            {cambio > 0 && (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <span className="text-sm text-green-700">Cambio para cliente:</span>
                <span className="font-bold text-green-700">{cop(cambio)}</span>
              </div>
            )}
            {falta > 0 && (
              <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <span className="text-sm text-red-700">Falta por pagar:</span>
                <span className="font-bold text-red-700">{cop(falta)}</span>
              </div>
            )}
            {montoCliente === total && (
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                <span className="text-sm text-blue-700">Pago exacto!</span>
                <span className="font-bold text-blue-700">Sin cambio</span>
              </div>
            )}
          </div>
        )}
        {domiMonto > 0 && (
          <div className="rounded-lg border-t border-gray-200 pt-3 space-y-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Distribucion</div>
            <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
              <span className="text-sm text-orange-700">Para domiciliario:</span>
              <span className="font-bold text-orange-700">{cop(domiMonto)}</span>
            </div>
            <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <span className="text-sm text-red-700">Para Pecado Picoso:</span>
              <span className="font-bold text-red-700">{cop(paraNegocio)}</span>
            </div>
            <button
              onClick={guardar}
              className="w-full mt-2 rounded-lg bg-gray-900 py-2 text-sm font-bold text-white hover:bg-black transition-colors"
            >
              Guardar distribucion
            </button>
            {guardadoMsg && (
              <div className="text-center text-xs text-green-600 font-medium">{guardadoMsg}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────── Constantes ─────────── */
const STATUS_LABELS = {
  no_pagado: 'Sin Pagar',
  pagado: 'Pagado',
  preparando: 'Preparando',
  en_camino: 'En Camino',
  entregado: 'Entregado',
  cancelado: 'Cancelado'
};

const STATUS_COLORS = {
  no_pagado: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  pagado: 'bg-green-100 text-green-700 border-green-300',
  preparando: 'bg-blue-100 text-blue-700 border-blue-300',
  en_camino: 'bg-purple-100 text-purple-700 border-purple-300',
  entregado: 'bg-gray-100 text-gray-700 border-gray-300',
  cancelado: 'bg-red-100 text-red-700 border-red-300'
};

/* ─────────── Page ─────────── */
export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<PedidoFirestore & { id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMsg, setEditMsg] = useState('');

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const o = await OrderService.getOrder(id);
        if (o) setOrder(o as PedidoFirestore & { id: string });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const fmtDate = (ts: any) => {
    if (!ts) return 'N/A';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  };

  if (loading) {
    return (
      <AdminAuth>
        <AdminLayout>
          <div className="p-8 text-center text-gray-500">Cargando pedido...</div>
        </AdminLayout>
      </AdminAuth>
    );
  }

  if (!order) {
    return (
      <AdminAuth>
        <AdminLayout>
          <div className="p-8">
            <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-gray-500 hover:text-black mb-4">
              <ArrowLeft size={18} /> Volver
            </button>
            <p className="text-red-500">Pedido no encontrado</p>
          </div>
        </AdminLayout>
      </AdminAuth>
    );
  }

  const wa = (cel: string, msg: string) => {
    const n = String(cel || '').replace(/\D/g, '');
    const f = n.startsWith('57') ? n : `57${n}`;
    return `https://api.whatsapp.com/send?phone=${f}&text=${encodeURIComponent(msg)}`;
  };

  const openWA = () => {
    const p = order.cliente.celular.replace(/\D/g, '');
    const m = `Hola ${order.cliente.nombres}! Te contactamos desde Pecado Picoso sobre tu pedido ${order.numeroOrden}.`;
    window.open(`https://api.whatsapp.com/send?phone=57${p}&text=${encodeURIComponent(m)}`, '_blank');
  };

  const openMaps = () => {
    if (order.cliente.coordenadas) {
      const { lat, lng } = order.cliente.coordenadas;
      window.open(`https://maps.google.com/?q=${lat},${lng}`, '_blank');
    } else if (order.cliente.mapsLink) {
      window.open(order.cliente.mapsLink, '_blank');
    }
  };

  return (
    <AdminAuth>
      <AdminLayout>
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => navigate('/admin')}
              className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-black"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-black">Detalle del Pedido</h1>
              <p className="text-gray-500">{order.numeroOrden}</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Estado */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-black">
                <Package size={20} /> Estado del Pedido
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Estado actual:</span>
                  <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${STATUS_COLORS[order.estado]}`}>
                    {STATUS_LABELS[order.estado]}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Fecha de creacion:</span>
                  <span className="text-black">{fmtDate(order.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Ultima actualizacion:</span>
                  <span className="text-black">{fmtDate(order.updatedAt)}</span>
                </div>
              </div>
              {order.historialEstado && order.historialEstado.length > 1 && (
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <h4 className="mb-2 text-sm font-semibold text-black">Historial de Estados</h4>
                  <div className="space-y-2">
                    {order.historialEstado.map((h, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">{STATUS_LABELS[h.estado]}</span>
                        <span className="text-gray-500">{fmtDate(h.timestamp)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Cliente */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-black">
                <User size={20} /> Informacion del Cliente
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Nombre:</span>
                  <span className="text-black">{order.cliente.nombres}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Telefono:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-black">{order.cliente.celular}</span>
                    <button onClick={openWA} className="rounded p-1 text-green-400 hover:bg-green-400/20">
                      <Phone size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Servicio:</span>
                  <span className="text-black">{order.servicio === 'domicilio' ? 'Domicilio' : 'Para llevar'}</span>
                </div>
                {order.servicio === 'domicilio' && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Direccion:</span>
                      <span className="text-black">{order.cliente.direccion}</span>
                    </div>
                    {order.cliente.coordenadas && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Ubicacion:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">
                            {order.cliente.coordenadas.lat.toFixed(6)}, {order.cliente.coordenadas.lng.toFixed(6)}
                          </span>
                          <button onClick={openMaps} className="rounded p-1 text-blue-400 hover:bg-blue-400/20">
                            <MapPin size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                    {order.cliente.ubicacionTiempoReal && order.cliente.ubicacionTiempoReal.length > 1 && (
                      <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
                        <div className="flex items-center gap-2 text-blue-300">
                          <Clock size={16} />
                          <span className="font-semibold">Ubicacion en Tiempo Real Activa</span>
                        </div>
                        <p className="mt-1 text-sm text-blue-200">
                          Ultima actualizacion: {' '}
                          {new Date(order.cliente.ubicacionTiempoReal[order.cliente.ubicacionTiempoReal.length - 1].timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Productos */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="mb-3 text-lg font-semibold text-black">Productos ({order.items.length})</h3>
              <div className="space-y-3">
                {order.items.map((item, index) => {
                  let unitPrice = 0;
                  if (item.product.category === 'gomitas') {
                    if (item.version && item.size) {
                      unitPrice = (item.product.prices as Record<string, Record<string, number>>)[item.version]?.[item.size] ?? 0;
                    }
                  } else if (item.product.category === 'frutafresh') {
                    if (isFixedPrice(item.product.prices)) {
                      unitPrice = item.product.prices.fijo ?? 0;
                    } else if (item.size && item.product.prices.porSize) {
                      unitPrice = item.product.prices.porSize[item.size] ?? 0;
                    }
                  }
                  let extrasTotal = 0;
                  for (const [id, qty] of Object.entries(item.extrasQty || {})) {
                    const extra = EXTRAS.find(e => e.id === id);
                    if (extra && qty > 0) extrasTotal += extra.price * qty;
                  }
                  const itemTotal = (unitPrice + extrasTotal) * item.qty;
                  const toppingsText = formatToppingsNames(item.toppingIds, TOPPINGS);
                  const extrasText = formatExtrasNames(item.extrasQty, EXTRAS, item.extraSelections ?? {}, TOPPINGS);

                  return (
                    <div key={item.id || index} className="border-b border-gray-100 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-black">{item.product.name}</h4>
                          <div className="mt-1 text-sm text-gray-600">Cantidad: x{item.qty}</div>
                          <div className="mt-2 space-y-1">
                            {item.version && (
                              <div className="text-sm text-gray-600">
                                <span className="font-medium text-gray-800">Version:</span>{' '}
                                {item.version === 'ahogada' ? 'Ahogada' : 'Picosa'}
                              </div>
                            )}
                            {item.size && (
                              <div className="text-sm text-gray-600">
                                <span className="font-medium text-gray-800">Tamano:</span>{' '}
                                {item.size === 'pequeno' ? 'Pequeno' : item.size === 'mediano' ? 'Mediano' : 'Grande'}
                              </div>
                            )}
                            {toppingsText && (
                              <div className="text-sm text-gray-600">
                                <span className="font-medium text-gray-800">Toppings:</span> {toppingsText}
                              </div>
                            )}
                            {extrasText && (
                              <div className="text-sm text-gray-600">
                                <span className="font-medium text-gray-800">Extras:</span> {extrasText}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-bold text-black">{cop(itemTotal)}</div>
                          {(unitPrice + extrasTotal) !== itemTotal && (
                            <div className="text-xs text-gray-400">{cop(unitPrice + extrasTotal)} c/u</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pago */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-black">
                <CreditCard size={20} /> Resumen de Pago
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Subtotal:</span>
                  <span className="text-black">{cop(order.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Envio:</span>
                  <span className="text-black">{cop(order.delivery)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-200 pt-3 text-lg font-semibold">
                  <span className="text-black">Total:</span>
                  <span className="text-black">{cop(order.total)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <span className="text-gray-500 block mb-2">Metodo de pago:</span>
                  {order.detallesPago && order.detallesPago.length > 0 ? (
                    <div className="space-y-2">
                      {order.detallesPago.map((pago, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                          <span className="text-black">{pago.metodo}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-black">{cop(pago.monto)}</span>
                            {order.servicio === 'domicilio' && pago.entregadoDomiciliario && (
                              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Al domiciliario</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-black">{order.formaPago}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Calculadora */}
            <CalculadoraCambio
              orderId={order.id}
              total={order.total}
              delivery={order.delivery}
              savedDomi={order.montoDomiciliario}
              savedNegocio={order.montoNegocio}
            />

            {/* Nota admin */}
            {order.notaAdmin && (
              <div className="border-t border-gray-200 pt-4">
                <h3 className="mb-3 text-lg font-semibold text-black">Nota del Administrador</h3>
                <p className="text-gray-700">{order.notaAdmin}</p>
              </div>
            )}

            {/* WhatsApp */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-black">
                <Send size={20} /> Enviar mensaje al cliente
              </h3>
              {(() => {
                const productosResumen = order.items.map(it => {
                  const detalles: string[] = [];
                  if (it.version) detalles.push(it.version === 'ahogada' ? 'Ahogada' : 'Picosa');
                  if (it.size) detalles.push(it.size === 'pequeno' ? 'Peq' : it.size === 'mediano' ? 'Med' : 'Gde');
                  const detalleStr = detalles.length ? ` (${detalles.join(' · ')})` : '';
                  return `• x${it.qty} ${it.product.name}${detalleStr}`;
                }).join('\n');

                const direccionInfo = order.servicio === 'domicilio' && order.cliente.direccion
                  ? `\nDireccion: ${order.cliente.direccion}${order.cliente.barrio ? ` (${order.cliente.barrio})` : ''}`
                  : '';

                const pagoInfo = `\nTotal: ${cop(order.total)} · ${order.formaPago}`;

                const presets = [
                  {
                    label: 'Confirmado',
                    text: `Hola ${order.cliente.nombres}!\n\nTu pedido *${order.numeroOrden}* ha sido *CONFIRMADO*.\n\nProductos:\n${productosResumen}${direccionInfo}${pagoInfo}\n\nGracias por elegir Pecado Picoso!`
                  },
                  {
                    label: 'En preparacion',
                    text: `Hola ${order.cliente.nombres}!\n\nTu pedido *${order.numeroOrden}* esta en *PREPARACION*.\n\nProductos:\n${productosResumen}${direccionInfo}${pagoInfo}\n\nPronto estara listo. Te avisamos!`
                  },
                  {
                    label: 'En camino',
                    text: `Hola ${order.cliente.nombres}!\n\nTu pedido *${order.numeroOrden}* ya esta *EN CAMINO*.\n\nProductos:\n${productosResumen}${direccionInfo}${pagoInfo}\n\nEsperalo pronto!`
                  },
                  {
                    label: 'Listo para recoger',
                    text: `Hola ${order.cliente.nombres}!\n\nTu pedido *${order.numeroOrden}* esta *LISTO PARA RECOGER*.\n\nProductos:\n${productosResumen}${pagoInfo}\n\nPasa cuando quieras!`
                  },
                  {
                    label: 'Pago pendiente',
                    text: `Hola ${order.cliente.nombres}!\n\nRecordatorio: tu pedido *${order.numeroOrden}* tiene *PAGO PENDIENTE*.\n\nProductos:\n${productosResumen}${pagoInfo}\n\nEnvianos el comprobante por aqui para confirmar. Gracias!`
                  },
                  {
                    label: 'Entregado',
                    text: `Hola ${order.cliente.nombres}!\n\nTu pedido *${order.numeroOrden}* ha sido *ENTREGADO*.\n\nProductos:\n${productosResumen}${pagoInfo}\n\nTodo estuvo bien? Nos encantaria saber tu opinion!`
                  },
                ];

                return (
                  <>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {presets.map((preset, idx) => (
                        <button key={idx} onClick={() => setEditMsg(preset.text)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 hover:border-red-400 bg-gray-50 hover:bg-white transition-colors text-left">
                          {preset.label}
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={editMsg}
                      onChange={(e) => setEditMsg(e.target.value)}
                      rows={3}
                      placeholder="Escribe un mensaje personalizado para el cliente..."
                      className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors resize-none"
                    />
                    <a
                      href={editMsg.trim() ? wa(order.cliente.celular, editMsg.trim()) : '#'}
                      target="_blank" rel="noreferrer"
                      onClick={(e) => { if (!editMsg.trim()) e.preventDefault(); }}
                      className={`mt-3 w-full flex items-center justify-center gap-2 text-sm font-bold py-3 rounded-xl transition-colors ${
                        editMsg.trim()
                          ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <Send size={15} /> Enviar por WhatsApp al cliente
                    </a>
                  </>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="flex gap-3">
              <button
                onClick={openWA}
                className="flex-1 rounded-lg bg-green-600 py-2 font-semibold text-white hover:bg-green-700"
              >
                Contactar por WhatsApp
              </button>
              {order.cliente.coordenadas && (
                <button
                  onClick={openMaps}
                  className="flex-1 rounded-lg bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700"
                >
                  Ver en Maps
                </button>
              )}
            </div>
          </div>
        </div>
      </AdminLayout>
    </AdminAuth>
  );
}
