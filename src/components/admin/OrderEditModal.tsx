import { useState, useEffect } from 'react';
import { X, Save, Plus, Minus, Trash2 } from 'lucide-react';
import { deleteField } from 'firebase/firestore';
import { OrderService } from '../../services/orderService';
import type { PedidoFirestore, OrderStatus, PaymentDetail } from '../../types/order';
import type { PaymentMethod, Service } from '../../lib/whatsapp';
import { cop } from '../../lib/format';
import { BARRIOS } from '../../data/barrios';
import type { Barrio } from '../../data/barrios';

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
    notaAdmin: order.notaAdmin || '',
    subtotal: order.subtotal,
    delivery: order.delivery,
    total: order.total
  });

  const [selectedBarrio, setSelectedBarrio] = useState<Barrio | null>(
    BARRIOS.find(b => b.name === order.cliente.barrio) || null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [usarPagosMixtos, setUsarPagosMixtos] = useState(!!order.detallesPago);
  const [detallesPago, setDetallesPago] = useState<PaymentDetail[]>(
    order.detallesPago || [{ metodo: 'Efectivo', monto: order.total, entregadoDomiciliario: false }]
  );

  // Solo recalcular delivery cuando cambia el tipo de servicio
  useEffect(() => {
    setEditedOrder(prev => {
      let newDelivery = prev.delivery;

      if (prev.servicio !== 'domicilio') {
        // Si no es domicilio, envío = 0
        newDelivery = 0;
      } else if (order.servicio === 'domicilio') {
        // Si el pedido original ya era domicilio, mantener el delivery original
        newDelivery = order.delivery;
      } else if (selectedBarrio) {
        // Si cambió de llevar/local a domicilio, usar el barrio seleccionado
        newDelivery = selectedBarrio.price || 0;
      }

      const newTotal = prev.subtotal + newDelivery;

      return { ...prev, delivery: newDelivery, total: newTotal };
    });
  }, [editedOrder.servicio, selectedBarrio, order.servicio, order.delivery]);

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
      if (editedOrder.items.length === 0) {
        throw new Error('Debe haber al menos un producto');
      }

      const updateData: any = {
        cliente: editedOrder.cliente,
        items: editedOrder.items,
        formaPago: editedOrder.formaPago,
        servicio: editedOrder.servicio,
        estado: editedOrder.estado,
        notaAdmin: editedOrder.notaAdmin,
        subtotal: editedOrder.subtotal,
        delivery: editedOrder.delivery,
        total: editedOrder.total
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

    setEditedOrder(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === itemId ? { ...item, qty: newQty } : item
      )
    }));
  };

  const removeItem = (itemId: string) => {
    setEditedOrder(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
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
                          Total pagos: {cop(detallesPago.reduce((sum, p) => sum + p.monto, 0))} / Total pedido: {cop(editedOrder.total)}
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
                        <label className="block text-sm font-medium text-gray-500">Barrio</label>
                        {editedOrder.cliente.barrio ? (
                          <div className="mt-1 flex items-center gap-2">
                            <span className="flex-1 border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-black">
                              {editedOrder.cliente.barrio} — Envío: {cop(order.delivery)}
                            </span>
                          </div>
                        ) : (
                          <select
                            value={selectedBarrio?.id || ''}
                            onChange={(e) => {
                              const barrio = BARRIOS.find(b => b.id === e.target.value) || null;
                              setSelectedBarrio(barrio);
                              if (barrio) {
                                setEditedOrder(prev => ({
                                  ...prev,
                                  cliente: { ...prev.cliente, barrio: barrio.name }
                                }));
                              }
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
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Productos */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="mb-4 text-lg font-semibold text-black">Productos ({editedOrder.items.length})</h3>
                
                <div className="space-y-3">
                  {editedOrder.items.map((item, index) => (
                    <div key={item.id || index} className="border-b border-gray-100 py-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-black">{item.product.name}</h4>
                          <div className="text-sm text-gray-500">
                            {item.version && `${item.version === 'ahogada' ? 'Ahogada' : 'Picosa'} • `}
                            {item.size && `${item.size === 'pequeno' ? 'Pequeño' : item.size === 'mediano' ? 'Mediano' : 'Grande'} • `}
                            {item.toppingIds.length > 0 && `${item.toppingIds.length} toppings`}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
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
                    </div>
                  ))}
                  
                  {editedOrder.items.length === 0 && (
                    <div className="border border-dashed border-gray-300 p-6 text-center text-gray-500">
                      No hay productos en este pedido
                    </div>
                  )}
                </div>
              </div>

              {/* Totales */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="mb-4 text-lg font-semibold text-black">Totales</h3>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal:</span>
                    <span>{cop(editedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Envío:</span>
                    <span>{cop(editedOrder.delivery)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-2 text-lg font-semibold text-black">
                    <span>Total:</span>
                    <span>{cop(editedOrder.total)}</span>
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
