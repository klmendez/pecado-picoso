import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Eye, EyeOff, Edit, Trash2, MapPin, Phone, Clock, Plus, Filter, ArrowUp, ArrowDown, Download, UserPlus, X as XIcon
} from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { OrderService } from '../services/orderService';
import { ProductService, type FirestoreProduct } from '../services/productService';
import { ClientService, type FirestoreClient } from '../services/clientService';
import { WhatsAppNotificationService } from '../services/whatsappNotificationService';
import { PromotionService } from '../services/promotionService';
import type { PedidoFirestore, OrderFilters, OrderStatus } from '../types/order';
import type { Promotion, PromotionType } from '../types/promotion';
import { cop } from '../lib/format';
import { isBirthdayToday } from '../lib/birthday';
import { VIP_MIN_PEDIDOS, VIP_MIN_GASTADO, INACTIVE_DAYS_THRESHOLD } from '../data/constants';
import { buildOrderQuickMessages, buildClientQuickMessages } from '../lib/whatsappTemplates';
import AdminAuth from '../components/AdminAuth';
import AdminLayout from '../components/admin/AdminLayout';
import OrderEditModal from '../components/admin/OrderEditModal';
import ClientDetailModal from '../components/admin/ClientDetailModal';
import WhatsAppQuickSend from '../components/admin/WhatsAppQuickSend';
import BirthdayCalendar from '../components/admin/BirthdayCalendar';
import { TOPPINGS } from '../data/toppings';
import { ToppingAvailabilityService } from '../services/toppingAvailabilityService';
import { useToppingAvailability } from '../hooks/useToppingAvailability';

const STATUS_LABELS: Record<OrderStatus | 'todos', string> = {
  todos: 'Todos',
  no_pagado: 'Sin Pagar',
  pagado: 'Pagado',
  preparando: 'Preparando',
  en_camino: 'En Camino',
  entregado: 'Entregado',
  cancelado: 'Cancelado'
};

type ClientSortField = 'nombres' | 'totalPedidos' | 'totalGastado' | 'ultimoPedido';

