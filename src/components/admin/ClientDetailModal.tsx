import { X, MapPin, Phone, ShoppingBag, DollarSign, Calendar, Cake, Mail, Pencil, Tag, StickyNote, Trash2, GitMerge, Plus, IdCard } from 'lucide-react';
import { useEffect, useState } from 'react';
import { OrderService } from '../../services/orderService';
import { ClientService, type FirestoreClient } from '../../services/clientService';
import type { PedidoFirestore } from '../../types/order';
import { cop } from '../../lib/format';
import { isBirthdayToday, formatBirthdayLabel } from '../../lib/birthday';
import { VIP_MIN_PEDIDOS, VIP_MIN_GASTADO, INACTIVE_DAYS_THRESHOLD } from '../../data/constants';

interface ClientDetailModalProps {
  client: FirestoreClient | null;
  onClose: () => void;
  onChanged: () => void;
}

export default function ClientDetailModal({ client, onClose, onChanged }: ClientDetailModalProps) {
  const [orders, setOrders] = useState<(PedidoFirestore & { id: string })[]>([]);
  const [loading, setLoading] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ nombres: '', celular: '', fechaNacimiento: '', correo: '', cedula: '', notaAdmin: '' });
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeQuery, setMergeQuery] = useState('');
  const [mergeResults, setMergeResults] = useState<FirestoreClient[]>([]);
  const [mergeTarget, setMergeTarget] = useState<FirestoreClient | null>(null);
  const [merging, setMerging] = useState(false);

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

    setIsEditing(false);
    setError('');
    setForm({
      nombres: client.nombres,
      celular: client.celular,
      fechaNacimiento: client.fechaNacimiento ? `2000-${client.fechaNacimiento}` : '',
      correo: client.correo || '',
      cedula: client.cedula || '',
      notaAdmin: client.notaAdmin || '',
    });
    setTags(client.etiquetas || []);
    setMergeOpen(false);
    setMergeQuery('');
    setMergeResults([]);
    setMergeTarget(null);
  }, [client]);

  if (!client) return null;

  const lastPurchase = client.ultimoPedido?.toDate ? client.ultimoPedido.toDate() : new Date();
  const daysSince = Math.floor((new Date().getTime() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24));
  const isVip = client.totalPedidos >= VIP_MIN_PEDIDOS || client.totalGastado >= VIP_MIN_GASTADO;
  const isInactive = daysSince >= INACTIVE_DAYS_THRESHOLD;

  const addTag = () => {
    const value = tagInput.trim();
    if (!value) return;
    if (!tags.includes(value)) setTags([...tags, value]);
    setTagInput('');
  };

  const removeTag = (tag: string) => setTags(tags.filter(t => t !== tag));

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      if (!form.nombres.trim()) throw new Error('El nombre es obligatorio');
      if (!form.celular.trim()) throw new Error('El teléfono es obligatorio');

      const birthdayKey = form.fechaNacimiento ? form.fechaNacimiento.slice(5) : null;

      await ClientService.updateClient(client.celular, {
        celular: form.celular,
        nombres: form.nombres.trim(),
        fechaNacimiento: birthdayKey,
        correo: form.correo.trim() || null,
        cedula: form.cedula.trim() || null,
        notaAdmin: form.notaAdmin.trim() || null,
        etiquetas: tags,
      });

      onChanged();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar a ${client.nombres} de la lista de clientes? Sus pedidos históricos no se borran.`)) return;
    try {
      await ClientService.deleteClient(client.celular);
      onChanged();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el cliente');
    }
  };

  const runMergeSearch = async (term: string) => {
    setMergeQuery(term);
    setMergeTarget(null);
    if (term.trim().length < 2) {
      setMergeResults([]);
      return;
    }
    const results = await ClientService.searchClients(term);
    setMergeResults(results.filter(c => c.celular !== client.celular));
  };

  const handleMerge = async () => {
    if (!mergeTarget) return;
    if (!confirm(`¿Fusionar a ${mergeTarget.nombres} (${mergeTarget.celular}) dentro de ${client.nombres} (${client.celular})? Se combinarán direcciones, notas, etiquetas y totales. Esta acción no se puede deshacer.`)) return;
    setMerging(true);
    setError('');
    try {
      await ClientService.mergeClients(client.celular, mergeTarget.celular);
      onChanged();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al fusionar clientes');
    } finally {
      setMerging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="bg-white max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-900 text-white font-bold text-lg">
              {client.nombres.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              {!isEditing ? (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-900">{client.nombres}</h2>
                    {isVip && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                        ⭐ VIP
                      </span>
                    )}
                    {isInactive && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                        Inactivo
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Phone size={14} />
                    {client.celular}
                  </div>
                  {(client.fechaNacimiento || client.correo || client.cedula) && (
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                      {client.fechaNacimiento && (
                        <span className="flex items-center gap-1">
                          <Cake size={12} />
                          {formatBirthdayLabel(client.fechaNacimiento)}
                        </span>
                      )}
                      {client.correo && (
                        <span className="flex items-center gap-1">
                          <Mail size={12} />
                          {client.correo}
                        </span>
                      )}
                      {client.cedula && (
                        <span className="flex items-center gap-1">
                          <IdCard size={12} />
                          C.C. {client.cedula}
                        </span>
                      )}
                    </div>
                  )}
                  {isBirthdayToday(client.fechaNacimiento) && (
                    <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-rojo-light px-2.5 py-1 text-xs font-semibold text-rojo">
                      🎂 ¡Hoy es su cumpleaños!
                    </div>
                  )}
                  {tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {tags.map(tag => (
                        <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                          <Tag size={10} />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {client.notaAdmin && (
                    <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-yellow-50 border border-yellow-200 px-2.5 py-1.5 text-xs text-yellow-800">
                      <StickyNote size={12} className="mt-0.5 shrink-0" />
                      <span>{client.notaAdmin}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      value={form.nombres}
                      onChange={(e) => setForm(prev => ({ ...prev, nombres: e.target.value }))}
                      placeholder="Nombre"
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-400 focus:outline-none"
                    />
                    <input
                      value={form.celular}
                      onChange={(e) => setForm(prev => ({ ...prev, celular: e.target.value }))}
                      placeholder="Teléfono"
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-400 focus:outline-none"
                    />
                    <input
                      type="date"
                      value={form.fechaNacimiento}
                      onChange={(e) => setForm(prev => ({ ...prev, fechaNacimiento: e.target.value }))}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-400 focus:outline-none"
                    />
                    <input
                      type="email"
                      value={form.correo}
                      onChange={(e) => setForm(prev => ({ ...prev, correo: e.target.value }))}
                      placeholder="Correo"
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-400 focus:outline-none"
                    />
                    <input
                      value={form.cedula}
                      onChange={(e) => setForm(prev => ({ ...prev, cedula: e.target.value.replace(/\D/g, '') }))}
                      inputMode="numeric"
                      placeholder="Cédula"
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Etiquetas</label>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {tags.map(tag => (
                        <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                          {tag}
                          <button type="button" onClick={() => removeTag(tag)} className="hover:text-blue-900">
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                      <input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                        placeholder="Ej: VIP, mayorista..."
                        className="min-w-[120px] flex-1 rounded-lg border border-gray-300 px-2 py-1 text-xs focus:border-gray-400 focus:outline-none"
                      />
                      <button type="button" onClick={addTag} className="rounded-lg border border-gray-300 p-1 text-gray-500 hover:bg-gray-50">
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Nota interna</label>
                    <textarea
                      value={form.notaAdmin}
                      onChange={(e) => setForm(prev => ({ ...prev, notaAdmin: e.target.value }))}
                      rows={2}
                      placeholder="Preferencias, acuerdos especiales, incidentes..."
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-400 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                <Pencil size={13} /> Editar
              </button>
            ) : (
              <>
                <button
                  onClick={() => { setIsEditing(false); setError(''); }}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 transition"
            >
              <X size={18} className="text-gray-500" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 border border-red-300 bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

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

          {/* Zona de peligro */}
          <div className="mt-8 border-t border-gray-200 pt-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">Zona de peligro</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setMergeOpen(!mergeOpen)}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                <GitMerge size={13} /> Fusionar con otro cliente
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                <Trash2 size={13} /> Eliminar cliente
              </button>
            </div>

            {mergeOpen && (
              <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs text-gray-500 mb-2">
                  Busca al cliente duplicado. Se combinarán sus direcciones, etiquetas, notas y totales dentro de <strong>{client.nombres}</strong>, sus pedidos históricos quedarán bajo este teléfono, y el duplicado se eliminará.
                </p>
                <input
                  value={mergeQuery}
                  onChange={(e) => runMergeSearch(e.target.value)}
                  placeholder="Buscar por nombre o teléfono..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-400 focus:outline-none"
                />
                {mergeResults.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-gray-200 bg-white">
                    {mergeResults.map((c) => (
                      <button
                        key={c.celular}
                        onClick={() => { setMergeTarget(c); setMergeQuery(`${c.nombres} — ${c.celular}`); setMergeResults([]); }}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50"
                      >
                        <span>{c.nombres}</span>
                        <span className="text-xs text-gray-400">{c.celular}</span>
                      </button>
                    ))}
                  </div>
                )}
                {mergeTarget && (
                  <button
                    onClick={handleMerge}
                    disabled={merging}
                    className="mt-3 flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    <GitMerge size={13} />
                    {merging ? 'Fusionando...' : `Fusionar ${mergeTarget.nombres} dentro de ${client.nombres}`}
                  </button>
                )}
              </div>
            )}
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
