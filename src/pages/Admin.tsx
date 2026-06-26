import { useState, useEffect } from 'react';
import { Search, Filter, Download, Eye, Edit, Trash2, MapPin, Phone, Clock } from 'lucide-react';
import { OrderService } from '../services/orderService';
import { WhatsAppNotificationService } from '../services/whatsappNotificationService';
import type { PedidoFirestore, OrderFilters, OrderStatus } from '../types/order';
import { cop } from '../lib/format';
import AdminAuth from '../components/AdminAuth';
import OrderEditModal from '../components/admin/OrderEditModal';
import OrderDetailModal from '../components/admin/OrderDetailModal';

const STATUS_LABELS: Record<OrderStatus, string> = {
  no_pagado: 'Sin Pagar',
  pagado: 'Pagado',
  preparando: 'Preparando',
  en_camino: 'En Camino',
  entregado: 'Entregado',
  cancelado: 'Cancelado'
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  no_pagado: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  pagado: 'bg-green-100 text-green-700 border-green-300',
  preparando: 'bg-blue-100 text-blue-700 border-blue-300',
  en_camino: 'bg-purple-100 text-purple-700 border-purple-300',
  entregado: 'bg-gray-100 text-gray-700 border-gray-300',
  cancelado: 'bg-red-100 text-red-700 border-red-300'
};

