import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Cake, Phone } from 'lucide-react';
import type { FirestoreClient } from '../../services/clientService';
import { monthName, daysUntilNextBirthday } from '../../lib/birthday';
import { buildClientQuickMessages } from '../../lib/whatsappTemplates';
import WhatsAppQuickSend from './WhatsAppQuickSend';

const WEEKDAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

type DayCell = { date: number; monthDayKey: string } | null;

function buildMonthGrid(year: number, monthIndex0: number): DayCell[] {
  const firstWeekdayMon0 = (new Date(year, monthIndex0, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex0 + 1, 0).getDate();

  const cells: DayCell[] = [];
  for (let i = 0; i < firstWeekdayMon0; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: d, monthDayKey: `${pad(monthIndex0 + 1)}-${pad(d)}` });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

interface BirthdayCalendarProps {
  clients: FirestoreClient[];
}

export default function BirthdayCalendar({ clients }: BirthdayCalendarProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-11
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const clientsWithBirthday = useMemo(
    () => clients.filter((c) => !!c.fechaNacimiento),
    [clients]
  );

  const byMonthDay = useMemo(() => {
    const map: Record<string, FirestoreClient[]> = {};
    for (const c of clientsWithBirthday) {
      const key = c.fechaNacimiento!;
      if (!map[key]) map[key] = [];
      map[key].push(c);
    }
    return map;
  }, [clientsWithBirthday]);

  const upcoming = useMemo(() => {
    return clientsWithBirthday
      .map((c) => ({ client: c, days: daysUntilNextBirthday(c.fechaNacimiento!) }))
      .sort((a, b) => a.days - b.days)
      .slice(0, 15);
  }, [clientsWithBirthday]);

  const grid = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const goToMonth = (delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setViewMonth(m);
    setViewYear(y);
    setSelectedKey(null);
  };

  const goToToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedKey(null);
  };

  const selectedClients = selectedKey ? byMonthDay[selectedKey] || [] : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
      {/* Calendario */}
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-black">
            {monthName(viewMonth + 1)} {viewYear}
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={goToToday}
              className="px-2.5 py-1 text-xs font-medium text-gray-500 border border-gray-200 rounded hover:bg-gray-50 mr-1"
            >
              Hoy
            </button>
            <button onClick={() => goToMonth(-1)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => goToMonth(1)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAY_LABELS.map((w) => (
            <div key={w} className="text-center text-[11px] font-semibold text-gray-400 uppercase py-1">
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {grid.map((cell, idx) => {
            if (!cell) return <div key={idx} className="aspect-square" />;
            const birthdayClients = byMonthDay[cell.monthDayKey] || [];
            const hasBirthday = birthdayClients.length > 0;
            const isTodayCell =
              viewYear === today.getFullYear() && viewMonth === today.getMonth() && cell.date === today.getDate();
            const isSelected = selectedKey === cell.monthDayKey;

            return (
              <button
                key={idx}
                onClick={() => setSelectedKey(hasBirthday ? cell.monthDayKey : null)}
                disabled={!hasBirthday}
                className={[
                  'aspect-square rounded-lg flex flex-col items-center justify-center relative text-sm transition',
                  isSelected ? 'ring-2 ring-rojo' : '',
                  isTodayCell ? 'bg-rojo-light font-bold text-rojo' : hasBirthday ? 'bg-amber-50 hover:bg-amber-100 cursor-pointer' : 'text-gray-600',
                ].join(' ')}
              >
                <span>{cell.date}</span>
                {hasBirthday && (
                  <span className="absolute bottom-1 flex items-center gap-0.5 text-[10px]">
                    🎂{birthdayClients.length > 1 ? birthdayClients.length : ''}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {selectedKey && (
          <div className="mt-4 border-t border-gray-100 pt-3">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Cumpleaños el {selectedKey.split('-')[1]} de {monthName(Number(selectedKey.split('-')[0]))}
            </div>
            <div className="space-y-2">
              {selectedClients.map((c) => (
                <div key={c.celular} className="flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{c.nombres}</div>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Phone size={10} /> {c.celular}
                    </div>
                  </div>
                  <WhatsAppQuickSend phone={c.celular} templates={buildClientQuickMessages(c)} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Próximos cumpleaños */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900 uppercase tracking-wide">
          <Cake size={16} /> Próximos cumpleaños
        </h3>

        {upcoming.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-8">
            Ningún cliente tiene fecha de cumpleaños guardada todavía.
          </div>
        ) : (
          <div className="space-y-2 max-h-[520px] overflow-y-auto">
            {upcoming.map(({ client, days }) => (
              <div key={client.celular} className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900 truncate">
                    {client.nombres}
                    {days === 0 && <span title="¡Hoy!">🎂</span>}
                  </div>
                  <div className="text-xs text-gray-400">
                    {days === 0 ? '¡Hoy!' : days === 1 ? 'Mañana' : `En ${days} días`}
                  </div>
                </div>
                <WhatsAppQuickSend phone={client.celular} templates={buildClientQuickMessages(client)} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
