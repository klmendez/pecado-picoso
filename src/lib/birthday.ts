// Cumpleaños se guardan como texto "MM-DD" (sin año) para poder comparar
// contra la fecha de hoy sin importar en qué año esté el pedido.

export function toBirthdayKey(dateInput: string): string | null {
  if (!dateInput) return null;
  // <input type="date"> entrega "YYYY-MM-DD"
  const match = dateInput.match(/(\d{2})-(\d{2})$/);
  if (!match) return null;
  return `${match[1]}-${match[2]}`;
}

export function isBirthdayToday(birthdayKey: string | null | undefined, now: Date = new Date()): boolean {
  if (!birthdayKey) return false;
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return birthdayKey === `${month}-${day}`;
}

const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export function formatBirthdayLabel(birthdayKey: string | null | undefined): string | null {
  if (!birthdayKey) return null;
  const [month, day] = birthdayKey.split("-").map(Number);
  if (!month || !day || month < 1 || month > 12) return null;
  return `${day} de ${MONTH_NAMES[month - 1]}`;
}

export function monthName(monthIndex1to12: number): string {
  return MONTH_NAMES[monthIndex1to12 - 1] ?? "";
}

// Días que faltan para el próximo cumpleaños de esta fecha (0 = hoy).
export function daysUntilNextBirthday(birthdayKey: string, now: Date = new Date()): number {
  const [month, day] = birthdayKey.split("-").map(Number);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let next = new Date(now.getFullYear(), month - 1, day);
  if (next < today) next = new Date(now.getFullYear() + 1, month - 1, day);
  return Math.round((next.getTime() - today.getTime()) / 86400000);
}
