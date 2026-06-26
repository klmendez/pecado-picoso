# 🧪 Guía de Pruebas - Sistema de Pedidos Pecado Picoso

## 📋 Lista de Verificación Completa

### ✅ Configuración Inicial
- [ ] Firebase configurado con credenciales válidas
- [ ] Variables de entorno configuradas en `.env`
- [ ] Dependencias instaladas (`npm install`)
- [ ] Aplicación ejecutándose (`npm run dev`)

### ✅ Flujo del Cliente

#### 1. Crear Pedido (`/armar`)
- [ ] Navegar a `/armar`
- [ ] Agregar productos al carrito
- [ ] Configurar productos (toppings, tamaños, etc.)
- [ ] Llenar datos del cliente (nombre, teléfono)
- [ ] Seleccionar servicio (domicilio/para llevar)
- [ ] Si es domicilio: seleccionar barrio y dirección
- [ ] Elegir método de pago
- [ ] Click en "Enviar WhatsApp" → Se abre CartDrawer

#### 2. CartDrawer - Finalizar Pedido
- [ ] Revisar resumen del pedido
- [ ] Verificar datos de entrega
- [ ] **Ubicación en tiempo real** (solo domicilio):
  - [ ] Click "Compartir Ubicación"
  - [ ] Aceptar permisos del navegador
  - [ ] Verificar que muestra coordenadas
- [ ] Click "Crear Pedido"
- [ ] Verificar mensaje de éxito
- [ ] **Automático**: Se abre WhatsApp con mensaje al negocio
- [ ] **Automático**: Pedido se guarda en Firestore

#### 3. Validaciones de Firestore
- [ ] Abrir Firebase Console → Firestore
- [ ] Verificar que existe colección `pedidos`
- [ ] Verificar estructura del documento:
  ```
  {
    numeroOrden: "PP-1234567890123",
    items: [...],
    total: 50000,
    cliente: {
      nombres: "Cliente Test",
      celular: "3001234567",
      direccion: "Dirección test",
      coordenadas: { lat: 4.123, lng: -74.456, ... },
      ubicacionTiempoReal: [...]
    },
    estado: "no_pagado",
    createdAt: Timestamp,
    ...
  }
  ```

### ✅ Flujo del Administrador

#### 1. Acceso al Panel (`/admin`)
- [ ] Navegar a `/admin`
- [ ] Verificar pantalla de autenticación
- [ ] Ingresar contraseña (default: `admin123`)
- [ ] Acceder al panel de administración

#### 2. Gestión de Pedidos
- [ ] **Vista general**:
  - [ ] Ver lista de pedidos en tiempo real
  - [ ] Verificar estadísticas en tiempo real
  - [ ] Usar filtros por estado
  - [ ] Usar búsqueda por cliente/teléfono/orden
- [ ] **Acciones por pedido**:
  - [ ] 👁️ Ver detalles completos
  - [ ] ✏️ Editar pedido (cliente, productos, totales)
  - [ ] 📱 Contactar por WhatsApp
  - [ ] 📍 Ver ubicación en Google Maps
  - [ ] 🗑️ Eliminar pedido

#### 3. Cambios de Estado y Notificaciones
- [ ] **Cambiar estado** usando dropdown:
  - [ ] `no_pagado` → `pagado`
    - [ ] Verificar que se abre WhatsApp con mensaje de confirmación
  - [ ] `pagado` → `preparando`
    - [ ] Verificar mensaje "preparando pedido"
  - [ ] `preparando` → `en_camino` (solo domicilio)
    - [ ] Verificar mensaje "en camino"
  - [ ] `en_camino` → `entregado`
    - [ ] Verificar mensaje de agradecimiento
- [ ] **Verificar historial**: Cada cambio se registra en `historialEstado`

#### 4. Ubicación en Tiempo Real
- [ ] **Para pedidos con ubicación activa**:
  - [ ] Ver indicador "📍 Ubicación en tiempo real"
  - [ ] Click en icono de mapa
  - [ ] Verificar que abre Google Maps con coordenadas actuales
  - [ ] En Firestore: verificar array `ubicacionTiempoReal` con múltiples puntos

### ✅ Funcionalidades Avanzadas

#### 1. Exportar Datos
- [ ] En panel admin, click "Exportar CSV"
- [ ] Verificar descarga de archivo con datos de pedidos

