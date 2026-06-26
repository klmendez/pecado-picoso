# 📋 Sistema de Gestión de Pedidos - Pecado Picoso

Este documento explica cómo configurar y usar el sistema completo de gestión de pedidos con Firestore y ubicación en tiempo real.

## 🚀 Configuración Inicial

### 1. Configurar Firebase

1. **Crear proyecto en Firebase Console**
   - Ve a [Firebase Console](https://console.firebase.google.com/)
   - Crea un nuevo proyecto llamado "pecado-picoso"
   - Habilita Firestore Database
   - Configura las reglas de seguridad (ver más abajo)

2. **Obtener credenciales**
   - En Project Settings > General > Your apps
   - Registra una nueva aplicación web
   - Copia la configuración de Firebase

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   ```
   
   Edita `.env` con tus credenciales:
   ```env
   VITE_FIREBASE_API_KEY=tu_api_key
   VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=tu_proyecto_id
   VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
   VITE_FIREBASE_APP_ID=tu_app_id
   ```

### 2. Reglas de Firestore

Configura estas reglas en Firebase Console > Firestore Database > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Colección de pedidos
    match /pedidos/{pedidoId} {
      // Permitir lectura y escritura para todos (ajusta según tus necesidades)
      allow read, write: if true;
      
      // Para producción, considera reglas más restrictivas:
      // allow read, write: if request.auth != null;
    }
  }
}
```

### 3. Instalar dependencias

```bash
npm install
```

## 📱 Funcionalidades del Sistema

### Para Clientes

#### 1. **Crear Pedido con Ubicación**
- Los clientes pueden armar su pedido en `/armar`
- Al finalizar, se abre el CartDrawer
- Opción de compartir ubicación en tiempo real para domicilios
- El pedido se guarda automáticamente en Firestore

#### 2. **Seguimiento en Tiempo Real**
- Si el cliente acepta compartir ubicación, se actualiza cada 10 metros de movimiento
- La ubicación se guarda en el campo `cliente.ubicacionTiempoReal[]`
- Útil para entregas a domicilio

### Para Administradores

#### 1. **Panel de Administración** (`/admin`)
- Vista de todos los pedidos en tiempo real
- Filtros por estado, fecha, búsqueda
- Estadísticas en tiempo real
- Exportar a CSV

#### 2. **Gestión de Pedidos**
- **Ver detalles**: Click en el ícono de ojo
- **Editar pedido**: Click en el ícono de editar
- **Cambiar estado**: Dropdown directo en la tabla
- **Eliminar**: Click en el ícono de basura
- **Contactar cliente**: Click en el ícono de teléfono (WhatsApp)
- **Ver ubicación**: Click en el ícono de mapa

#### 3. **Estados de Pedido**
- `no_pagado`: Estado inicial
- `pagado`: Pago confirmado
- `preparando`: En preparación
- `en_camino`: Enviado (solo domicilios)
- `entregado`: Completado
- `cancelado`: Cancelado

## 🗄️ Estructura de Datos

### Colección: `pedidos`

```typescript
interface PedidoFirestore {
  numeroOrden: string;           // "PP-1776370799466"
  
  // Productos
  items: OrderItem[];            // Array de productos
  total: number;                 // Total del pedido
  subtotal: number;              // Subtotal sin envío
  delivery: number;              // Costo de envío
  
  // Cliente
  cliente: {
    nombres: string;             // Nombre completo
    celular: string;             // Teléfono
    direccion: string;           // Dirección (si es domicilio)
    coordenadas?: {              // Ubicación inicial
      lat: number;
      lng: number;
      accuracy?: number;
      timestamp: number;
    };
    mapsLink?: string;           // Link de Google Maps
    ubicacionTiempoReal?: CustomerLocation[]; // Array de ubicaciones
  };
  
  // Configuración
  formaPago: "Transferencia" | "Efectivo";
  servicio: "domicilio" | "llevar" | "local";
  estado: OrderStatus;
  
  // Metadatos
  createdAt: Timestamp;
  updatedAt: Timestamp;
  notaAdmin?: string;            // Nota interna del admin
  
  // Historial
  historialEstado?: {
    estado: OrderStatus;
    timestamp: Timestamp;
    nota?: string;
  }[];
}
```

## 🔧 Servicios Principales

### 1. OrderService
- `createOrder()`: Crear nuevo pedido
- `getOrders()`: Obtener pedidos con filtros
- `updateOrder()`: Actualizar pedido
- `updateCustomerLocation()`: Actualizar ubicación del cliente
- `subscribeToOrders()`: Escuchar cambios en tiempo real

### 2. LocationService
- `getCurrentLocation()`: Obtener ubicación actual
- `startWatchingLocation()`: Iniciar seguimiento
- `stopWatchingLocation()`: Detener seguimiento
- `calculateDistance()`: Calcular distancia entre puntos

### 3. WhatsAppNotificationService
- `sendStatusNotification()`: Notificar cambio de estado
- `sendNewOrderNotification()`: Notificar nuevo pedido al negocio
- `sendCustomMessage()`: Mensaje personalizado

## 📱 Flujo Completo

### 1. Cliente Crea Pedido
```
Cliente en /armar → Agrega productos → Llena datos → 
Click "Crear Pedido" → CartDrawer se abre → 
Acepta compartir ubicación → Pedido se guarda en Firestore →
WhatsApp se abre con mensaje al negocio
```

### 2. Admin Gestiona Pedido
```
Admin en /admin → Ve nuevo pedido → Cambia estado a "pagado" →
Cliente recibe notificación automática → Admin cambia a "preparando" →
Cliente recibe notificación → Admin cambia a "en_camino" →
Ubicación en tiempo real se muestra → Pedido se entrega →
Estado cambia a "entregado"
```

## 🌍 Ubicación en Tiempo Real

### Cómo Funciona
1. Cliente acepta permisos de ubicación en CartDrawer
2. Se obtiene ubicación inicial al crear pedido
3. Si el pedido es domicilio, se inicia seguimiento automático
4. Cada 10 metros de movimiento, se actualiza en Firestore
5. Admin puede ver ubicación actual en tiempo real
6. Se mantienen las últimas 50 ubicaciones para evitar documentos grandes

### Consideraciones
- Solo funciona con HTTPS (producción)
- Requiere permisos del navegador
- Consume batería del dispositivo
- Se detiene automáticamente al cerrar la página

## 🔐 Seguridad

### Recomendaciones para Producción
1. **Autenticación**: Implementar login para admin
2. **Reglas Firestore**: Restringir acceso por usuario autenticado
3. **Validación**: Validar datos en el servidor
4. **Rate Limiting**: Limitar creación de pedidos por IP
5. **HTTPS**: Obligatorio para geolocalización

### Reglas Firestore Seguras
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /pedidos/{pedidoId} {
      // Solo lectura para todos
      allow read: if true;
      
      // Solo escritura para usuarios autenticados (admin)
      allow write: if request.auth != null && 
                   request.auth.token.admin == true;
      
      // Permitir crear pedidos sin autenticación
      allow create: if true;
    }
  }
}
```

## 🚀 Despliegue

### Variables de Entorno en Producción
```env
VITE_FIREBASE_API_KEY=tu_api_key_produccion
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto_prod.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto_prod
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto_prod.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id_prod
VITE_FIREBASE_APP_ID=tu_app_id_prod
VITE_WHATSAPP_BUSINESS_PHONE=573178371144
```

### Build y Deploy
```bash
npm run build
# Subir dist/ a tu hosting preferido
```

## 📞 Soporte

Para dudas o problemas:
1. Revisa la consola del navegador para errores
2. Verifica que Firebase esté configurado correctamente
3. Asegúrate de que las reglas de Firestore permitan las operaciones
4. Confirma que los permisos de ubicación estén habilitados

## 🔄 Actualizaciones Futuras

### Funcionalidades Sugeridas
- [ ] Notificaciones push
- [ ] Chat en tiempo real con clientes
- [ ] Integración con sistemas de pago
- [ ] Dashboard de analytics
- [ ] App móvil nativa
- [ ] Sistema de calificaciones
- [ ] Programa de fidelidad

---

¡El sistema está listo para gestionar pedidos de Pecado Picoso con ubicación en tiempo real! 🌶️🔥
