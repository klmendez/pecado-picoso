import { useState } from 'react';
import { X, MapPin, Phone, Clock, Package, User, CreditCard, Send } from 'lucide-react';
import type { PedidoFirestore } from '../../types/order';
import { cop } from '../../lib/format';
import { TOPPINGS } from '../../data/toppings';
import { EXTRAS } from '../../data/extras';
import { formatToppingsNames, formatExtrasNames } from '../../lib/whatsapp';
import { isFixedPrice } from '../../data/products';
import { OrderService } from '../../services/orderService';

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

  const formatInput = (val: string) => {
    const num = val.replace(/\D/g, '');
    return num ? Number(num).toLocaleString('es-CO') : '';
  };

  const handleClienteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setClienteDa(raw);
  };

  const handleDomiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setDomiRecibe(raw);
  };

  const handleGuardar = async () => {
    if (!domiMonto) return;
    try {
      await OrderService.updateOrder(orderId, {
        montoDomiciliario: domiMonto,
        montoNegocio: paraNegocio
      });
      setGuardadoMsg('Distribución guardada');
      setTimeout(() => setGuardadoMsg(null), 3000);
    } catch (err) {
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
        {/* Total del pedido */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Total del pedido:</span>
          <span className="font-bold text-black">{cop(total)}</span>
        </div>

        {/* Cuánto da el cliente */}
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-500 shrink-0 w-24">Cliente da:</label>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              type="text"
              inputMode="numeric"
              value={clienteDa ? formatInput(clienteDa) : ''}
              onChange={handleClienteChange}
              placeholder="0"
              className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        {/* Cuánto se le da al domiciliario */}
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-500 shrink-0 w-24">Para domi:</label>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              type="text"
              inputMode="numeric"
              value={domiRecibe ? formatInput(domiRecibe) : ''}
              onChange={handleDomiChange}
              placeholder={delivery > 0 ? `Sugerido: ${cop(delivery)}` : '0'}
              className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        {/* Resultados */}
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
                <span className="text-sm text-blue-700">¡Pago exacto!</span>
                <span className="font-bold text-blue-700">Sin cambio</span>
              </div>
            )}
          </div>
        )}

        {/* Distribución del dinero */}
        {domiMonto > 0 && (
          <div className="rounded-lg border-t border-gray-200 pt-3 space-y-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Distribución</div>
            <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
              <span className="text-sm text-orange-700">Para domiciliario:</span>
              <span className="font-bold text-orange-700">{cop(domiMonto)}</span>
            </div>
            <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <span className="text-sm text-red-700">Para Pecado Picoso:</span>
              <span className="font-bold text-red-700">{cop(paraNegocio)}</span>
            </div>

            <button
              onClick={handleGuardar}
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

interface OrderDetailModalProps {
  order: PedidoFirestore & { id: string };
  onClose: () => void;
}

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

export default function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
  const [editMsg, setEditMsg] = useState('');

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const waCliente = (celular: string, mensaje: string) => {
    const num = String(celular || '').replace(/\D/g, '');
    const full = num.startsWith('57') ? num : `57${num}`;
    return `https://api.whatsapp.com/send?phone=${full}&text=${encodeURIComponent(mensaje)}`;
  };

  const handleWhatsApp = () => {
    const cleanPhone = order.cliente.celular.replace(/\D/g, '');
    const message = `Hola ${order.cliente.nombres}! Te contactamos desde Pecado Picoso sobre tu pedido ${order.numeroOrden}.`;
    const url = `https://api.whatsapp.com/send?phone=57${cleanPhone}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleOpenLocation = () => {
    if (order.cliente.coordenadas) {
      const { lat, lng } = order.cliente.coordenadas;
      const url = `https://maps.google.com/?q=${lat},${lng}`;
      window.open(url, '_blank');
    } else if (order.cliente.mapsLink) {
      window.open(order.cliente.mapsLink, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-6">
            <div>
              <h2 className="text-xl font-bold text-black">Detalle del Pedido</h2>
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
              {/* Estado y fechas */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-black">
                  <Package size={20} />
                  Estado del Pedido
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Estado actual:</span>
                    <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${STATUS_COLORS[order.estado]}`}>
                      {STATUS_LABELS[order.estado]}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Fecha de creación:</span>
                    <span className="text-black">{formatDate(order.createdAt)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Última actualización:</span>
                    <span className="text-black">{formatDate(order.updatedAt)}</span>
                  </div>
                </div>

                {/* Historial de estados */}
                {order.historialEstado && order.historialEstado.length > 1 && (
                  <div className="mt-4 border-t border-gray-200 pt-4">
                    <h4 className="mb-2 text-sm font-semibold text-black">Historial de Estados</h4>
                    <div className="space-y-2">
                      {order.historialEstado.map((historial, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">{STATUS_LABELS[historial.estado]}</span>
                          <span className="text-gray-500">{formatDate(historial.timestamp)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Información del cliente */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-black">
                  <User size={20} />
                  Información del Cliente
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Nombre:</span>
                    <span className="text-black">{order.cliente.nombres}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Teléfono:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-black">{order.cliente.celular}</span>
                      <button
                        onClick={handleWhatsApp}
                        className="rounded p-1 text-green-400 hover:bg-green-400/20"
                      >
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
                        <span className="text-gray-500">Dirección:</span>
                        <span className="text-black">{order.cliente.direccion}</span>
                      </div>
                      
                      {order.cliente.coordenadas && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Ubicación:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">
                              {order.cliente.coordenadas.lat.toFixed(6)}, {order.cliente.coordenadas.lng.toFixed(6)}
                            </span>
                            <button
                              onClick={handleOpenLocation}
                              className="rounded p-1 text-blue-400 hover:bg-blue-400/20"
                            >
                              <MapPin size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {order.cliente.ubicacionTiempoReal && order.cliente.ubicacionTiempoReal.length > 1 && (
                        <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
                          <div className="flex items-center gap-2 text-blue-300">
                            <Clock size={16} />
                            <span className="font-semibold">Ubicación en Tiempo Real Activa</span>
                          </div>
                          <p className="mt-1 text-sm text-blue-200">
                            El cliente está compartiendo su ubicación. Última actualización: {' '}
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
                    // Calcular precio unitario del item
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

                    // Sumar extras
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
                            <div className="mt-1 text-sm text-gray-600">
                              Cantidad: x{item.qty}
                            </div>

                            {/* Detalles del producto */}
                            <div className="mt-2 space-y-1">
                              {item.version && (
                                <div className="text-sm text-gray-600">
                                  <span className="font-medium text-gray-800">Versión:</span>{' '}
                                  {item.version === 'ahogada' ? 'Ahogada' : 'Picosa'}
                                </div>
                              )}

                              {item.size && (
                                <div className="text-sm text-gray-600">
                                  <span className="font-medium text-gray-800">Tamaño:</span>{' '}
                                  {item.size === 'pequeno' ? 'Pequeño' : item.size === 'mediano' ? 'Mediano' : 'Grande'}
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
                            <div className="font-bold text-black">
                              {cop(itemTotal)}
                            </div>
                            {(unitPrice + extrasTotal) !== itemTotal && (
                              <div className="text-xs text-gray-400">
                                {cop(unitPrice + extrasTotal)} c/u
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Totales y pago */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-black">
                  <CreditCard size={20} />
                  Resumen de Pago
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Subtotal:</span>
                    <span className="text-black">{cop(order.subtotal)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Envío:</span>
                    <span className="text-black">{cop(order.delivery)}</span>
                  </div>

                  {(order.descuentoTotal ?? 0) > 0 && (
                    <>
                      {(order.promociones || []).map((promo, idx) => (
                        <div key={idx} className="flex items-center justify-between text-rojo">
                          <span>{promo.nombre}:</span>
                          <span className="font-semibold">-{cop(promo.descuento)}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between text-rojo font-semibold">
                        <span>Descuento total:</span>
                        <span>-{cop(order.descuentoTotal!)}</span>
                      </div>
                    </>
                  )}

                  <div className="flex items-center justify-between border-t border-gray-200 pt-3 text-lg font-semibold">
                    <span className="text-black">Total:</span>
                    <span className="text-black">{cop(order.total)}</span>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-3">
                    <span className="text-gray-500 block mb-2">Método de pago:</span>
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

              {/* Calculadora auxiliar */}
              <CalculadoraCambio
                orderId={order.id}
                total={order.total}
                delivery={order.delivery}
                savedDomi={order.montoDomiciliario}
                savedNegocio={order.montoNegocio}
              />

              {/* Nota del admin */}
              {order.notaAdmin && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="mb-3 text-lg font-semibold text-black">Nota del Administrador</h3>
                  <p className="text-gray-700">{order.notaAdmin}</p>
                </div>
              )}

              {/* Enviar mensaje al cliente */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-black">
                  <Send size={20} />
                  Enviar mensaje al cliente
                </h3>

                {(() => {
                  // Resumen del pedido para incluir en mensajes
                  const productosResumen = order.items.map(it => {
                    const detalles: string[] = [];
                    if (it.version) detalles.push(it.version === 'ahogada' ? 'Ahogada' : 'Picosa');
                    if (it.size) detalles.push(it.size === 'pequeno' ? 'Peq' : it.size === 'mediano' ? 'Med' : 'Gde');
                    const detalleStr = detalles.length ? ` (${detalles.join(' · ')})` : '';
                    return `• x${it.qty} ${it.product.name}${detalleStr}`;
                  }).join('\n');

                  const direccionInfo = order.servicio === 'domicilio' && order.cliente.direccion
                    ? `\nDirección: ${order.cliente.direccion}${order.cliente.barrio ? ` (${order.cliente.barrio})` : ''}`
                    : '';

                  const descuentoInfo = (order.descuentoTotal ?? 0) > 0
                    ? `\nDescuento: -${cop(order.descuentoTotal!)}`
                    : '';

                  const pagoInfo = `${descuentoInfo}\nTotal: ${cop(order.total)} · ${order.formaPago}`;

                  const presets = [
                    {
                      label: 'Confirmado',
                      text: `Hola ${order.cliente.nombres}!\n\nTu pedido *${order.numeroOrden}* ha sido *CONFIRMADO*.\n\nProductos:\n${productosResumen}${direccionInfo}${pagoInfo}\n\n¡Gracias por elegir Pecado Picoso!`
                    },
                    {
                      label: 'En preparación',
                      text: `Hola ${order.cliente.nombres}!\n\nTu pedido *${order.numeroOrden}* está en *PREPARACIÓN*.\n\nProductos:\n${productosResumen}${direccionInfo}${pagoInfo}\n\nPronto estará listo. ¡Te avisamos!`
                    },
                    {
                      label: 'En camino',
                      text: `Hola ${order.cliente.nombres}!\n\nTu pedido *${order.numeroOrden}* ya está *EN CAMINO*.\n\nProductos:\n${productosResumen}${direccionInfo}${pagoInfo}\n\n¡Espéralo pronto!`
                    },
                    {
                      label: 'Listo para recoger',
                      text: `Hola ${order.cliente.nombres}!\n\nTu pedido *${order.numeroOrden}* está *LISTO PARA RECOGER*.\n\nProductos:\n${productosResumen}${pagoInfo}\n\n¡Pasa cuando quieras!`
                    },
                    {
                      label: 'Pago pendiente',
                      text: `Hola ${order.cliente.nombres}!\n\nRecordatorio: tu pedido *${order.numeroOrden}* tiene *PAGO PENDIENTE*.\n\nProductos:\n${productosResumen}${pagoInfo}\n\nEnvíanos el comprobante por aquí para confirmar. ¡Gracias!`
                    },
                    {
                      label: 'Entregado',
                      text: `Hola ${order.cliente.nombres}!\n\nTu pedido *${order.numeroOrden}* ha sido *ENTREGADO*.\n\nProductos:\n${productosResumen}${pagoInfo}\n\n¿Todo estuvo bien? ¡Nos encantaría saber tu opinión!`
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
                    </>
                  );
                })()}

                <textarea
                  value={editMsg}
                  onChange={(e) => setEditMsg(e.target.value)}
                  rows={3}
                  placeholder="Escribe un mensaje personalizado para el cliente..."
                  className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors resize-none"
                />

                <a
                  href={editMsg.trim() ? waCliente(order.cliente.celular, editMsg.trim()) : '#'}
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
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6">
            <div className="flex gap-3">
              <button
                onClick={handleWhatsApp}
                className="flex-1 rounded-lg bg-green-600 py-2 font-semibold text-white hover:bg-green-700"
              >
                Contactar por WhatsApp
              </button>
              {order.cliente.coordenadas && (
                <button
                  onClick={handleOpenLocation}
                  className="flex-1 rounded-lg bg-blue-600 py-2 font-semibold text-white hover:bg-blue-700"
                >
                  Ver en Maps
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
