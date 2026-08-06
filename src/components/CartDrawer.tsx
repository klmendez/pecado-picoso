import { useState, useEffect } from 'react';
import { X, MapPin, Clock, AlertCircle, CheckCircle, MessageCircle } from 'lucide-react';
import { OrderService } from '../services/orderService';
import { PromotionService } from '../services/promotionService';
import { ClientService } from '../services/clientService';
import { LocationService } from '../services/locationService';
import { WhatsAppNotificationService } from '../services/whatsappNotificationService';
import { useOrderMessage } from '../hooks/useOrderMessage';
import type { OrderItem, PaymentMethod, Service } from '../lib/whatsapp';
import type { CustomerLocation } from '../types/order';
import type { AppliedPromotion } from '../types/promotion';
import type { Barrio } from '../data/barrios';
import { cop } from '../lib/format';
import { toBirthdayKey } from '../lib/birthday';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: (OrderItem & { baseLine: number })[];
  subtotal: number;
  delivery: number;
  total: number;
  name: string;
  phone: string;
  birthday?: string;
  email?: string;
  service: Service;
  barrio: Barrio | null;
  address: string;
  reference: string;
  paymentMethod: PaymentMethod;
  comments: string;
  initialLocation?: CustomerLocation | null;
  onClearCart: () => void;
  descuentoTotal?: number;
  appliedPromotions?: AppliedPromotion[];
  couponInput?: string;
  onCouponInputChange?: (value: string) => void;
  onApplyCoupon?: () => void;
  onRemoveCoupon?: () => void;
  appliedCouponCode?: string | null;
  couponError?: string | null;
}

