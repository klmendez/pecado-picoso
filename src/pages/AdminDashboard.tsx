import { useState, useEffect } from 'react';
import {
  Search, Eye, Edit, Trash2, MapPin, Phone, Clock, Plus, Filter
} from 'lucide-react';
import { OrderService } from '../services/orderService';
import { ProductService, type FirestoreProduct } from '../services/productService';
import { WhatsAppNotificationService } from '../services/whatsappNotificationService';
import type { PedidoFirestore, OrderFilters, OrderStatus } from '../types/order';
import { cop } from '../lib/format';
import AdminAuth from '../components/AdminAuth';
import AdminLayout from '../components/admin/AdminLayout';
import OrderEditModal from '../components/admin/OrderEditModal';
import OrderDetailModal from '../components/admin/OrderDetailModal';

const STATUS_LABELS: Record<OrderStatus | 'todos', string> = {
  todos: 'Todos',
  no_pagado: 'Sin Pagar',
  pagado: 'Pagado',
  preparando: 'Preparando',
  en_camino: 'En Camino',
  entregado: 'Entregado',
  cancelado: 'Cancelado'
};



export default function AdminDashboard() {
  const [orders, setOrders] = useState<(PedidoFirestore & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<OrderFilters>({ estado: 'todos' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<(PedidoFirestore & { id: string }) | null>(null);
  const [editingOrder, setEditingOrder] = useState<(PedidoFirestore & { id: string }) | null>(null);
  const [activeTab, setActiveTab] = useState<'pedidos' | 'estadisticas' | 'productos' | 'categorias'>('pedidos');

  const [products, setProducts] = useState<FirestoreProduct[]>([]);
  const [prodLoading, setProdLoading] = useState(false);
  const [prodForm, setProdForm] = useState({
    name: '',
    description: '',
    price: '',
    priceType: 'fijo' as 'fijo' | 'porSize' | 'porVersion',
    priceOptions: {
      fijo: '',
      porSize: { pequeno: '', mediano: '', grande: '' },
      porVersion: { ahogada: { pequeno: '', mediano: '', grande: '' }, picosa: { pequeno: '', mediano: '', grande: '' } },
    },
    toppingsIncludedMax: '4',
    sizes: '',
    categoryId: '',
    image: '',
  });
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [prodError, setProdError] = useState<string | null>(null);

  const [categories, setCategories] = useState<import('../services/categoryService').FirestoreCategory[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', description: '', image: '' });
  const [catError, setCatError] = useState<string | null>(null);


  const stats = {
    total: orders.length,
    sinPagar: orders.filter(o => o.estado === 'no_pagado').length,
    pagado: orders.filter(o => o.estado === 'pagado').length,
    preparando: orders.filter(o => o.estado === 'preparando').length,
    enCamino: orders.filter(o => o.estado === 'en_camino').length,
    entregado: orders.filter(o => o.estado === 'entregado').length,
    cancelado: orders.filter(o => o.estado === 'cancelado').length,
    ingresos: orders.filter(o => o.estado !== 'cancelado').reduce((sum, o) => sum + o.total, 0)
  };

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
        if (msg.includes('permission') || msg.includes('Permission')) {
          setError('Faltan permisos de Firestore. Ve al Firebase Console > Firestore Database > Rules.');
        } else {
          setError('Error al cargar pedidos: ' + msg);
        }
      }
    );

    return unsubscribe;
  }, [filters, searchTerm]);

  const [migrateMsg, setMigrateMsg] = useState<string | null>(null);

  const loadProductsAndCategories = async () => {
    setProdLoading(true);
    setCatLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        ProductService.getProducts(),
        import('../services/categoryService').then(m => m.CategoryService.getCategories()),
      ]);
      setProducts(prods);
      setCategories(cats);
      return cats;
    } catch (err: any) {
      setProdError(err.message || 'Error cargando datos');
      return [];
    } finally {
      setProdLoading(false);
      setCatLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'productos' || activeTab === 'categorias') {
      setMigrateMsg(null);
      loadProductsAndCategories().then((cats) => {
        if (cats.length === 0) {
          setMigrateMsg('No hay categorías. Usa el botón "Migrar datos" para crear los datos iniciales.');
        }
      });
    }
  }, [activeTab]);

  const handleMigrateManual = async () => {
    setMigrateMsg('Migrando...');
    try {
      const { MigrateService } = await import('../services/migrateService');
      const msg = await MigrateService.migrateAll();
      setMigrateMsg(msg);
      await loadProductsAndCategories();
    } catch (err: any) {
      setMigrateMsg('Error: ' + (err.message || err.code || 'Desconocido'));
      console.error('Migration error:', err);
    }
  };

  const buildProductPayload = () => {
    const payload: any = {
      name: prodForm.name.trim(),
      description: prodForm.description.trim(),
      categoryId: prodForm.categoryId,
      image: prodForm.image.trim(),
      toppingsIncludedMax: Number(prodForm.toppingsIncludedMax) || 0,
      sizes: prodForm.sizes.split(',').map(s => s.trim()).filter(Boolean),
    };

    if (prodForm.priceType === 'fijo') {
      payload.priceType = 'fijo';
      payload.priceOptions = { fijo: Number(prodForm.priceOptions.fijo) || 0 };
      payload.price = Number(prodForm.priceOptions.fijo) || 0;
    } else if (prodForm.priceType === 'porSize') {
      payload.priceType = 'porSize';
      payload.priceOptions = {
        porSize: {
          pequeno: Number(prodForm.priceOptions.porSize.pequeno) || 0,
          mediano: Number(prodForm.priceOptions.porSize.mediano) || 0,
          grande: Number(prodForm.priceOptions.porSize.grande) || 0,
        },
      };
      payload.price = Number(prodForm.priceOptions.porSize.pequeno) || 0;
    } else if (prodForm.priceType === 'porVersion') {
      payload.priceType = 'porVersion';
      payload.priceOptions = {
        porVersion: {
          ahogada: {
            pequeno: Number(prodForm.priceOptions.porVersion.ahogada.pequeno) || 0,
            mediano: Number(prodForm.priceOptions.porVersion.ahogada.mediano) || 0,
            grande: Number(prodForm.priceOptions.porVersion.ahogada.grande) || 0,
          },
          picosa: {
            pequeno: Number(prodForm.priceOptions.porVersion.picosa.pequeno) || 0,
            mediano: Number(prodForm.priceOptions.porVersion.picosa.mediano) || 0,
            grande: Number(prodForm.priceOptions.porVersion.picosa.grande) || 0,
          },
        },
      };
      payload.price = Number(prodForm.priceOptions.porVersion.ahogada.pequeno) || 0;
    }
    return payload;
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodForm.name.trim()) return;
    if (!prodForm.categoryId) {
      setProdError('Selecciona una categoría');
      return;
    }
    setProdError(null);

    const payload = buildProductPayload();

    try {
      if (editingProductId) {
        await ProductService.updateProduct(editingProductId, payload);
        setEditingProductId(null);
      } else {
        await ProductService.addProduct(payload);
      }
      setProdForm({
        name: '', description: '', price: '', priceType: 'fijo',
        priceOptions: { fijo: '', porSize: { pequeno: '', mediano: '', grande: '' }, porVersion: { ahogada: { pequeno: '', mediano: '', grande: '' }, picosa: { pequeno: '', mediano: '', grande: '' } } },
        toppingsIncludedMax: '4', sizes: '', categoryId: '', image: '',
      });
      const updated = await ProductService.getProducts();
      setProducts(updated);
    } catch (err: any) {
      setProdError(err.message || 'Error al guardar producto');
    }
  };

  const handleEditProduct = (p: FirestoreProduct) => {
    setEditingProductId(p.id || null);
    setProdForm({
      name: p.name,
      description: p.description || '',
      price: String(p.price ?? ''),
      priceType: (p.priceType as any) || 'fijo',
      priceOptions: {
        fijo: String(p.priceOptions?.fijo ?? ''),
        porSize: {
          pequeno: String(p.priceOptions?.porSize?.pequeno ?? ''),
          mediano: String(p.priceOptions?.porSize?.mediano ?? ''),
          grande: String(p.priceOptions?.porSize?.grande ?? ''),
        },
        porVersion: {
          ahogada: {
            pequeno: String(p.priceOptions?.porVersion?.ahogada?.pequeno ?? ''),
            mediano: String(p.priceOptions?.porVersion?.ahogada?.mediano ?? ''),
            grande: String(p.priceOptions?.porVersion?.ahogada?.grande ?? ''),
          },
          picosa: {
            pequeno: String(p.priceOptions?.porVersion?.picosa?.pequeno ?? ''),
            mediano: String(p.priceOptions?.porVersion?.picosa?.mediano ?? ''),
            grande: String(p.priceOptions?.porVersion?.picosa?.grande ?? ''),
          },
        },
      },
      toppingsIncludedMax: String(p.toppingsIncludedMax ?? 4),
      sizes: (p.sizes || []).join(', '),
      categoryId: p.categoryId,
      image: p.image || '',
    });
  };

  const cancelEditProduct = () => {
    setEditingProductId(null);
    setProdForm({
      name: '', description: '', price: '', priceType: 'fijo',
      priceOptions: { fijo: '', porSize: { pequeno: '', mediano: '', grande: '' }, porVersion: { ahogada: { pequeno: '', mediano: '', grande: '' }, picosa: { pequeno: '', mediano: '', grande: '' } } },
      toppingsIncludedMax: '4', sizes: '', categoryId: '', image: '',
    });
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
      await ProductService.deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
    } catch (err: any) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name.trim()) return;
    setCatError(null);
    try {
      await import('../services/categoryService').then(m => m.CategoryService.addCategory({
        name: catForm.name.trim(),
        description: catForm.description.trim(),
        image: catForm.image.trim(),
      }));
      setCatForm({ name: '', description: '', image: '' });
      const updated = await import('../services/categoryService').then(m => m.CategoryService.getCategories());
      setCategories(updated);
    } catch (err: any) {
      setCatError(err.message || 'Error al guardar categoría');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('¿Eliminar esta categoría? Los productos asociados quedarán sin categoría.')) return;
    try {
      await import('../services/categoryService').then(m => m.CategoryService.deleteCategory(id));
      setCategories(categories.filter(c => c.id !== id));
    } catch (err: any) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await OrderService.updateOrder(orderId, { estado: newStatus });
      const order = orders.find(o => o.id === orderId);
      if (order) {
        WhatsAppNotificationService.sendStatusNotification(order, newStatus);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Error al actualizar el estado del pedido');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Eliminar este pedido permanentemente?')) return;
    try {
      await OrderService.deleteOrder(orderId);
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Error al eliminar el pedido');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Orden', 'Cliente', 'Telefono', 'Direccion', 'Estado', 'Total', 'Fecha', 'Pago'];
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
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `pedidos-pecado-picoso-${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const url = `https://api.whatsapp.com/send?phone=57${cleanPhone}&text=${encodeURIComponent('Hola! Te contactamos desde Pecado Picoso sobre tu pedido.')}`;
    window.open(url, '_blank');
  };

  const handleOpenLocation = (order: PedidoFirestore & { id: string }) => {
    if (order.cliente.coordenadas) {
      const { lat, lng } = order.cliente.coordenadas;
      window.open(`https://maps.google.com/?q=${lat},${lng}`, '_blank');
    } else if (order.cliente.mapsLink) {
      window.open(order.cliente.mapsLink, '_blank');
    }
  };

  const fmtDate = (ts: any) => {
    if (!ts) return '-';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const fmtTime = (ts: any) => {
    if (!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  };

  const metricItems = [
    { label: 'Total', value: stats.total },
    { label: 'Sin Pagar', value: stats.sinPagar, accent: 'text-amber-600' },
    { label: 'Pagado', value: stats.pagado, accent: 'text-emerald-600' },
    { label: 'Preparando', value: stats.preparando, accent: 'text-blue-600' },
    { label: 'En Camino', value: stats.enCamino, accent: 'text-violet-600' },
    { label: 'Entregado', value: stats.entregado, accent: 'text-gray-500' },
    { label: 'Cancelado', value: stats.cancelado, accent: 'text-red-500' },
    { label: 'Ingresos', value: cop(stats.ingresos), accent: 'text-black font-bold' },
  ];

  const statusKeys: (OrderStatus | 'todos')[] = ['todos', 'no_pagado', 'pagado', 'preparando', 'en_camino', 'entregado', 'cancelado'];

  return (
    <AdminAuth>
      <AdminLayout activeSection={activeTab} onChangeSection={setActiveTab} onExportCSV={handleExportCSV}>
        {/* ====== Error banner ====== */}
        {error && (
          <div className="mb-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
              {error}
            </div>
          </div>
        )}

        {activeTab === 'pedidos' && (
          <>
            {/* ====== Métricas ====== */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
              {metricItems.map(m => (
                <div key={m.label}>
                  <div className="text-xl font-medium" style={{ color: m.accent ? undefined : '#333', lineHeight: 1.2 }}>{m.value}</div>
                  <div className="text-xs font-medium mt-1" style={{ color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{m.label}</div>
                </div>
              ))}
            </div>

            {/* ====== Filtros ====== */}
            <div style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0', marginBottom: '16px' }} className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={16} style={{ color: '#888' }} />
                <input
                  type="text"
                  placeholder="Buscar cliente, telefono o # orden..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    minWidth: '200px',
                    border: '1px solid #e0e0e0',
                    background: '#fff',
                    color: '#333',
                    padding: '8px 12px 8px 36px',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#999'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#e0e0e0'; }}
                />
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setFilterOpen(!filterOpen)}
                  className="inline-flex items-center justify-center cursor-pointer"
                  style={{
                    gap: '6px',
                    padding: '8px 14px',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: filters.estado !== 'todos' ? '#dc2626' : '#333',
                    background: '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    transition: 'background 0.15s ease, border-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f5f5f5';
                    e.currentTarget.style.borderColor = '#d0d0d0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fff';
                    e.currentTarget.style.borderColor = '#e0e0e0';
                  }}
                >
                  <Filter size={16} />
                  {filters.estado && filters.estado !== 'todos' ? STATUS_LABELS[filters.estado] : 'Filtrar'}
                </button>
                {filterOpen && (
                  <>
                    <button
                      type="button"
                      className="fixed inset-0 z-40"
                      style={{ background: 'transparent', border: 'none', padding: 0, margin: 0 }}
                      onClick={() => setFilterOpen(false)}
                      aria-label="Cerrar filtros"
                    />
                    <div
                      className="absolute z-50"
                      style={{
                        top: 'calc(100% + 4px)',
                        right: 0,
                        background: '#fff',
                        border: '1px solid #e0e0e0',
                        borderRadius: '4px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        minWidth: '160px',
                        padding: '4px',
                      }}
                    >
                      {statusKeys.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => { setFilters({ ...filters, estado: s }); setFilterOpen(false); }}
                          className="flex items-center w-full cursor-pointer text-left"
                          style={{
                            gap: '8px',
                            padding: '8px 12px',
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: filters.estado === s ? '#dc2626' : '#333',
                            background: filters.estado === s ? '#fff0f0' : 'transparent',
                            border: 'none',
                            borderRadius: '4px',
                            transition: 'background 0.1s ease',
                          }}
                          onMouseEnter={(e) => {
                            if (filters.estado !== s) e.currentTarget.style.background = '#f8f8f8';
                          }}
                          onMouseLeave={(e) => {
                            if (filters.estado !== s) e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          {filters.estado === s && (
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#dc2626', flexShrink: 0 }} />
                          )}
                          {s === 'todos' ? 'Todos' : STATUS_LABELS[s]}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ====== Tabla profesional ====== */}
            <div className="overflow-hidden" style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: '4px' }}>
              {loading ? (
                <div className="p-12 text-center text-gray-500 text-sm">Cargando pedidos...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
                        <th className="px-4 py-3 text-left" style={{ fontWeight: 600, color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pedido</th>
                        <th className="px-4 py-3 text-left" style={{ fontWeight: 600, color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cliente</th>
                        <th className="px-4 py-3 text-left" style={{ fontWeight: 600, color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contacto / Dir.</th>
                        <th className="px-4 py-3 text-left" style={{ fontWeight: 600, color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estado</th>
                        <th className="px-4 py-3 text-left" style={{ fontWeight: 600, color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</th>
                        <th className="px-4 py-3 text-left" style={{ fontWeight: 600, color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha</th>
                        <th className="px-4 py-3 text-right" style={{ fontWeight: 600, color: '#888', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order: PedidoFirestore & { id: string }) => (
                        <tr key={order.id} style={{ borderBottom: '1px solid #f0f0f0', transition: 'background 0.15s ease' }} onMouseEnter={(e) => { e.currentTarget.style.background = '#f8f8f8'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                          <td className="px-4 py-3">
                            <div className="font-mono font-semibold text-gray-900">{order.numeroOrden}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{order.formaPago}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-gray-900">{order.cliente.nombres}</div>
                            <div className="text-xs text-gray-400 mt-0.5">
                              {order.servicio === 'domicilio' ? 'Domicilio' : 'Para llevar'}
                              {order.items.length > 0 && ` · ${order.items.length} items`}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 text-gray-700">
                              <Phone size={12} className="text-gray-400" />
                              <span>{order.cliente.celular}</span>
                              <button onClick={() => handleWhatsApp(order.cliente.celular)} className="text-green-500 hover:text-green-600 ml-1" title="WhatsApp">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                              </button>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-500 text-xs mt-1">
                              <MapPin size={12} className="text-gray-400" />
                              <span className="truncate max-w-[180px]">{order.cliente.direccion || 'Para llevar'}</span>
                              {order.cliente.coordenadas && (
                                <button onClick={() => handleOpenLocation(order)} className="text-blue-500 hover:text-blue-600" title="Ver en mapa">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                                </button>
                              )}
                            </div>
                            {order.cliente.ubicacionTiempoReal && order.cliente.ubicacionTiempoReal.length > 1 && (
                              <div className="text-[10px] text-blue-500 flex items-center gap-1 mt-0.5">
                                <Clock size={10} />
                                Ubicacion en tiempo real
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={order.estado}
                              onChange={(e) => handleStatusUpdate(order.id, e.target.value as OrderStatus)}
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                padding: '4px 24px 4px 8px',
                                border: '1px solid #e0e0e0',
                                borderRadius: '4px',
                                background: '#fff',
                                color: '#333',
                                cursor: 'pointer',
                                outline: 'none',
                              }}
                            >
                              {(Object.keys(STATUS_LABELS) as OrderStatus[]).map(s => (
                                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-gray-900">{cop(order.total)}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-gray-700">{fmtDate(order.createdAt)}</div>
                            <div className="text-[11px] text-gray-400">{fmtTime(order.createdAt)}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end" style={{ gap: '4px' }}>
                              <button
                                onClick={() => setSelectedOrder(order)}
                                title="Ver detalle"
                                className="inline-flex items-center justify-center cursor-pointer"
                                style={{ width: '32px', height: '32px', borderRadius: '4px', border: 'none', background: 'transparent', color: '#888', transition: 'color 0.15s ease, background 0.15s ease' }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = '#555'; e.currentTarget.style.background = '#f5f5f5'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = '#888'; e.currentTarget.style.background = 'transparent'; }}
                              ><Eye size={16} /></button>
                              <button
                                onClick={() => setEditingOrder(order)}
                                title="Editar"
                                className="inline-flex items-center justify-center cursor-pointer"
                                style={{ width: '32px', height: '32px', borderRadius: '4px', border: 'none', background: 'transparent', color: '#888', transition: 'color 0.15s ease, background 0.15s ease' }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = '#555'; e.currentTarget.style.background = '#f5f5f5'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = '#888'; e.currentTarget.style.background = 'transparent'; }}
                              ><Edit size={16} /></button>
                              <button
                                onClick={() => handleDeleteOrder(order.id)}
                                title="Eliminar"
                                className="inline-flex items-center justify-center cursor-pointer"
                                style={{ width: '32px', height: '32px', borderRadius: '4px', border: 'none', background: 'transparent', color: '#888', transition: 'color 0.15s ease, background 0.15s ease' }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#f5f5f5'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = '#888'; e.currentTarget.style.background = 'transparent'; }}
                              ><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {orders.length === 0 && !loading && (
                    <div className="p-12 text-center">
                      <div className="text-gray-400 text-sm">No se encontraron pedidos.</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Contador */}
            <div className="mt-3 text-xs text-gray-400 font-medium">
              {orders.length} pedido{orders.length !== 1 ? 's' : ''}
            </div>
          </>
        )}

        {activeTab === 'estadisticas' && (
          <div className="p-12 text-center">
            <div className="text-sm" style={{ color: '#888' }}>Estadísticas en construcción.</div>
          </div>
        )}

        {activeTab === 'categorias' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Formulario categorías */}
            <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: '4px', padding: '20px' }}>
              <h2 className="text-base font-medium mb-4" style={{ color: '#333' }}>Agregar categoría</h2>
              {catError && (
                <div className="mb-3 p-2 text-sm" style={{ background: '#fff0f0', color: '#e85a5a', borderRadius: '4px' }}>{catError}</div>
              )}
              <form onSubmit={handleAddCategory} className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#666' }}>Nombre *</label>
                  <input
                    type="text" required
                    value={catForm.name}
                    onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                    placeholder="Ej: Gomitas"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '0.875rem', outline: 'none' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#999'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#666' }}>Descripción</label>
                  <input
                    type="text"
                    value={catForm.description}
                    onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                    placeholder="Descripción breve"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '0.875rem', outline: 'none' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#999'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#666' }}>Imagen (URL)</label>
                  <input
                    type="text"
                    value={catForm.image}
                    onChange={(e) => setCatForm({ ...catForm, image: e.target.value })}
                    placeholder="https://..."
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '0.875rem', outline: 'none' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#999'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
                  />
                  {catForm.image && (
                    <img src={catForm.image} alt="preview" className="mt-2 w-12 h-12 object-cover rounded" />
                  )}
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 cursor-pointer"
                  style={{ padding: '8px 16px', fontSize: '0.875rem', fontWeight: 500, color: '#fff', background: '#dc2626', border: 'none', borderRadius: '4px', transition: 'background 0.15s ease' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#b91c1c'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#dc2626'}
                >
                  <Plus size={16} /> Agregar categoría
                </button>
              </form>
            </div>

            {/* Lista categorías */}
            <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: '4px', padding: '20px' }}>
              <h2 className="text-base font-medium mb-4" style={{ color: '#333' }}>Categorías ({categories.length})</h2>
              {catLoading ? (
                <div className="text-center text-sm" style={{ color: '#888' }}>Cargando...</div>
              ) : categories.length === 0 ? (
                <div className="text-center text-sm" style={{ color: '#888' }}>No hay categorías registradas.</div>
              ) : (
                <div className="flex flex-col gap-2" style={{ maxHeight: '520px', overflowY: 'auto' }}>
                  {categories.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 p-2" style={{ borderBottom: '1px solid #f0f0f0' }}>
                      {c.image ? (
                        <img src={c.image} alt={c.name} className="w-12 h-12 object-cover rounded" style={{ flexShrink: 0 }} />
                      ) : (
                        <div className="w-12 h-12 flex items-center justify-center" style={{ background: '#f5f5f5', borderRadius: '4px', flexShrink: 0 }}>
                          <span style={{ color: '#ccc', fontSize: '0.75rem' }}>IMG</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: '#333' }}>{c.name}</p>
                        <p className="text-xs" style={{ color: '#888' }}>{c.description || 'Sin descripción'}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteCategory(c.id!)}
                        className="inline-flex items-center justify-center cursor-pointer"
                        style={{ width: '32px', height: '32px', borderRadius: '4px', border: 'none', background: 'transparent', color: '#888', transition: 'color 0.15s ease, background 0.15s ease' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#f5f5f5'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#888'; e.currentTarget.style.background = 'transparent'; }}
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'productos' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Formulario productos */}
            <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: '4px', padding: '20px' }}>
              <h2 className="text-base font-medium mb-4" style={{ color: '#333' }}>
                {editingProductId ? 'Editar producto' : 'Agregar producto'}
              </h2>
              {prodError && (
                <div className="mb-3 p-2 text-sm" style={{ background: '#fff0f0', color: '#e85a5a', borderRadius: '4px' }}>{prodError}</div>
              )}
              {migrateMsg && (
                <div className="mb-3 p-2 text-sm" style={{ background: '#f0f8ff', color: '#2563eb', borderRadius: '4px' }}>
                  {migrateMsg}
                </div>
              )}
              {(!prodLoading) && (
                <button
                  type="button"
                  onClick={handleMigrateManual}
                  className="mb-3 inline-flex items-center justify-center gap-2 cursor-pointer"
                  style={{ padding: '8px 16px', fontSize: '0.875rem', fontWeight: 500, color: '#fff', background: '#dc2626', border: 'none', borderRadius: '4px', transition: 'background 0.15s ease' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#b91c1c'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#dc2626'}
                >
                  <Plus size={16} /> Migrar datos iniciales
                </button>
              )}

              {/* Instrucciones paso a paso */}
              <div className="mb-4 p-3 text-xs" style={{ background: '#f8f8f8', border: '1px solid #e0e0e0', borderRadius: '4px', color: '#555' }}>
                <p className="font-semibold mb-1">¿Cómo agregar una imagen?</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Ve a <strong>postimg.cc</strong> desde tu navegador.</li>
                  <li>Haz clic en "Elegir imágenes" y selecciona la imagen de tu computador.</li>
                  <li>Una vez subida, copia el <strong>link directo de la imagen</strong> (termina en .jpg, .png o .webp).</li>
                  <li>Pégalo en el campo "Imagen (URL)" de abajo.</li>
                </ol>
              </div>

              <form onSubmit={handleAddProduct} className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#666' }}>Nombre *</label>
                  <input
                    type="text" required
                    value={prodForm.name}
                    onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                    placeholder="Nombre del producto"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '0.875rem', outline: 'none' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#999'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#666' }}>Tipo de precio</label>
                  <select
                    value={prodForm.priceType}
                    onChange={(e) => setProdForm({ ...prodForm, priceType: e.target.value as any })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '0.875rem', outline: 'none', background: '#fff' }}
                  >
                    <option value="fijo">Precio fijo</option>
                    <option value="porSize">Por tamaño</option>
                    <option value="porVersion">Por versión (ahogada/picosa)</option>
                  </select>
                </div>

                {prodForm.priceType === 'fijo' && (
                  <div>
                    <label className="block text-xs font-semibold mb-1" style={{ color: '#666' }}>Precio fijo (COP)</label>
                    <input
                      type="number" min="0"
                      value={prodForm.priceOptions.fijo}
                      onChange={(e) => setProdForm({ ...prodForm, priceOptions: { ...prodForm.priceOptions, fijo: e.target.value } })}
                      placeholder="Ej: 8500"
                      style={{ width: '100%', padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '0.875rem', outline: 'none' }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#999'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
                    />
                  </div>
                )}

                {prodForm.priceType === 'porSize' && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold" style={{ color: '#666' }}>Precios por tamaño</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['pequeno', 'mediano', 'grande'] as const).map((sz) => (
                        <div key={sz}>
                          <span className="text-[10px] uppercase tracking-wider" style={{ color: '#888' }}>{sz}</span>
                          <input
                            type="number" min="0"
                            value={prodForm.priceOptions.porSize[sz]}
                            onChange={(e) => setProdForm({
                              ...prodForm,
                              priceOptions: { ...prodForm.priceOptions, porSize: { ...prodForm.priceOptions.porSize, [sz]: e.target.value } }
                            })}
                            placeholder="0"
                            style={{ width: '100%', padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '0.875rem', outline: 'none' }}
                            onFocus={(e) => e.currentTarget.style.borderColor = '#999'}
                            onBlur={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {prodForm.priceType === 'porVersion' && (
                  <div className="flex flex-col gap-3">
                    <label className="text-xs font-semibold" style={{ color: '#666' }}>Precios por versión</label>
                    {(['ahogada', 'picosa'] as const).map((ver) => (
                      <div key={ver}>
                        <span className="text-xs font-semibold" style={{ color: '#666' }}>{ver === 'ahogada' ? 'Ahogada' : 'Picosa'}</span>
                        <div className="grid grid-cols-3 gap-2 mt-1">
                          {(['pequeno', 'mediano', 'grande'] as const).map((sz) => (
                            <input
                              key={sz}
                              type="number" min="0"
                              value={prodForm.priceOptions.porVersion[ver][sz]}
                              onChange={(e) => setProdForm({
                                ...prodForm,
                                priceOptions: {
                                  ...prodForm.priceOptions,
                                  porVersion: {
                                    ...prodForm.priceOptions.porVersion,
                                    [ver]: { ...prodForm.priceOptions.porVersion[ver], [sz]: e.target.value }
                                  }
                                }
                              })}
                              placeholder={sz}
                              style={{ width: '100%', padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '0.875rem', outline: 'none' }}
                              onFocus={(e) => e.currentTarget.style.borderColor = '#999'}
                              onBlur={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#666' }}>Toppings incluidos</label>
                  <input
                    type="number" min="0"
                    value={prodForm.toppingsIncludedMax}
                    onChange={(e) => setProdForm({ ...prodForm, toppingsIncludedMax: e.target.value })}
                    placeholder="4"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '0.875rem', outline: 'none' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#999'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#666' }}>Tamaños (separados por coma)</label>
                  <input
                    type="text"
                    value={prodForm.sizes}
                    onChange={(e) => setProdForm({ ...prodForm, sizes: e.target.value })}
                    placeholder="pequeno, mediano, grande"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '0.875rem', outline: 'none' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#999'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#666' }}>Categoría *</label>
                  <select
                    value={prodForm.categoryId}
                    onChange={(e) => setProdForm({ ...prodForm, categoryId: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '0.875rem', outline: 'none', background: '#fff' }}
                  >
                    <option value="">Selecciona una categoría</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {categories.length === 0 && (
                    <p className="text-xs mt-1" style={{ color: '#e85a5a' }}>Primero crea una categoría en la pestaña "Categorías".</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#666' }}>Descripción</label>
                  <input
                    type="text"
                    value={prodForm.description}
                    onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                    placeholder="Descripción breve"
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '0.875rem', outline: 'none' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#999'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: '#666' }}>Imagen (URL)</label>
                  <input
                    type="text"
                    value={prodForm.image}
                    onChange={(e) => setProdForm({ ...prodForm, image: e.target.value })}
                    placeholder="https://..."
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '0.875rem', outline: 'none' }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#999'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#e0e0e0'}
                  />
                  {prodForm.image && (
                    <img src={prodForm.image} alt="preview" className="mt-2 w-12 h-12 object-cover rounded" />
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 cursor-pointer flex-1"
                    style={{ padding: '8px 16px', fontSize: '0.875rem', fontWeight: 500, color: '#fff', background: '#dc2626', border: 'none', borderRadius: '4px', transition: 'background 0.15s ease' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#b91c1c'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#dc2626'}
                  >
                    <Plus size={16} /> {editingProductId ? 'Guardar cambios' : 'Agregar producto'}
                  </button>
                  {editingProductId && (
                    <button
                      type="button"
                      onClick={cancelEditProduct}
                      className="inline-flex items-center justify-center gap-2 cursor-pointer"
                      style={{ padding: '8px 16px', fontSize: '0.875rem', fontWeight: 500, color: '#666', background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: '4px', transition: 'background 0.15s ease' }}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Lista productos */}
            <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: '4px', padding: '20px' }}>
              <h2 className="text-base font-medium mb-4" style={{ color: '#333' }}>Productos ({products.length})</h2>
              {prodLoading ? (
                <div className="text-center text-sm" style={{ color: '#888' }}>Cargando...</div>
              ) : products.length === 0 ? (
                <div className="text-center text-sm" style={{ color: '#888' }}>No hay productos registrados.</div>
              ) : (
                <div className="flex flex-col gap-2" style={{ maxHeight: '520px', overflowY: 'auto' }}>
                  {products.map((p) => {
                    const catName = categories.find(c => c.id === p.categoryId)?.name || 'Sin categoría';
                    return (
                      <div key={p.id} className="flex items-center gap-3 p-2" style={{ borderBottom: '1px solid #f0f0f0' }}>
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-12 h-12 object-cover rounded" style={{ flexShrink: 0 }} />
                        ) : (
                          <div className="w-12 h-12 flex items-center justify-center" style={{ background: '#f5f5f5', borderRadius: '4px', flexShrink: 0 }}>
                            <span style={{ color: '#ccc', fontSize: '0.75rem' }}>IMG</span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: '#333' }}>{p.name}</p>
                          <p className="text-xs" style={{ color: '#888' }}>
                            {cop(p.price ?? 0)} · {catName}
                          </p>
                        </div>
                        <button
                          onClick={() => handleEditProduct(p)}
                          className="inline-flex items-center justify-center cursor-pointer"
                          style={{ width: '32px', height: '32px', borderRadius: '4px', border: 'none', background: 'transparent', color: '#888', transition: 'color 0.15s ease, background 0.15s ease' }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = '#2563eb'; e.currentTarget.style.background = '#f5f5f5'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = '#888'; e.currentTarget.style.background = 'transparent'; }}
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id!)}
                          className="inline-flex items-center justify-center cursor-pointer"
                          style={{ width: '32px', height: '32px', borderRadius: '4px', border: 'none', background: 'transparent', color: '#888', transition: 'color 0.15s ease, background 0.15s ease' }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#f5f5f5'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = '#888'; e.currentTarget.style.background = 'transparent'; }}
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ====== Modales ====== */}
        {selectedOrder && (
          <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
        )}
        {editingOrder && (
          <OrderEditModal order={editingOrder} onClose={() => setEditingOrder(null)} onSave={() => setEditingOrder(null)} />
        )}
      </AdminLayout>
    </AdminAuth>
  );
}
