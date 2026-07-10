import type { PedidoFirestore } from '../types/order';
import type { FirestoreClient } from '../services/clientService';
import { cop } from './format';

export type QuickMessage = { label: string; message: string };

export function buildOrderQuickMessages(order: PedidoFirestore & { id: string }): QuickMessage[] {
  const nombre = order.cliente.nombres?.split(' ')[0] || order.cliente.nombres;
  const codigo = order.numeroOrden;
  const descuentoLinea = (order.descuentoTotal ?? 0) > 0
    ? ` (incluye descuento de ${cop(order.descuentoTotal!)})`
    : '';

  return [
    {
      label: '✅ Confirmar pedido',
      message: `Hola ${nombre}! Confirmamos tu pedido ${codigo} por ${cop(order.total)}${descuentoLinea}. ¡Gracias por tu compra! 🌶️`,
    },
    {
      label: '💳 Recordar pago',
      message: `Hola ${nombre}! Te recordamos enviarnos el comprobante de pago de tu pedido ${codigo} para confirmarlo 💳`,
    },
    {
      label: '🛵 En camino',
      message: `Hola ${nombre}! Tu pedido ${codigo} ya va en camino 🛵`,
    },
    {
      label: '🎉 Listo para recoger',
      message: `Hola ${nombre}! Tu pedido ${codigo} ya está listo para recoger 🎉`,
    },
    {
      label: '💛 Agradecimiento',
      message: `Gracias por tu compra, ${nombre}! Esperamos que disfrutes tu pedido ${codigo} 💛`,
    },
  ];
}

export function buildClientQuickMessages(client: FirestoreClient): QuickMessage[] {
  const nombre = client.nombres?.split(' ')[0] || client.nombres;

  return [
    {
      label: '👋 Saludo',
      message: `Hola ${nombre}! Te contactamos desde Pecado Picoso 👋`,
    },
    {
      label: '🎉 Promo especial',
      message: `Hola ${nombre}! Tenemos una promo especial para ti 🎉 Escríbenos para más info.`,
    },
    {
      label: '🎂 Cumpleaños',
      message: `¡Feliz cumpleaños, ${nombre}! 🎂 Tienes un descuento especial esperándote en tu próximo pedido.`,
    },
    {
      label: '😋 Reactivación',
      message: `Hola ${nombre}! Hace tiempo no sabemos de ti, ¿qué antojo tienes hoy? 😋`,
    },
  ];
}
