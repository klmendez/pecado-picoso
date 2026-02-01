import { useEffect, useMemo, useState } from "react";

import type { Barrio } from "../data/barrios";
import { BARRIOS } from "../data/barrios";
import type { Service } from "../lib/whatsapp";
import { barrioMatchesQuery } from "../components/armar-pedido/utils";

export function useBarrioSelection(service: Service) {
  const [barrio, setBarrio] = useState<Barrio | null>(null);
  const [barrioQuery, setBarrioQuery] = useState("");

  useEffect(() => {
    if (service !== "domicilio") {
      setBarrio(null);
      setBarrioQuery("");
    }
  }, [service]);

  const filteredBarrios = useMemo(() => {
    if (!barrioQuery.trim()) return BARRIOS;
    return BARRIOS.filter((b) => barrioMatchesQuery(b, barrioQuery));
  }, [barrioQuery]);

  useEffect(() => {
    if (service !== "domicilio") return;
    if (!barrio) return;
    if (!filteredBarrios.some((b) => b.id === barrio.id)) {
      setBarrio(null);
    }
  }, [service, barrio, filteredBarrios]);

  const deliverySectionEnabled = service === "domicilio";
  const totalBarrios = BARRIOS.length;

  return {
    barrio,
    setBarrio,
    barrioQuery,
    setBarrioQuery,
    filteredBarrios,
    deliverySectionEnabled,
    totalBarrios,
  };
}
