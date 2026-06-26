import { useState } from 'react';
import { X, MapPin, Phone, Clock, Package, User, CreditCard, Send } from 'lucide-react';
import type { PedidoFirestore } from '../../types/order';
import { cop } from '../../lib/format';

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
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
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
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
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
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <h3 className="mb-3 text-lg font-semibold text-black">Productos ({order.items.length})</h3>
                
                <div className="space-y-3">
                  {order.items.map((item, index) => (
                    <div key={item.id || index} className="rounded-lg border border-gray-200 bg-gray-100 p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-black">{item.product.name}</h4>
                          <div className="mt-1 text-sm text-gray-500">
                            Cantidad: x{item.qty}
                          </div>
                          
                          {item.version && (
                            <div className="text-sm text-gray-500">
                              Versión: {item.version === 'ahogada' ? 'Ahogada' : 'Picosa'}
                            </div>
                          )}
                          
                          {item.size && (
                            <div className="text-sm text-gray-500">
                              Tamaño: {item.size === 'pequeno' ? 'Pequeño' : item.size === 'mediano' ? 'Mediano' : 'Grande'}
                            </div>
                          )}
                          
                          {item.toppingIds.length > 0 && (
                            <div className="text-sm text-gray-500">
                              Toppings: {item.toppingIds.length}
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <div className="font-semibold text-black">
                            {/* Aquí podrías calcular el precio del item */}
                            {cop(0)} {/* Placeholder - necesitarías calcular el precio */}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totales y pago */}
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
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
                  
                  <div className="flex items-center justify-between border-t border-gray-200 pt-3 text-lg font-semibold">
                    <span className="text-black">Total:</span>
                    <span className="text-black">{cop(order.total)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Método de pago:</span>
                    <span className="text-black">{order.formaPago}</span>
                  </div>
                </div>
              </div>

              {/* Nota del admin */}
              {order.notaAdmin && (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <h3 className="mb-3 text-lg font-semibold text-black">Nota del Administrador</h3>
                  <p className="text-gray-700">{order.notaAdmin}</p>
                </div>
              )}

              {/* Enviar mensaje al cliente */}
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-black">
                  <Send size={20} />
                  Enviar mensaje al cliente
                </h3>

                <div className="flex flex-wrap gap-2 mb-3">
                  {[
                    `Hola ${order.cliente.nombres}, tu pedido *${order.numeroOrden}* ha sido confirmado. ¡Gracias por elegir Pecado Picoso!`,
                    `Hola ${order.cliente.nombres}, tu pedido *${order.numeroOrden}* esta en preparacion. Pronto estara listo.`,
                    `Hola ${order.cliente.nombres}, tu pedido *${order.numeroOrden}* ya esta en camino. ¡Esperalo pronto!`,
                    `Hola ${order.cliente.nombres}, tu pedido *${order.numeroOrden}* ya esta listo para recoger.`,
                    `Hola ${order.cliente.nombres}, recordatorio: tu pedido *${order.numeroOrden}* tiene pago pendiente. Envianos el comprobante a este numero.`,
                  ].map((preset, idx) => (
                    <button key={idx} onClick={() => setEditMsg(preset)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full border border-gray-200 hover:border-red-400 bg-gray-50 hover:bg-white transition-colors text-left">
                      {preset.slice(0, 40)}…
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
