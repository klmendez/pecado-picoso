import type { PedidoFirestore, OrderStatus } from '../types/order';
import { cop } from '../lib/format';
import { WHATSAPP_PHONE, NEQUI_PHONE } from '../data/constants';

export class WhatsAppNotificationService {
  private static readonly BUSINESS_PHONE = import.meta.env.VITE_WHATSAPP_BUSINESS_PHONE || `57${WHATSAPP_PHONE}`;

  // Mensajes predefinidos para diferentes estados
  private static readonly STATUS_MESSAGES: Record<OrderStatus, (order: PedidoFirestore & { id: string }) => string> = {
    no_pagado: (order) => `Hola ${order.cliente.nombres}! 👋\n\nTu pedido ${order.numeroOrden} ha sido recibido por ${cop(order.total)}.\n\n⏰ *Pendiente de pago*\nPor favor realiza el pago para confirmar tu pedido.\n\n💳 Método: ${order.formaPago}\n${order.formaPago === 'Transferencia' ? `🏦 Nequi: ${NEQUI_PHONE}` : '💵 Pago en efectivo al recibir'}\n\n¡Gracias por elegir Pecado Picoso! 🌶️`,

    pagado: (order) => `¡Excelente ${order.cliente.nombres}! ✅\n\nTu pago ha sido confirmado.\nPedido: ${order.numeroOrden}\nTotal: ${cop(order.total)}\n\n👨‍🍳 *Ahora preparamos tu pedido*\nTe notificaremos cuando esté listo.\n\n${order.servicio === 'domicilio' ? '🛵 Lo llevaremos a tu dirección' : '🥡 Podrás recogerlo en nuestro punto'}\n\n¡Pecado Picoso en camino! 🌶️🔥`,

    preparando: (order) => `¡Hola ${order.cliente.nombres}! 👨‍🍳\n\nTu pedido ${order.numeroOrden} está siendo preparado con mucho amor.\n\n🔥 *En la cocina ahora mismo*\n${order.servicio === 'domicilio' ? 'Pronto saldremos hacia tu dirección.' : 'Te avisaremos cuando esté listo para recoger.'}\n\n⏱️ Tiempo estimado: 15-25 minutos\n\n¡La espera valdrá la pena! 🌶️✨`,

    en_camino: (order) => `🛵 ¡En camino ${order.cliente.nombres}!\n\nTu pedido ${order.numeroOrden} ya salió hacia tu dirección.\n\n📍 *Dirección de entrega:*\n${order.cliente.direccion}\n\n⏱️ Tiempo estimado: 10-20 minutos\n${order.cliente.coordenadas ? '📱 Tu ubicación en tiempo real nos ayuda a llegar más rápido.' : ''}\n\n¡Prepárate para el Pecado Picoso! 🌶️🔥`,

    entregado: (order) => `¡Entregado! 🎉\n\nGracias ${order.cliente.nombres} por tu pedido ${order.numeroOrden}.\n\n✅ *Pedido completado*\nEsperamos que hayas disfrutado tu Pecado Picoso.\n\n⭐ *¿Cómo estuvo todo?*\nTu opinión nos ayuda a mejorar.\n\n¡Vuelve pronto por más sabor! 🌶️❤️`,

    cancelado: (order) => `Hola ${order.cliente.nombres} 😔\n\nLamentamos informarte que tu pedido ${order.numeroOrden} ha sido cancelado.\n\n❌ *Motivo:* [Especificar motivo]\n\n💰 Si realizaste algún pago, será reembolsado en las próximas 24 horas.\n\n📞 Para más información, contáctanos.\n\n¡Esperamos verte pronto! 🌶️`
  };

  // Mensaje especial para cambios en productos
  private static readonly PRODUCT_CHANGE_MESSAGE = (order: PedidoFirestore & { id: string }) => 
    `Hola ${order.cliente.nombres}! 📝\n\nHemos realizado algunos ajustes a tu pedido ${order.numeroOrden}.\n\n🔄 *Cambios realizados*\nRevisa los detalles actualizados.\n\nTotal actualizado: ${cop(order.total)}\n\n¿Todo está bien? Responde para confirmar.\n\n¡Gracias por tu comprensión! 🌶️`;