export default function Admin() {
  const [orders, setOrders] = useState<(PedidoFirestore & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<OrderFilters>({ estado: 'todos' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<(PedidoFirestore & { id: string }) | null>(null);
  const [editingOrder, setEditingOrder] = useState<(PedidoFirestore & { id: string }) | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    noPagado: 0,
    pagado: 0,
    preparando: 0,
    enCamino: 0,
    entregado: 0,
    cancelado: 0
  });

  // Cargar pedidos en tiempo real
  useEffect(() => {
    setError(null);
    const unsubscribe = OrderService.subscribeToOrders(
      (ordersData) => {
        setOrders(ordersData);
        setLoading(false);
        setError(null);
      },
      { ...filters, busqueda: searchTerm },
      (err) => {
        setLoading(false);
        const msg = err.message || '';
        if (msg.includes('permission') || msg.includes('Permission') || msg.includes('permiso')) {
          setError('Faltan permisos de Firestore. La app intento autenticarse anonimamente; si aun falla, ve al Firebase Console > Firestore Database > Rules y pega el contenido de firestore.rules del proyecto.');
        } else {
          setError('Error al cargar pedidos: ' + msg);
        }
      }
    );

    return unsubscribe;
  }, [filters, searchTerm]);

  // Cargar estadísticas
  useEffect(() => {
    const loadStats = async () => {
      try {
        const statsData = await OrderService.getOrderStats();
        setStats(statsData);
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    };
    loadStats();
  }, [orders]);

  // Actualizar estado del pedido
  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await OrderService.updateOrder(orderId, { estado: newStatus });
      
      // Enviar notificación WhatsApp al cliente sobre el cambio de estado
      const order = orders.find(o => o.id === orderId);
      if (order) {
        WhatsAppNotificationService.sendStatusNotification(order, newStatus);
      }
      
      // El estado se actualiza automáticamente por la suscripción en tiempo real
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Error al actualizar el estado del pedido');
    }
  };

  // Eliminar pedido
  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este pedido?')) return;
    
    try {
      await OrderService.deleteOrder(orderId);
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Error al eliminar el pedido');
    }
  };

  // Exportar a CSV
  const handleExportCSV = () => {
    const headers = ['Número de Orden', 'Cliente', 'Teléfono', 'Dirección', 'Estado', 'Total', 'Fecha', 'Pago'];
    const csvData = orders.map(order => [
      order.numeroOrden,
      order.cliente.nombres,
      order.cliente.celular,
      order.cliente.direccion || 'Para llevar',
      STATUS_LABELS[order.estado],
      order.total,
      order.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A',
      order.formaPago
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `pedidos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Abrir WhatsApp
  const handleWhatsApp = (phone: string, message?: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const defaultMessage = message || 'Hola! Te contactamos desde Pecado Picoso sobre tu pedido.';
    const url = `https://api.whatsapp.com/send?phone=57${cleanPhone}&text=${encodeURIComponent(defaultMessage)}`;
    window.open(url, '_blank');
  };

  // Abrir ubicación en Google Maps
  const handleOpenLocation = (order: PedidoFirestore & { id: string }) => {
    if (order.cliente.coordenadas) {
      const { lat, lng } = order.cliente.coordenadas;
      const url = `https://maps.google.com/?q=${lat},${lng}`;
      window.open(url, '_blank');
    } else if (order.cliente.mapsLink) {
      window.open(order.cliente.mapsLink, '_blank');
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-crema flex items-center justify-center">
        <div className="text-neutral-900">Cargando pedidos...</div>
      </div>
    );
  }

  return (
    <AdminAuth>
      <div className="min-h-screen bg-crema text-neutral-900">
      {/* Error banner */}
      {error && (
        <div className="border-b border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <div className="text-red-600 font-bold text-sm">Error:</div>
            <div className="text-red-700 text-sm">{error}</div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="border-b border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Panel de Administración</h1>
            <p className="text-gray-500">Gestión de pedidos - Pecado Picoso</p>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 hover:bg-green-700"
          >
            <Download size={16} />
            Exportar CSV
          </button>
        </div>

        {/* Estadísticas */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          <div className="rounded-lg bg-gray-100 p-3 text-center">
            <div className="text-lg font-bold text-black">{stats.total}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="rounded-lg bg-yellow-100 p-3 text-center">
            <div className="text-lg font-bold text-yellow-700">{stats.noPagado}</div>
            <div className="text-xs text-gray-500">Sin Pagar</div>
          </div>
          <div className="rounded-lg bg-green-100 p-3 text-center">
            <div className="text-lg font-bold text-green-700">{stats.pagado}</div>
            <div className="text-xs text-gray-500">Pagados</div>
          </div>
          <div className="rounded-lg bg-blue-100 p-3 text-center">
            <div className="text-lg font-bold text-blue-700">{stats.preparando}</div>
            <div className="text-xs text-gray-500">Preparando</div>
          </div>
          <div className="rounded-lg bg-purple-100 p-3 text-center">
            <div className="text-lg font-bold text-purple-700">{stats.enCamino}</div>
            <div className="text-xs text-gray-500">En Camino</div>
          </div>
          <div className="rounded-lg bg-gray-100 p-3 text-center">
            <div className="text-lg font-bold text-gray-700">{stats.entregado}</div>
            <div className="text-xs text-gray-500">Entregados</div>
          </div>
          <div className="rounded-lg bg-red-100 p-3 text-center">
            <div className="text-lg font-bold text-red-700">{stats.cancelado}</div>
            <div className="text-xs text-gray-500">Cancelados</div>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por cliente, teléfono o número de orden..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-2 text-sm focus:border-rojo focus:outline-none"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 hover:bg-gray-50"
            >
              <Filter size={16} />
              Filtros
            </button>
          </div>

          <select
            value={filters.estado || 'todos'}
            onChange={(e) => setFilters({ ...filters, estado: e.target.value as OrderStatus | 'todos' })}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-rojo focus:outline-none"
          >
            <option value="todos">Todos los estados</option>
            <option value="no_pagado">Sin Pagar</option>
            <option value="pagado">Pagado</option>
            <option value="preparando">Preparando</option>
            <option value="en_camino">En Camino</option>
            <option value="entregado">Entregado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      {/* Tabla de pedidos */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Orden</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Cliente</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Contacto</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Dirección</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Total</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Fecha</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-mono text-sm">{order.numeroOrden}</div>
                  <div className="text-xs text-gray-500">{order.formaPago}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold">{order.cliente.nombres}</div>
                  <div className="text-xs text-gray-500">{order.servicio === 'domicilio' ? 'Domicilio' : 'Para llevar'}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{order.cliente.celular}</span>
                    <button
                      onClick={() => handleWhatsApp(order.cliente.celular)}
                      className="text-green-400 hover:text-green-300"
                    >
                      <Phone size={14} />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{order.cliente.direccion || 'Para llevar'}</span>
                    {order.cliente.coordenadas && (
                      <button
                        onClick={() => handleOpenLocation(order)}
                        className="text-blue-600 hover:text-blue-500"
                      >
                        <MapPin size={14} />
                      </button>
                    )}
                  </div>
                  {order.cliente.ubicacionTiempoReal && order.cliente.ubicacionTiempoReal.length > 1 && (
                    <div className="text-xs text-blue-600 flex items-center gap-1">
                      <Clock size={12} />
                      Ubicación en tiempo real
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={order.estado}
                    onChange={(e) => handleStatusUpdate(order.id, e.target.value as OrderStatus)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_COLORS[order.estado]} bg-transparent`}
                  >
                    <option value="no_pagado">Sin Pagar</option>
                    <option value="pagado">Pagado</option>
                    <option value="preparando">Preparando</option>
                    <option value="en_camino">En Camino</option>
                    <option value="entregado">Entregado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold">{cop(order.total)}</div>
                  <div className="text-xs text-gray-500">{order.items.length} productos</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm">{formatDate(order.createdAt)}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="rounded p-1 text-blue-600 hover:bg-blue-100"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => setEditingOrder(order)}
                      className="rounded p-1 text-yellow-600 hover:bg-yellow-100"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteOrder(order.id)}
                      className="rounded p-1 text-red-600 hover:bg-red-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {orders.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            No se encontraron pedidos con los filtros aplicados.
          </div>
        )}
      </div>

      {/* Modales */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      {editingOrder && (
        <OrderEditModal
          order={editingOrder}
          onClose={() => setEditingOrder(null)}
          onSave={() => setEditingOrder(null)}
        />
      )}
      </div>
    </AdminAuth>
  );
}
