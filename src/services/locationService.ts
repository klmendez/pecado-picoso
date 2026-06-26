import type { CustomerLocation } from '../types/order';

export class LocationService {
  private static watchId: number | null = null;
  private static isWatching = false;

  // Obtener ubicación actual una vez
  static getCurrentLocation(): Promise<CustomerLocation> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalización no soportada'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now()
          });
        },
        (error) => {
          let message = 'Error al obtener ubicación';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Permiso de ubicación denegado';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Ubicación no disponible';
              break;
            case error.TIMEOUT:
              message = 'Tiempo de espera agotado';
              break;
          }
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }

  // Iniciar seguimiento de ubicación en tiempo real
  static startWatchingLocation(
    onLocationUpdate: (location: CustomerLocation) => void,
    onError?: (error: string) => void
  ): void {
    if (!navigator.geolocation) {
      onError?.('Geolocalización no soportada');
      return;
    }

    if (this.isWatching) {
      return; // Ya está observando
    }

    this.isWatching = true;
    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location: CustomerLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now()
        };
        onLocationUpdate(location);
      },
      (error) => {
        let message = 'Error al obtener ubicación';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Permiso de ubicación denegado';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Ubicación no disponible';
            break;
          case error.TIMEOUT:
            message = 'Tiempo de espera agotado';
            break;
        }
        onError?.(message);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000
      }
    );
  }

  // Detener seguimiento de ubicación
  static stopWatchingLocation(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.isWatching = false;
    }
  }

  // Verificar si se está observando la ubicación
  static isWatchingLocation(): boolean {
    return this.isWatching;
  }

  // Generar enlace de Google Maps
  static generateMapsLink(location: CustomerLocation): string {
    return `https://maps.google.com/?q=${location.lat},${location.lng}`;
  }

  // Calcular distancia entre dos puntos (en metros)
  static calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = (point1.lat * Math.PI) / 180;
    const φ2 = (point2.lat * Math.PI) / 180;
    const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
    const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // Verificar si el usuario se ha movido significativamente
  static hasSignificantMovement(
    lastLocation: CustomerLocation,
    newLocation: CustomerLocation,
    thresholdMeters: number = 10
  ): boolean {
    const distance = this.calculateDistance(lastLocation, newLocation);
    return distance >= thresholdMeters;
  }
}