#### 2. Filtros y Búsqueda
- [ ] **Filtros por estado**: Probar cada estado
- [ ] **Búsqueda**: Por nombre, teléfono, número de orden
- [ ] **Tiempo real**: Crear nuevo pedido y verificar que aparece automáticamente

#### 3. Edición Completa de Pedidos
- [ ] Abrir modal de edición
- [ ] Cambiar datos del cliente
- [ ] Modificar cantidades de productos
- [ ] Eliminar productos
- [ ] Cambiar método de pago
- [ ] Agregar nota del admin
- [ ] Verificar recálculo automático de totales

### ✅ Pruebas de Ubicación en Tiempo Real

#### Configuración de Prueba
1. **Dispositivo móvil recomendado** (mejor precisión GPS)
2. **Conexión HTTPS** (requerida para geolocalización)
3. **Permisos de ubicación** habilitados en navegador

#### Flujo de Prueba
- [ ] Cliente crea pedido domicilio
- [ ] Acepta compartir ubicación
- [ ] **Simular movimiento**:
  - [ ] Caminar/mover dispositivo >10 metros
  - [ ] Verificar en Firestore que se agregan nuevas coordenadas
  - [ ] En admin panel, verificar actualización en tiempo real

### ✅ Pruebas de WhatsApp

#### Mensajes Automáticos
- [ ] **Nuevo pedido**: Al crear pedido → mensaje al negocio
- [ ] **Cambio de estado**: Cada cambio → mensaje al cliente
- [ ] **Mensajes personalizados**: Desde admin panel

#### Verificar Contenido de Mensajes
- [ ] **Nuevo pedido**: Incluye productos, total, datos cliente
- [ ] **Estado pagado**: Confirmación de pago
- [ ] **Estado preparando**: Tiempo estimado
- [ ] **Estado en camino**: Dirección y tiempo estimado
- [ ] **Estado entregado**: Agradecimiento

### ✅ Pruebas de Seguridad y Rendimiento

#### Autenticación Admin
- [ ] Intentar acceder a `/admin` sin contraseña
- [ ] Probar contraseña incorrecta
- [ ] Verificar expiración de sesión (8 horas)
- [ ] Cerrar sesión manualmente

#### Validaciones
- [ ] **Cliente**: Intentar crear pedido sin datos obligatorios
- [ ] **Admin**: Intentar editar con datos inválidos
- [ ] **Ubicación**: Denegar permisos y verificar manejo de errores

#### Rendimiento
- [ ] **Tiempo real**: Crear múltiples pedidos, verificar actualización instantánea
- [ ] **Ubicación**: Verificar que no se envían actualizaciones excesivas
- [ ] **Firestore**: Verificar que documentos no crecen excesivamente

### 🚨 Problemas Comunes y Soluciones

#### Firebase
- **Error de conexión**: Verificar credenciales en `.env`
- **Permisos denegados**: Revisar reglas de Firestore
- **Datos no aparecen**: Verificar que Firestore esté habilitado

#### Ubicación
- **No funciona**: Verificar HTTPS y permisos del navegador
- **Baja precisión**: Usar dispositivo móvil con GPS
- **No se actualiza**: Verificar que el movimiento sea >10 metros

#### WhatsApp
- **No se abre**: Verificar formato de números de teléfono
- **Mensaje incompleto**: Verificar codificación de caracteres especiales

### ✅ Checklist Final de Producción

- [ ] Variables de entorno de producción configuradas
- [ ] Reglas de Firestore securizadas
- [ ] HTTPS habilitado
- [ ] Contraseña de admin cambiada
- [ ] Números de WhatsApp actualizados
- [ ] Pruebas en dispositivos móviles
- [ ] Backup de base de datos configurado

---

## 📊 Resultados Esperados

Al completar todas las pruebas, deberías tener:

1. **✅ Sistema completo funcionando** con creación y gestión de pedidos
2. **✅ Ubicación en tiempo real** para entregas a domicilio
3. **✅ Notificaciones automáticas** por WhatsApp
4. **✅ Panel de administración** con autenticación
5. **✅ Base de datos** con estructura completa en Firestore
6. **✅ Flujo completo** desde pedido hasta entrega

¡El sistema está listo para gestionar pedidos de Pecado Picoso! 🌶️🔥
