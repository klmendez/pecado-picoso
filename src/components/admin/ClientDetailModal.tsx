import { X, MapPin, Phone, ShoppingBag, DollarSign, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';
import { OrderService } from '../../services/orderService';
import type { FirestoreClient } from '../../services/clientService';
import type { PedidoFirestore } from '../../types/order';
import { cop } from '../../lib/format';

interface ClientDetailModalProps {
  client: FirestoreClient | null;
  onClose: () => void;
}

export default function ClientDetailModal({ client, onClose }: ClientDetailModalProps) {
  const [orders, setOrders] = useState<(PedidoFirestore & { id: string })[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!client) return;

    const loadClientOrders = async () => {
      setLoading(true);
      try {
        const allOrders = await OrderService.getOrders();
        const clientOrders = allOrders.filter(
          order => order.cliente.celular.replace(/\D/g, '') === client.celular
        );
        setOrders(clientOrders);
      } catch (error) {
        console.error('Error loading client orders:', error);
      } finally {
        setLoading(false);
      }
    };

    loadClientOrders();
  }, [client]);

  if (!client) return null;

  const lastPurchase = client.ultimoPedido?.toDate ? client.ultimoPedido.toDate() : new Date();
  const daysSince = Math.floor((new Date().getTime() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="bg-white max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-900 text-white font-bold text-lg">
              {client.nombres.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{client.nombres}</h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Phone size={14} />
                {client.celular}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 p-6 bg-gray-50 border-b border-gray-200">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-gray-500 text-xs mb-1">
              <ShoppingBag size={14} />
              <span>Pedidos</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{client.totalPedidos}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-gray-500 text-xs mb-1">
              <DollarSign size={14} />
              <span>Total Gastado</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{cop(client.totalGastado)}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-gray-500 text-xs mb-1">
              <Calendar size={14} />
              <span>Última Compra</span>
            </div>
            <div className="text-sm font-semibold text-gray-900">
              {daysSince === 0 ? 'Hoy' : daysSince === 1 ? 'Ayer' : `Hace ${daysSince} días`}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Direcciones */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                <MapPin size={16} />
                Direcciones Guardadas ({client.direcciones?.length || 0})
              </h3>
              {client.direcciones && client.direcciones.length > 0 ? (
                <div className="space-y-2">
                  {client.direcciones.map((addr, idx) => (
                    <div key={idx} className="border-b border-gray-100 py-2">
                      <div className="font-medium text-gray-900 text-sm">{addr.direccion}</div>
                      {addr.barrio && (
                        <div className="text-xs text-gray-500 mt-1">Barrio: {addr.barrio}</div>
                      )}
                      {addr.referencia && (
                        <div className="text-xs text-gray-500 mt-1">Ref: {addr.referencia}</div>
                      )}
                      <div className="text-[11px] text-gray-400 mt-1">
                        Última vez: {addr.lastUsed?.toDate ? addr.lastUsed.toDate().toLocaleDateString('es-CO') : 'N/A'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-400 text-center py-8">
                  No hay direcciones guardadas
                </div>
              )}
            </div>

            {/* Historial de Pedidos */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                <ShoppingBag size={16} />
                Historial de Pedidos ({orders.length})
              </h3>
              {loading ? (
                <div className="text-sm text-gray-400 text-center py-8">Cargando pedidos...</div>
              ) : orders.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {orders.map((order) => {
                    const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();
                    return (
                      <div key={order.id} className="border-b border-gray-100 py-2">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-mono text-xs font-bold text-gray-900">{order.numeroOrden}</div>
                          <div className="text-xs text-gray-500">
                            {orderDate.toLocaleDateString('es-CO')}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-gray-900">{cop(order.total)}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {order.items.length} producto{order.items.length !== 1 ? 's' : ''} · {order.estado}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {order.servicio === 'domicilio' ? `📍 ${order.cliente.direccion}` : '🏪 Para llevar'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-gray-400 text-center py-8">
                  No hay pedidos registrados
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