  // Mensaje de nuevo pedido para el negocio
  private static readonly NEW_ORDER_BUSINESS_MESSAGE = (order: PedidoFirestore & { id: string }) => {
    const items = order.items.map((item, index) => 
      `${index + 1}. x${item.qty} ${item.product.name}${item.version ? ` (${item.version})` : ''}${item.size ? ` - ${item.size}` : ''}`
    ).join('\n');

    return `🔔 *NUEVO PEDIDO* 🔔\n\n📋 *Orden:* ${order.numeroOrden}\n👤 *Cliente:* ${order.cliente.nombres}\n📱 *Teléfono:* ${order.cliente.celular}\n\n🛍️ *Productos:*\n${items}\n\n💰 *Total:* ${cop(order.total)}\n💳 *Pago:* ${order.formaPago}\n🚚 *Servicio:* ${order.servicio === 'domicilio' ? 'Domicilio' : 'Para llevar'}\n\n${order.servicio === 'domicilio' ? `📍 *Dirección:*\n${order.cliente.direccion}` : ''}\n\n⚡ *Estado:* ${order.estado === 'no_pagado' ? 'Pendiente de pago' : 'Pagado'}\n\n🌶️ ¡Nuevo Pecado Picoso!`;
  };

  // Enviar notificación al cliente sobre cambio de estado
  static sendStatusNotification(order: PedidoFirestore & { id: string }, newStatus: OrderStatus): void {
    const message = this.STATUS_MESSAGES[newStatus](order);
    this.sendWhatsAppMessage(order.cliente.celular, message);
  }

  // Enviar notificación sobre cambios en productos
  static sendProductChangeNotification(order: PedidoFirestore & { id: string }): void {
    const message = this.PRODUCT_CHANGE_MESSAGE(order);
    this.sendWhatsAppMessage(order.cliente.celular, message);
  }

  // Notificar al negocio sobre nuevo pedido
  static sendNewOrderNotification(order: PedidoFirestore & { id: string }): void {
    const message = this.NEW_ORDER_BUSINESS_MESSAGE(order);
    this.sendWhatsAppMessage(this.BUSINESS_PHONE, message);
  }

  // Mensaje personalizado
  static sendCustomMessage(phone: string, message: string): void {
    this.sendWhatsAppMessage(phone, message);
  }

  // Función base para enviar mensajes de WhatsApp
  private static sendWhatsAppMessage(phone: string, message: string): void {
    const cleanPhone = phone.replace(/\D/g, '');
    const finalPhone = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodedMessage}`;
    
    // Abrir WhatsApp en nueva ventana
    window.open(whatsappUrl, '_blank');
  }

  // Generar mensaje de confirmación de pedido (usado por CartDrawer)
  static generateOrderConfirmationMessage(order: PedidoFirestore & { id: string }): string {
    const items = order.items.map((item, index) => 
      `${index + 1}. x${item.qty} ${item.product.name}${item.version ? ` (${item.version})` : ''}${item.size ? ` - ${item.size}` : ''}`
    ).join('\n');

    return `🌶️ *Nuevo Pedido - Pecado Picoso* 🌶️\n\n📋 *Número:* ${order.numeroOrden}\n👤 *Cliente:* ${order.cliente.nombres}\n📱 *Teléfono:* ${order.cliente.celular}\n\n🛍️ *Productos:*\n${items}\n\n💰 *Total:* ${cop(order.total)}\n💳 *Pago:* ${order.formaPago}\n🚚 *Servicio:* ${order.servicio === 'domicilio' ? 'Domicilio' : 'Para llevar'}\n\n${order.servicio === 'domicilio' ? `📍 *Dirección:*\n${order.cliente.direccion}\n${order.cliente.coordenadas ? '📱 Ubicación compartida en tiempo real' : ''}` : ''}\n\n✅ *Confirma este pedido para continuar*\n\n¡Gracias por elegir Pecado Picoso! 🔥`;
  }

  // Mensajes predefinidos comunes
  static readonly PREDEFINED_MESSAGES = {
    confirmPayment: (orderNumber: string) => 
      `¡Hola! Hemos recibido tu pago para el pedido ${orderNumber}. ¡Comenzamos a preparar tu Pecado Picoso! 🌶️✅`,
    
    readyForPickup: (orderNumber: string) => 
      `¡Tu pedido ${orderNumber} está listo para recoger! Te esperamos en nuestro punto. 🥡✨`,
    
    delayNotification: (orderNumber: string, extraMinutes: number) => 
      `Disculpa la demora con tu pedido ${orderNumber}. Necesitamos ${extraMinutes} minutos adicionales para asegurar la mejor calidad. ¡Gracias por tu paciencia! 🌶️⏱️`,
    
    thankYou: (customerName: string) => 
      `¡Gracias ${customerName} por elegir Pecado Picoso! Esperamos verte pronto. 🌶️❤️`,
  };
}