export default function CartDrawer({
  isOpen,
  onClose,
  items,
  subtotal,
  delivery,
  total,
  name,
  phone,
  birthday = '',
  email = '',
  service,
  barrio,
  address,
  reference,
  paymentMethod,
  comments,
  initialLocation = null,
  onClearCart,
  descuentoTotal = 0,
  appliedPromotions = [],
  couponInput = '',
  onCouponInputChange,
  onApplyCoupon,
  onRemoveCoupon,
  appliedCouponCode = null,
  couponError = null,
}: CartDrawerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [currentLocation, setCurrentLocation] = useState<CustomerLocation | null>(initialLocation);
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  // Hook para generar mensaje de WhatsApp
  const locationLink = currentLocation ? LocationService.generateMapsLink(currentLocation) : undefined;
  const { openWhatsApp } = useOrderMessage({
    name,
    phone,
    service,
    barrio,
    address,
    reference,
    paymentMethod,
    comments,
    items,
    subtotal,
    delivery,
    total,
    locationLink,
    descuentoTotal,
    birthdayKey: toBirthdayKey(birthday)
  });

  useEffect(() => {
    if (initialLocation) {
      setCurrentLocation(initialLocation);
    }
  }, [initialLocation]);

  // Verificar permisos de ubicación al abrir el drawer
  useEffect(() => {
    if (isOpen && navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setLocationPermission(result.state);
      });
    }
  }, [isOpen]);

  // Obtener ubicación inicial
  const handleGetLocation = async () => {
    try {
      setIsTrackingLocation(true);
      const location = await LocationService.getCurrentLocation();
      setCurrentLocation(location);
      setLocationPermission('granted');
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationPermission('denied');
    } finally {
      setIsTrackingLocation(false);
    }
  };

  // Iniciar seguimiento en tiempo real
  const startLocationTracking = () => {
    if (!createdOrderId) return;

    LocationService.startWatchingLocation(
      async (location) => {
        setCurrentLocation(location);
        // Actualizar ubicación en Firestore solo si hay movimiento significativo
        if (currentLocation && LocationService.hasSignificantMovement(currentLocation, location, 10)) {
          try {
            await OrderService.updateCustomerLocation(createdOrderId, location);
          } catch (error) {
            console.error('Error updating location:', error);
          }
        }
      },
      (error) => {
        console.error('Location tracking error:', error);
      }
    );
  };

  // Detener seguimiento
  const stopLocationTracking = () => {
    LocationService.stopWatchingLocation();
  };

  // Validar datos del formulario
  const validateForm = (): boolean => {
    if (!name.trim() || !phone.trim()) {
      setErrorMessage('Nombre y teléfono son obligatorios');
      return false;
    }

    if (service === 'domicilio' && (!barrio || !address.trim())) {
      setErrorMessage('Para domicilio necesitas seleccionar barrio y dirección');
      return false;
    }

    if (items.length === 0) {
      setErrorMessage('Agrega al menos un producto');
      return false;
    }

    if (total <= 0) {
      setErrorMessage('El total debe ser mayor a $0');
      return false;
    }

    return true;
  };

  // Crear pedido en Firestore
  const handleSubmitOrder = async () => {
    if (!validateForm()) {
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const numeroOrden = OrderService.generateOrderNumber();
      const birthdayKey = toBirthdayKey(birthday);

      // Se guarda el item "limpio" (sin los campos de precio calculado que
      // solo se usan para mostrar el resumen), conservando el detalle de
      // descuentos por producto como una foto del momento de la compra.
      const itemsForOrder = items.map((it: any) => {
        const { baseUnit, extrasUnit, unit, line, baseLine, discounts, ...rest } = it;
        return discounts && discounts.length ? { ...rest, discounts } : rest;
      });

      const orderData = {
        numeroOrden,
        items: itemsForOrder,
        total,
        subtotal,
        delivery,
        cliente: {
          nombres: name.trim(),
          celular: phone.trim(),
          direccion: service === 'domicilio' ? address.trim() : '',
          ...(service === 'domicilio' && barrio ? { barrio: barrio.name } : {}),
          ...(birthdayKey ? { fechaNacimiento: birthdayKey } : {}),
          ...(email.trim() ? { correo: email.trim() } : {}),
          ...(currentLocation ? {
            coordenadas: currentLocation,
            mapsLink: LocationService.generateMapsLink(currentLocation),
            ubicacionTiempoReal: [currentLocation]
          } : {})
        },
        formaPago: paymentMethod,
        servicio: service,
        estado: 'no_pagado' as const,
        ...(appliedPromotions.length > 0 ? {
          promociones: appliedPromotions,
          descuentoTotal,
        } : {})
      };

      const orderId = await OrderService.createOrder(orderData);
      setCreatedOrderId(orderId);
      setSubmitStatus('success');

      // Contar el uso de cada promoción/cupón aplicado
      appliedPromotions.forEach((promo) => {
        PromotionService.incrementUsage(promo.promoId).catch((err) =>
          console.error('Error incrementando uso de promoción:', err)
        );
      });
      
      // Iniciar seguimiento de ubicación si está disponible
      if (currentLocation && service === 'domicilio') {
        startLocationTracking();
      }

      // Guardar/actualizar cliente en la base de datos
      try {
        const clientData: any = {
          celular: phone.trim(),
          nombres: name.trim(),
          totalPedido: total
        };
        
        // Solo agregar campos opcionales si tienen valor
        if (service === 'domicilio' && address.trim()) {
          clientData.direccion = address.trim();
        }
        if (barrio?.name) {
          clientData.barrio = barrio.name;
        }
        if (reference?.trim()) {
          clientData.referencia = reference.trim();
        }
        if (birthdayKey) {
          clientData.fechaNacimiento = birthdayKey;
        }
        if (email.trim()) {
          clientData.correo = email.trim();
        }

        await ClientService.upsertClient(clientData);
        console.log('✅ Cliente guardado/actualizado correctamente');
      } catch (clientError) {
        console.error('❌ Error guardando cliente:', clientError);
      }

      // Enviar notificación al negocio sobre nuevo pedido
      const orderWithId = { 
        ...orderData, 
        id: orderId,
        createdAt: new Date() as any,
        updatedAt: new Date() as any
      };
      WhatsAppNotificationService.sendNewOrderNotification(orderWithId);

      // Limpiar carrito después de un delay
      setTimeout(() => {
        onClearCart();
        onClose();
        setSubmitStatus('idle');
        setCreatedOrderId(null);
        stopLocationTracking();
      }, 3000);

    } catch (error) {
      console.error('Error creating order:', error);
      setErrorMessage('Error al crear el pedido. Intenta nuevamente.');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Overlay */}
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="Cerrar carrito"
      />
      
      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-4">
            <h2 className="text-lg font-bold text-black">Finalizar Pedido</h2>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-black"
              aria-label="Cerrar carrito"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Resumen del pedido */}
            <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <h3 className="mb-3 text-sm font-bold text-black">Resumen del Pedido</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Productos ({items.length})</span>
                  <span>{cop(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Envío</span>
                  <span>{cop(delivery)}</span>
                </div>

                {onApplyCoupon ? (
                  appliedCouponCode ? (
                    <div className="flex items-center justify-between gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs">
                      <span className="text-green-700 font-semibold truncate">
                        Cupón <span className="font-mono">{appliedCouponCode}</span> aplicado
                      </span>
                      <button
                        type="button"
                        onClick={onRemoveCoupon}
                        className="text-green-700 underline underline-offset-2 shrink-0"
                      >
                        Quitar
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex gap-2">
                        <input
                          value={couponInput}
                          onChange={(e) => onCouponInputChange?.(e.target.value.toUpperCase())}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              onApplyCoupon();
                            }
                          }}
                          placeholder="Código de cupón"
                          className="flex-1 min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono uppercase outline-none focus:border-black"
                        />
                        <button
                          type="button"
                          onClick={onApplyCoupon}
                          className="rounded-lg border border-black px-3 py-2 text-xs font-semibold hover:bg-black hover:text-white transition-colors shrink-0"
                        >
                          Aplicar
                        </button>
                      </div>
                      {couponError && <div className="text-xs text-rojo">{couponError}</div>}
                    </div>
                  )
                ) : null}

                {appliedPromotions.map((promo, i) => (
                  <div key={i} className="flex justify-between text-rojo font-medium">
                    <span>{promo.nombre}</span>
                    <span>-{cop(promo.descuento)}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-black">
                  <span>Total</span>
                  <span>{cop(total)}</span>
                </div>
              </div>
            </div>

            {/* Datos del cliente */}
            <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <h3 className="mb-3 text-sm font-bold text-black">Datos de Entrega</h3>
              
              <div className="space-y-2 text-sm text-gray-500">
                <div><span className="font-semibold">Nombre:</span> {name}</div>
                <div><span className="font-semibold">Teléfono:</span> {phone}</div>
                <div><span className="font-semibold">Servicio:</span> {service === 'domicilio' ? 'Domicilio' : 'Para llevar'}</div>
                {service === 'domicilio' && (
                  <>
                    <div><span className="font-semibold">Barrio:</span> {barrio?.name || 'No seleccionado'}</div>
                    <div><span className="font-semibold">Dirección:</span> {address}</div>
                    {reference && <div><span className="font-semibold">Referencia:</span> {reference}</div>}
                  </>
                )}
                <div><span className="font-semibold">Pago:</span> {paymentMethod}</div>
                {comments && <div><span className="font-semibold">Comentarios:</span> {comments}</div>}
              </div>
            </div>

            {/* Ubicación en tiempo real */}
            {service === 'domicilio' && (
              <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-black">
                  <MapPin size={16} />
                  Ubicación en Tiempo Real
                </h3>
                
                {locationPermission === 'denied' && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle size={16} />
                    Permisos de ubicación denegados
                  </div>
                )}
                
                {locationPermission === 'prompt' && (
                  <button
                    onClick={handleGetLocation}
                    disabled={isTrackingLocation}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-300 bg-gray-100 px-4 py-2 text-sm text-black hover:bg-gray-200 disabled:opacity-50"
                  >
                    {isTrackingLocation ? (
                      <>
                        <Clock size={16} className="animate-spin" />
                        Obteniendo ubicación...
                      </>
                    ) : (
                      <>
                        <MapPin size={16} />
                        Compartir Ubicación
                      </>
                    )}
                  </button>
                )}
                
                {currentLocation && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-rojo">
                      <CheckCircle size={16} />
                      Ubicación obtenida
                    </div>
                    <div className="text-xs text-gray-500">
                      Lat: {currentLocation.lat.toFixed(6)}, Lng: {currentLocation.lng.toFixed(6)}
                      {currentLocation.accuracy && (
                        <div>Precisión: ±{Math.round(currentLocation.accuracy)}m</div>
                      )}
                    </div>
                    {createdOrderId && (
                      <div className="text-xs text-blue-600">
                        📍 Compartiendo ubicación en tiempo real
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Estado del envío */}
            {submitStatus === 'success' && (
              <div className="mb-4 rounded-2xl border border-rojo bg-rojo-light p-4">
                <div className="flex items-center gap-2 text-rojo">
                  <CheckCircle size={20} />
                  <span className="font-semibold">¡Pedido creado exitosamente!</span>
                </div>
                <p className="mt-2 text-sm text-rojo">
                  Tu pedido ha sido guardado y pronto recibirás confirmación por WhatsApp.
                </p>
                {service === 'domicilio' && currentLocation && (
                  <p className="mt-1 text-xs text-rojo">
                    Tu ubicación se está compartiendo en tiempo real para facilitar la entrega.
                  </p>
                )}
              </div>
            )}

            {/* Error */}
            {submitStatus === 'error' && errorMessage && (
              <div className="mb-4 rounded-2xl border border-red-300 bg-red-50 p-4">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle size={20} />
                  <span className="font-semibold">Error</span>
                </div>
                <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-4 space-y-3">
            {/* Botón de WhatsApp (guarda en DB y abre WhatsApp) */}
            <button
              onClick={() => {
                // Abrir WhatsApp inmediatamente para evitar bloqueo en móvil
                openWhatsApp();
                // Guardar en DB en segundo plano
                handleSubmitOrder();
              }}
              disabled={isSubmitting || submitStatus === 'success'}
              className="w-full rounded-full bg-rojo py-3 font-bold text-white hover:bg-rojo-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <Clock size={16} className="animate-spin" />
                  Guardando...
                </div>
              ) : submitStatus === 'success' ? (
                '✅ Enviado'
              ) : (
                <>
                  <MessageCircle size={18} />
                  Enviar por WhatsApp
                  {currentLocation && service === 'domicilio' && (
                    <span className="text-xs">📍</span>
                  )}
                </>
              )}
            </button>

            <p className="text-center text-xs text-gray-500">
              {currentLocation && service === 'domicilio' ? (
                '📍 Tu ubicación se incluirá en el mensaje de WhatsApp'
              ) : (
                'Al crear el pedido aceptas nuestros términos y condiciones'
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