function SortableClientHeader({ field, label, sortBy, sortDir, onSort }: {
  field: ClientSortField;
  label: string;
  sortBy: ClientSortField;
  sortDir: 'asc' | 'desc';
  onSort: (field: ClientSortField) => void;
}) {
  const active = sortBy === field;
  return (
    <th className="px-4 py-3 text-left font-semibold text-xs text-gray-600 uppercase tracking-wide">
      <button onClick={() => onSort(field)} className="flex items-center gap-1 hover:text-gray-900">
        {label}
        {active && (sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
      </button>
    </th>
  );
}



export default function AdminDashboard() {
  const [orders, setOrders] = useState<(PedidoFirestore & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<OrderFilters>({ estado: 'todos' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const navigate = useNavigate();
  const { disabledToppingIds } = useToppingAvailability();
  const [editingOrder, setEditingOrder] = useState<(PedidoFirestore & { id: string }) | null>(null);
  const [activeTab, setActiveTab] = useState<'pedidos' | 'clientes' | 'cumpleanos' | 'estadisticas' | 'productos' | 'categorias' | 'promociones'>('pedidos');

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
    disponible: true,
  });
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [prodError, setProdError] = useState<string | null>(null);

  const [categories, setCategories] = useState<import('../services/categoryService').FirestoreCategory[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', description: '', image: '' });
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [catError, setCatError] = useState<string | null>(null);

  const [clients, setClients] = useState<FirestoreClient[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<FirestoreClient | null>(null);
  const [clientSortBy, setClientSortBy] = useState<'nombres' | 'totalPedidos' | 'totalGastado' | 'ultimoPedido'>('ultimoPedido');
  const [clientSortDir, setClientSortDir] = useState<'asc' | 'desc'>('desc');
  const [clientFilter, setClientFilter] = useState<'todos' | 'vip' | 'inactivos'>('todos');
  const [clientTagFilter, setClientTagFilter] = useState<string>('');
  const [showAddClient, setShowAddClient] = useState(false);
  const [newClientForm, setNewClientForm] = useState({ nombres: '', celular: '', fechaNacimiento: '', correo: '' });
  const [newClientError, setNewClientError] = useState('');
  const [savingNewClient, setSavingNewClient] = useState(false);


  // Promociones state
  const [promos, setPromos] = useState<(Promotion & { id: string })[]>([]);
  const [promosLoading, setPromosLoading] = useState(false);
  const [promoForm, setPromoForm] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'porcentaje' as PromotionType,
    valor: '',
    productosIds: '' as string,
    cantidadMinima: '',
    activa: true,
    fechaInicio: '',
    fechaFin: '',
  });
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  const loadPromos = async () => {
    setPromosLoading(true);
    try {
      const data = await PromotionService.getPromotions();
      setPromos(data);
    } catch (err: any) {
      setPromoError(err.message || 'Error al cargar promociones');
    } finally {
      setPromosLoading(false);
    }
  };

  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoForm.nombre.trim() || !promoForm.valor) return;
    setPromoError(null);
    try {
      const data: any = {
        nombre: promoForm.nombre.trim(),
        descripcion: promoForm.descripcion.trim(),
        tipo: promoForm.tipo,
        valor: Number(promoForm.valor),
        productosIds: promoForm.productosIds ? promoForm.productosIds.split(',').map(s => s.trim()).filter(Boolean) : [],
        activa: promoForm.activa,
      };
      if (promoForm.cantidadMinima) data.cantidadMinima = Number(promoForm.cantidadMinima);
      if (promoForm.fechaInicio) data.fechaInicio = Timestamp.fromDate(new Date(promoForm.fechaInicio));
      if (promoForm.fechaFin) data.fechaFin = Timestamp.fromDate(new Date(promoForm.fechaFin));

      if (editingPromoId) {
        await PromotionService.updatePromotion(editingPromoId, data);
        setEditingPromoId(null);
      } else {
        await PromotionService.addPromotion(data);
      }
      setPromoForm({ nombre: '', descripcion: '', tipo: 'porcentaje', valor: '', productosIds: '', cantidadMinima: '', activa: true, fechaInicio: '', fechaFin: '' });
      await loadPromos();
    } catch (err: any) {
      setPromoError(err.message || 'Error al guardar');
    }
  };

  const handleEditPromo = (p: Promotion & { id: string }) => {
    setEditingPromoId(p.id);
    setPromoForm({
      nombre: p.nombre,
      descripcion: p.descripcion || '',
      tipo: p.tipo,
      valor: String(p.valor),
      productosIds: (p.productosIds || []).join(', '),
      cantidadMinima: p.cantidadMinima ? String(p.cantidadMinima) : '',
      activa: p.activa,
      fechaInicio: p.fechaInicio?.toDate ? p.fechaInicio.toDate().toISOString().slice(0, 16) : '',
      fechaFin: p.fechaFin?.toDate ? p.fechaFin.toDate().toISOString().slice(0, 16) : '',
    });
  };

  const handleDeletePromo = async (id: string) => {
    if (!confirm('¿Eliminar esta promoción?')) return;
    try {
      await PromotionService.deletePromotion(id);
      await loadPromos();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleTogglePromo = async (p: Promotion & { id: string }) => {
    try {
      await PromotionService.updatePromotion(p.id, { activa: !p.activa });
      await loadPromos();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

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
    if (activeTab === 'clientes' || activeTab === 'cumpleanos') {
      loadClients();
    }
    if (activeTab === 'promociones') {
      if (products.length === 0) loadProductsAndCategories();
      loadPromos();
    }
  }, [activeTab]);

  const loadClients = async () => {
    setClientsLoading(true);
    try {
      const allClients = await ClientService.getAllClients();
      setClients(allClients);
    } catch (err) {
      console.error('Error loading clients:', err);
    } finally {
      setClientsLoading(false);
    }
  };

  const toggleClientSort = (field: typeof clientSortBy) => {
    if (clientSortBy === field) {
      setClientSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setClientSortBy(field);
      setClientSortDir('desc');
    }
  };

  const allClientTags = Array.from(new Set(clients.flatMap(c => c.etiquetas || []))).sort();

  const daysSinceLastPurchase = (client: FirestoreClient) => {
    const last = client.ultimoPedido?.toDate ? client.ultimoPedido.toDate() : new Date();
    return Math.floor((new Date().getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
  };

  const isClientVip = (client: FirestoreClient) =>
    client.totalPedidos >= VIP_MIN_PEDIDOS || client.totalGastado >= VIP_MIN_GASTADO;

  const isClientInactive = (client: FirestoreClient) => daysSinceLastPurchase(client) >= INACTIVE_DAYS_THRESHOLD;

  const filteredSortedClients = clients
    .filter(c =>
      clientSearchTerm === '' ||
      c.nombres.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
      c.celular.includes(clientSearchTerm.replace(/\D/g, ''))
    )
    .filter(c => clientFilter === 'todos' || (clientFilter === 'vip' ? isClientVip(c) : isClientInactive(c)))
    .filter(c => !clientTagFilter || (c.etiquetas || []).includes(clientTagFilter))
    .sort((a, b) => {
      let cmp = 0;
      if (clientSortBy === 'nombres') cmp = a.nombres.localeCompare(b.nombres);
      else if (clientSortBy === 'totalPedidos') cmp = a.totalPedidos - b.totalPedidos;
      else if (clientSortBy === 'totalGastado') cmp = a.totalGastado - b.totalGastado;
      else {
        const aTime = a.ultimoPedido?.toMillis ? a.ultimoPedido.toMillis() : 0;
        const bTime = b.ultimoPedido?.toMillis ? b.ultimoPedido.toMillis() : 0;
        cmp = aTime - bTime;
      }
      return clientSortDir === 'asc' ? cmp : -cmp;
    });

  const exportClientsCSV = () => {
    const header = ['Nombre', 'Teléfono', 'Correo', 'Cumpleaños', 'Pedidos', 'Total Gastado', 'Última Compra', 'Etiquetas', 'Nota'];
    const rows = filteredSortedClients.map(c => [
      c.nombres,
      c.celular,
      c.correo || '',
      c.fechaNacimiento || '',
      String(c.totalPedidos),
      String(c.totalGastado),
      c.ultimoPedido?.toDate ? c.ultimoPedido.toDate().toLocaleDateString('es-CO') : '',
      (c.etiquetas || []).join('; '),
      c.notaAdmin || '',
    ]);
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map(row => row.map(escape).join(',')).join('\n');
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `clientes-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleAddClient = async () => {
    setNewClientError('');
    if (!newClientForm.nombres.trim() || !newClientForm.celular.trim()) {
      setNewClientError('Nombre y teléfono son obligatorios');
      return;
    }
    setSavingNewClient(true);
    try {
      await ClientService.createManualClient({
        nombres: newClientForm.nombres.trim(),
        celular: newClientForm.celular.trim(),
        fechaNacimiento: newClientForm.fechaNacimiento ? newClientForm.fechaNacimiento.slice(5) : undefined,
        correo: newClientForm.correo.trim() || undefined,
      });
      setShowAddClient(false);
      setNewClientForm({ nombres: '', celular: '', fechaNacimiento: '', correo: '' });
      await loadClients();
    } catch (err) {
      setNewClientError(err instanceof Error ? err.message : 'Error al crear el cliente');
    } finally {
      setSavingNewClient(false);
    }
  };

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
      disponible: prodForm.disponible,
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
        toppingsIncludedMax: '4', sizes: '', categoryId: '', image: '', disponible: true,
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
      disponible: p.disponible !== false,
    });
  };

  const cancelEditProduct = () => {
    setEditingProductId(null);
    setProdForm({
      name: '', description: '', price: '', priceType: 'fijo',
      priceOptions: { fijo: '', porSize: { pequeno: '', mediano: '', grande: '' }, porVersion: { ahogada: { pequeno: '', mediano: '', grande: '' }, picosa: { pequeno: '', mediano: '', grande: '' } } },
      toppingsIncludedMax: '4', sizes: '', categoryId: '', image: '', disponible: true,
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

  const handleToggleProductAvailability = async (p: FirestoreProduct) => {
    const nextDisponible = p.disponible === false;
    try {
      await ProductService.updateProduct(p.id!, { disponible: nextDisponible });
      setProducts(products.map(prod => prod.id === p.id ? { ...prod, disponible: nextDisponible } : prod));
    } catch (err: any) {
      alert('Error al actualizar disponibilidad: ' + err.message);
    }
  };

  const handleToggleTopping = async (toppingId: string) => {
    const isDisabled = disabledToppingIds.includes(toppingId);
    try {
      await ToppingAvailabilityService.setToppingAvailability(toppingId, !isDisabled);
    } catch (err: any) {
      alert('Error al actualizar disponibilidad del topping: ' + err.message);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name.trim()) return;
    setCatError(null);
    try {
      const { CategoryService } = await import('../services/categoryService');
      if (editingCategoryId) {
        await CategoryService.updateCategory(editingCategoryId, {
          name: catForm.name.trim(),
          description: catForm.description.trim(),
          image: catForm.image.trim(),
        });
        setEditingCategoryId(null);
      } else {
        await CategoryService.addCategory({
          name: catForm.name.trim(),
          description: catForm.description.trim(),
          image: catForm.image.trim(),
        });
      }
      setCatForm({ name: '', description: '', image: '' });
      const updated = await import('../services/categoryService').then(m => m.CategoryService.getCategories());
      setCategories(updated);
    } catch (err: any) {
      setCatError(err.message || 'Error al guardar categoría');
    }
  };

  const handleEditCategory = (c: import('../services/categoryService').FirestoreCategory) => {
    setEditingCategoryId(c.id || null);
    setCatForm({
      name: c.name,
      description: c.description || '',
      image: c.image || '',
    });
  };

  const cancelEditCategory = () => {
    setEditingCategoryId(null);
    setCatForm({ name: '', description: '', image: '' });
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

  const [, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const getElapsedTime = (ts: any, endState?: string) => {
    if (!ts) return '';
    const start = ts.toDate ? ts.toDate() : new Date(ts);
    const now = new Date();
    const isFinished = endState === 'entregado' || endState === 'cancelado';
    const diffMs = isFinished ? 0 : now.getTime() - start.getTime();
    if (diffMs <= 0) return 'Finalizado';
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    if (hrs < 24) return `${hrs}h ${remainMins}m`;
    const days = Math.floor(hrs / 24);
    return `${days}d ${hrs % 24}h`;
  };

  const STATUS_COLORS: Record<string, string> = {
    no_pagado: 'bg-amber-100 text-amber-700 border-amber-200',
    pagado: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    preparando: 'bg-blue-100 text-blue-700 border-blue-200',
    en_camino: 'bg-violet-100 text-violet-700 border-violet-200',
    entregado: 'bg-gray-100 text-gray-500 border-gray-200',
    cancelado: 'bg-red-100 text-red-600 border-red-200',
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

            {/* ====== Pedidos tabla plana ====== */}
            {loading ? (
              <div className="p-12 text-center text-gray-500 text-sm">Cargando pedidos...</div>
            ) : orders.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-gray-400 text-sm">No se encontraron pedidos.</div>
              </div>
            ) : (
              <div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e0e0e0', background: '#f5f5f5' }}>
                        <th className="px-4 py-3 text-left font-semibold text-xs text-gray-600 uppercase tracking-wide">Orden</th>
                        <th className="px-4 py-3 text-left font-semibold text-xs text-gray-600 uppercase tracking-wide">Cliente</th>
                        <th className="px-4 py-3 text-left font-semibold text-xs text-gray-600 uppercase tracking-wide">Productos</th>
                        <th className="px-4 py-3 text-left font-semibold text-xs text-gray-600 uppercase tracking-wide">Total</th>
                        <th className="px-4 py-3 text-left font-semibold text-xs text-gray-600 uppercase tracking-wide">Estado</th>
                        <th className="px-4 py-3 text-left font-semibold text-xs text-gray-600 uppercase tracking-wide">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order: PedidoFirestore & { id: string }) => {
                        const elapsed = getElapsedTime(order.createdAt, order.estado);
                        const colorClass = STATUS_COLORS[order.estado] || 'bg-gray-100 text-gray-600 border-gray-200';
                        return (
                          <tr
                            key={order.id}
                            onClick={() => navigate(`/admin/pedido/${order.id}`)}
                            className="cursor-pointer hover:bg-gray-50 transition-colors"
                            style={{ borderBottom: '1px solid #f0f0f0' }}
                          >
                            {/* Orden */}
                            <td className="px-4 py-3 align-top">
                              <div className="font-mono text-xs font-bold text-gray-900">{order.numeroOrden}</div>
                              <div className="text-[11px] text-gray-400 mt-0.5">{fmtDate(order.createdAt)} · {fmtTime(order.createdAt)}</div>
                              {elapsed && (
                                <div className={`flex items-center gap-1 text-[11px] font-semibold mt-1 ${order.estado === 'entregado' || order.estado === 'cancelado' ? 'text-gray-400' : 'text-orange-600'}`}>
                                  <Clock size={11} />
                                  {elapsed}
                                </div>
                              )}
                            </td>

                            {/* Cliente */}
                            <td className="px-4 py-3 align-top">
                              <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 shrink-0">
                                  <span className="text-[11px] font-bold text-gray-600">{order.cliente.nombres.charAt(0).toUpperCase()}</span>
                                </div>
                                <div className="min-w-0">
                                  <div className="text-sm font-semibold text-gray-900 truncate">{order.cliente.nombres}</div>
                                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                    <Phone size={10} />
                                    <span>{order.cliente.celular}</span>
                                    <span onClick={(e) => e.stopPropagation()}>
                                      <WhatsAppQuickSend phone={order.cliente.celular} templates={buildOrderQuickMessages(order)} />
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                                    <MapPin size={11} className="text-gray-400 shrink-0" />
                                    <span className="truncate">{order.cliente.direccion || 'Para llevar'}</span>
                                    {order.cliente.coordenadas && (
                                      <button onClick={(e) => { e.stopPropagation(); handleOpenLocation(order); }} className="text-blue-500 hover:text-blue-600 shrink-0" title="Ver en mapa">
                                        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Productos */}
                            <td className="px-4 py-3 align-top">
                              <div className="space-y-0.5 max-w-[240px]">
                                {order.items.slice(0, 2).map((item, idx) => (
                                  <div key={idx} className="text-xs text-gray-600 truncate">
                                    x{item.qty} {item.product.name}{item.version ? ` (${item.version})` : ''}
                                  </div>
                                ))}
                                {order.items.length > 2 && (
                                  <div className="text-[11px] text-gray-400">+{order.items.length - 2} mas</div>
                                )}
                              </div>
                            </td>

                            {/* Total */}
                            <td className="px-4 py-3 align-top">
                              <div className="font-bold text-gray-900">{cop(order.total)}</div>
                              <div className="text-[11px] text-gray-400">{order.formaPago}</div>
                              {(order.descuentoTotal ?? 0) > 0 && (
                                <div className="mt-0.5 inline-flex items-center rounded-full bg-rojo-light px-1.5 py-0.5 text-[10px] font-semibold text-rojo">
                                  -{cop(order.descuentoTotal!)} desc.
                                </div>
                              )}
                            </td>

                            {/* Estado */}
                            <td className="px-4 py-3 align-top" onClick={(e) => e.stopPropagation()}>
                              <select
                                value={order.estado}
                                onChange={(e) => handleStatusUpdate(order.id, e.target.value as OrderStatus)}
                                className={`text-xs font-bold px-2 py-1 rounded border cursor-pointer outline-none ${colorClass}`}
                              >
                                {(Object.keys(STATUS_LABELS) as (OrderStatus | 'todos')[]).filter(s => s !== 'todos').map(s => (
                                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                                ))}
                              </select>
                            </td>

                            {/* Acciones */}
                            <td className="px-4 py-3 align-top">
                              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => navigate(`/admin/pedido/${order.id}`)}
                                  title="Ver detalle"
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                                ><Eye size={15} /></button>
                                <button
                                  onClick={() => setEditingOrder(order)}
                                  title="Editar"
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                                ><Edit size={15} /></button>
                                <button
                                  onClick={() => handleDeleteOrder(order.id)}
                                  title="Eliminar"
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                                ><Trash2 size={15} /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Contador */}
            <div className="mt-4 text-xs text-gray-400 font-medium">
              {orders.length} pedido{orders.length !== 1 ? 's' : ''}
            </div>
          </>
        )}

        {activeTab === 'clientes' && (
          <>
            {/* Toolbar */}
            <div className="mb-4 flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex-1 min-w-[200px] relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre o teléfono..."
                    value={clientSearchTerm}
                    onChange={(e) => setClientSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
                  />
                </div>
                <button
                  onClick={() => setShowAddClient(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-700"
                >
                  <UserPlus size={14} /> Agregar cliente
                </button>
                <button
                  onClick={exportClientsCSV}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  <Download size={14} /> Exportar CSV
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {([
                  { value: 'todos', label: 'Todos' },
                  { value: 'vip', label: '⭐ VIP' },
                  { value: 'inactivos', label: `Inactivos (+${INACTIVE_DAYS_THRESHOLD}d)` },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setClientFilter(opt.value)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      clientFilter === opt.value ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}

                {allClientTags.length > 0 && (
                  <select
                    value={clientTagFilter}
                    onChange={(e) => setClientTagFilter(e.target.value)}
                    className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 outline-none focus:border-gray-400"
                  >
                    <option value="">Todas las etiquetas</option>
                    {allClientTags.map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Tabla de clientes */}
            <div>
              {clientsLoading ? (
                <div className="p-12 text-center text-gray-500 text-sm">Cargando clientes...</div>
              ) : filteredSortedClients.length === 0 ? (
                <div className="p-12 text-center text-gray-400 text-sm">No hay clientes que coincidan.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e0e0e0', background: '#f5f5f5' }}>
                        <SortableClientHeader field="nombres" label="Cliente" sortBy={clientSortBy} sortDir={clientSortDir} onSort={toggleClientSort} />
                        <th className="px-4 py-3 text-left font-semibold text-xs text-gray-600 uppercase tracking-wide">Teléfono</th>
                        <th className="px-4 py-3 text-left font-semibold text-xs text-gray-600 uppercase tracking-wide">Etiquetas</th>
                        <SortableClientHeader field="totalPedidos" label="Pedidos" sortBy={clientSortBy} sortDir={clientSortDir} onSort={toggleClientSort} />
                        <SortableClientHeader field="totalGastado" label="Total Gastado" sortBy={clientSortBy} sortDir={clientSortDir} onSort={toggleClientSort} />
                        <SortableClientHeader field="ultimoPedido" label="Última Compra" sortBy={clientSortBy} sortDir={clientSortDir} onSort={toggleClientSort} />
                        <th className="px-4 py-3 text-right font-semibold text-xs text-gray-600 uppercase tracking-wide">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSortedClients.map((client) => {
                          const daysSince = daysSinceLastPurchase(client);
                          return (
                            <tr key={client.id} style={{ borderBottom: '1px solid #f0f0f0' }} className="hover:bg-gray-50 transition">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1.5 font-semibold text-gray-900">
                                  {client.nombres}
                                  {isBirthdayToday(client.fechaNacimiento) && (
                                    <span title="Hoy es su cumpleaños">🎂</span>
                                  )}
                                  {isClientVip(client) && (
                                    <span title="Cliente VIP" className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-700">VIP</span>
                                  )}
                                  {isClientInactive(client) && (
                                    <span title="Inactivo" className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-gray-500">Inactivo</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1.5 text-gray-700">
                                  <Phone size={12} className="text-gray-400" />
                                  <span>{client.celular}</span>
                                  <WhatsAppQuickSend phone={client.celular} templates={buildClientQuickMessages(client)} className="ml-1" />
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-1">
                                  {(client.etiquetas || []).length > 0 ? (
                                    client.etiquetas!.map(tag => (
                                      <span key={tag} className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">{tag}</span>
                                    ))
                                  ) : (
                                    <span className="text-xs text-gray-300">—</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-semibold text-gray-900">{client.totalPedidos}</div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-bold text-gray-900">{cop(client.totalGastado)}</div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-xs text-gray-600">
                                  {daysSince === 0 ? 'Hoy' : daysSince === 1 ? 'Ayer' : `Hace ${daysSince} días`}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-end">
                                  <button
                                    onClick={() => setSelectedClient(client)}
                                    title="Ver detalle"
                                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                                  >
                                    <Eye size={15} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Contador */}
            <div className="mt-4 text-xs text-gray-400 font-medium">
              {filteredSortedClients.length} de {clients.length} cliente{clients.length !== 1 ? 's' : ''}
            </div>

            {/* Agregar cliente */}
            {showAddClient && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.5)' }}>
                <div className="bg-white max-w-md w-full rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between p-5 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900">Agregar cliente</h3>
                    <button onClick={() => setShowAddClient(false)} className="text-gray-400 hover:text-gray-700">
                      <XIcon size={18} />
                    </button>
                  </div>
                  <div className="p-5 space-y-3">
                    {newClientError && (
                      <div className="border border-red-300 bg-red-50 p-3 text-sm text-red-600">{newClientError}</div>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Nombre *</label>
                      <input
                        value={newClientForm.nombres}
                        onChange={(e) => setNewClientForm(prev => ({ ...prev, nombres: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Teléfono *</label>
                      <input
                        value={newClientForm.celular}
                        onChange={(e) => setNewClientForm(prev => ({ ...prev, celular: e.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Cumpleaños</label>
                        <input
                          type="date"
                          value={newClientForm.fechaNacimiento}
                          onChange={(e) => setNewClientForm(prev => ({ ...prev, fechaNacimiento: e.target.value }))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Correo</label>
                        <input
                          type="email"
                          value={newClientForm.correo}
                          onChange={(e) => setNewClientForm(prev => ({ ...prev, correo: e.target.value }))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 p-5 border-t border-gray-200">
                    <button
                      onClick={() => setShowAddClient(false)}
                      className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleAddClient}
                      disabled={savingNewClient}
                      className="flex-1 rounded-lg bg-gray-900 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50"
                    >
                      {savingNewClient ? 'Guardando...' : 'Crear cliente'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Modal de detalle de cliente */}
        {selectedClient && (
          <ClientDetailModal
            client={selectedClient}
            onClose={() => setSelectedClient(null)}
            onChanged={loadClients}
          />
        )}

        {activeTab === 'cumpleanos' && (
          <>
            {clientsLoading ? (
              <div className="p-12 text-center text-gray-500 text-sm">Cargando clientes...</div>
            ) : (
              <BirthdayCalendar clients={clients} />
            )}
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
              <h2 className="text-base font-medium mb-4" style={{ color: '#333' }}>
                {editingCategoryId ? 'Editar categoría' : 'Agregar categoría'}
              </h2>
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
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 cursor-pointer flex-1"
                    style={{ padding: '8px 16px', fontSize: '0.875rem', fontWeight: 500, color: '#fff', background: '#dc2626', border: 'none', borderRadius: '4px', transition: 'background 0.15s ease' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#b91c1c'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#dc2626'}
                  >
                    <Plus size={16} /> {editingCategoryId ? 'Guardar cambios' : 'Agregar categoría'}
                  </button>
                  {editingCategoryId && (
                    <button
                      type="button"
                      onClick={cancelEditCategory}
                      className="inline-flex items-center justify-center gap-2 cursor-pointer"
                      style={{ padding: '8px 16px', fontSize: '0.875rem', fontWeight: 500, color: '#666', background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: '4px', transition: 'background 0.15s ease' }}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
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
                        onClick={() => handleEditCategory(c)}
                        className="inline-flex items-center justify-center cursor-pointer"
                        style={{ width: '32px', height: '32px', borderRadius: '4px', border: 'none', background: 'transparent', color: '#888', transition: 'color 0.15s ease, background 0.15s ease' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#2563eb'; e.currentTarget.style.background = '#f5f5f5'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#888'; e.currentTarget.style.background = 'transparent'; }}
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
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
          <>
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
                  <textarea
                    value={prodForm.description}
                    onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                    placeholder="Descripción / ingredientes del producto"
                    rows={4}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '0.875rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
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
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prodForm.disponible}
                      onChange={(e) => setProdForm({ ...prodForm, disponible: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm" style={{ color: '#666' }}>
                      Disponible para pedir {!prodForm.disponible && <span className="text-red-600 font-medium">(el cliente lo verá como "No disponible")</span>}
                    </span>
                  </label>
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
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium truncate" style={{ color: '#333' }}>{p.name}</p>
                            {p.disponible === false && (
                              <span className="shrink-0 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-600">
                                No disponible
                              </span>
                            )}
                          </div>
                          <p className="text-xs" style={{ color: '#888' }}>
                            {cop(p.price ?? 0)} · {catName}
                          </p>
                        </div>
                        <button
                          onClick={() => handleToggleProductAvailability(p)}
                          className="inline-flex items-center justify-center cursor-pointer"
                          style={{ width: '32px', height: '32px', borderRadius: '4px', border: 'none', background: 'transparent', color: p.disponible === false ? '#dc2626' : '#888', transition: 'color 0.15s ease, background 0.15s ease' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f5f5'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                          title={p.disponible === false ? 'Marcar como disponible' : 'Marcar como no disponible'}
                        >
                          {p.disponible === false ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
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

          {/* Disponibilidad de toppings */}
          <div className="mt-6" style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: '4px', padding: '20px' }}>
            <h2 className="text-base font-medium mb-1" style={{ color: '#333' }}>Toppings disponibles</h2>
            <p className="text-xs mb-4" style={{ color: '#888' }}>
              Desactiva un topping para que los clientes no puedan elegirlo al armar su pedido.
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {TOPPINGS.map((t) => {
                const disabled = disabledToppingIds.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleToggleTopping(t.id)}
                    className="flex flex-col items-center gap-1.5"
                    title={disabled ? 'Marcar como disponible' : 'Marcar como no disponible'}
                  >
                    <div className={["relative w-14 h-14 rounded-full overflow-hidden ring-1", disabled ? "ring-red-200 opacity-50 grayscale" : "ring-gray-200"].join(" ")}>
                      <img src={t.imageSrc} alt={t.name} className="h-full w-full object-cover" loading="lazy" />
                      {disabled && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <EyeOff size={16} className="text-white" />
                        </div>
                      )}
                    </div>
                    <span className={["text-[11px] text-center leading-tight", disabled ? "text-red-500 font-medium" : "text-gray-600"].join(" ")}>
                      {t.name}
                    </span>
                    <span className={["text-[9px] font-bold uppercase", disabled ? "text-red-400" : "text-green-600"].join(" ")}>
                      {disabled ? "No disponible" : "Disponible"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          </>
        )}

        {activeTab === 'promociones' && (
          <div className="space-y-6">
            {/* Formulario */}
            <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: '4px', padding: '20px' }}>
              <h2 className="text-base font-medium mb-4" style={{ color: '#333' }}>
                {editingPromoId ? 'Editar promoción' : 'Crear promoción'}
              </h2>
              {promoError && (
                <div className="mb-3 p-2 text-sm" style={{ background: '#fff0f0', color: '#e85a5a', borderRadius: '4px' }}>{promoError}</div>
              )}
              <form onSubmit={handleSavePromo} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Nombre *</label>
                    <input
                      value={promoForm.nombre}
                      onChange={e => setPromoForm({ ...promoForm, nombre: e.target.value })}
                      className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-gray-400"
                      placeholder="Ej: 2x1 en gomitas"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Tipo *</label>
                    <select
                      value={promoForm.tipo}
                      onChange={e => setPromoForm({ ...promoForm, tipo: e.target.value as PromotionType })}
                      className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-gray-400"
                    >
                      <option value="porcentaje">Porcentaje (%)</option>
                      <option value="valor_fijo">Valor fijo ($)</option>
                      <option value="2x1">2x1</option>
                      <option value="combo">Combo</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      {promoForm.tipo === 'porcentaje' ? 'Porcentaje (1-100) *' : promoForm.tipo === 'valor_fijo' ? 'Monto descuento ($) *' : 'Valor *'}
                    </label>
                    <input
                      type="number"
                      value={promoForm.valor}
                      onChange={e => setPromoForm({ ...promoForm, valor: e.target.value })}
                      className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-gray-400"
                      placeholder={promoForm.tipo === 'porcentaje' ? '10' : '5000'}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Cantidad mínima (opcional)</label>
                    <input
                      type="number"
                      value={promoForm.cantidadMinima}
                      onChange={e => setPromoForm({ ...promoForm, cantidadMinima: e.target.value })}
                      className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-gray-400"
                      placeholder="Ej: 2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Descripción (opcional)</label>
                  <input
                    value={promoForm.descripcion}
                    onChange={e => setPromoForm({ ...promoForm, descripcion: e.target.value })}
                    className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-gray-400"
                    placeholder="Descripción para el cliente"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Productos a los que aplica (ninguno marcado = aplica a todos)
                  </label>
                  {products.length === 0 ? (
                    <div className="text-xs text-gray-400 border border-dashed border-gray-200 rounded p-3">
                      No hay productos creados todavía. Ve a la pestaña "Productos" para agregarlos.
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded divide-y divide-gray-100">
                      {products.map((p) => {
                        const selectedIds = promoForm.productosIds
                          ? promoForm.productosIds.split(',').map(s => s.trim()).filter(Boolean)
                          : [];
                        const checked = selectedIds.includes(p.id!);
                        return (
                          <label key={p.id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                const next = checked
                                  ? selectedIds.filter(id => id !== p.id)
                                  : [...selectedIds, p.id!];
                                setPromoForm({ ...promoForm, productosIds: next.join(', ') });
                              }}
                              className="w-4 h-4"
                            />
                            <span className="text-gray-700">{p.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Fecha inicio (opcional)</label>
                    <input
                      type="datetime-local"
                      value={promoForm.fechaInicio}
                      onChange={e => setPromoForm({ ...promoForm, fechaInicio: e.target.value })}
                      className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Fecha fin (opcional)</label>
                    <input
                      type="datetime-local"
                      value={promoForm.fechaFin}
                      onChange={e => setPromoForm({ ...promoForm, fechaFin: e.target.value })}
                      className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-gray-400"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={promoForm.activa}
                      onChange={e => setPromoForm({ ...promoForm, activa: e.target.checked })}
                      className="w-4 h-4"
                    />
                    Activa
                  </label>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-rojo hover:bg-rojo-dark transition rounded"
                  >
                    {editingPromoId ? 'Guardar cambios' : 'Crear promoción'}
                  </button>
                  {editingPromoId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPromoId(null);
                        setPromoForm({ nombre: '', descripcion: '', tipo: 'porcentaje', valor: '', productosIds: '', cantidadMinima: '', activa: true, fechaInicio: '', fechaFin: '' });
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50 transition rounded"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Lista de promociones */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Promociones existentes</h3>
              {promosLoading ? (
                <div className="p-8 text-center text-gray-400 text-sm">Cargando...</div>
              ) : promos.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">No hay promociones creadas.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e0e0e0', background: '#f5f5f5' }}>
                        <th className="px-4 py-3 text-left font-semibold text-xs text-gray-600 uppercase tracking-wide">Nombre</th>
                        <th className="px-4 py-3 text-left font-semibold text-xs text-gray-600 uppercase tracking-wide">Tipo</th>
                        <th className="px-4 py-3 text-left font-semibold text-xs text-gray-600 uppercase tracking-wide">Valor</th>
                        <th className="px-4 py-3 text-left font-semibold text-xs text-gray-600 uppercase tracking-wide">Productos</th>
                        <th className="px-4 py-3 text-left font-semibold text-xs text-gray-600 uppercase tracking-wide">Estado</th>
                        <th className="px-4 py-3 text-left font-semibold text-xs text-gray-600 uppercase tracking-wide">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {promos.map(p => (
                        <tr key={p.id} style={{ borderBottom: '1px solid #f0f0f0' }} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{p.nombre}</div>
                            {p.descripcion && <div className="text-xs text-gray-400 mt-0.5">{p.descripcion}</div>}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {p.tipo === 'porcentaje' ? 'Porcentaje' : p.tipo === 'valor_fijo' ? 'Valor fijo' : p.tipo === '2x1' ? '2x1' : 'Combo'}
                          </td>
                          <td className="px-4 py-3 font-semibold text-gray-900">
                            {p.tipo === 'porcentaje' ? `${p.valor}%` : cop(p.valor)}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {p.productosIds?.length
                              ? p.productosIds.map(id => products.find(prod => prod.id === id)?.name || id).join(', ')
                              : 'Todos'}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleTogglePromo(p)}
                              className={`text-xs font-bold px-2 py-1 rounded cursor-pointer ${p.activa ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                            >
                              {p.activa ? 'Activa' : 'Inactiva'}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleEditPromo(p)}
                                title="Editar"
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
                              ><Edit size={15} /></button>
                              <button
                                onClick={() => handleDeletePromo(p.id)}
                                title="Eliminar"
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                              ><Trash2 size={15} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ====== Modales ====== */}
        {editingOrder && (
          <OrderEditModal order={editingOrder} onClose={() => setEditingOrder(null)} onSave={() => setEditingOrder(null)} />
        )}
      </AdminLayout>
    </AdminAuth>
  );
}
