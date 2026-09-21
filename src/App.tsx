import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AkoraBubble from "./components/AkoraBubble";
import akoraLogo from "./assets/akora.png";
import pecadoLogo from "./assets/logo.webp";

import Home from "./pages/Home";
import CatalogoPage from "./pages/CatalogoPage";
import ArmarPedido from "./pages/ArmarPedido";
import AdminDashboard from "./pages/AdminDashboard";
import OrderDetailPage from "./pages/admin/OrderDetailPage";
import Terminos from "./pages/Terminos";
import Contacto from "./pages/Contacto";

const suspensionDate = "21/09/2026";
const unpaidSince = "febrero de 2026";

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  return null;
}

function AppLayout() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <div className={`min-h-dvh flex flex-col ${isAdmin ? "bg-gray-50 text-neutral-900" : "bg-crema text-neutral-900"}`}>
      <ScrollToTop />
      {!isAdmin && <Navbar />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalogo" element={<CatalogoPage />} />
          <Route path="/armar" element={<ArmarPedido />} />
          <Route path="/armar/personalizar" element={<ArmarPedido />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/pedido/:id" element={<OrderDetailPage />} />
          <Route path="/terminos" element={<Terminos />} />
          <Route path="/contacto" element={<Contacto />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isAdmin && <Footer />}
      <AkoraBubble />
    </div>
  );
}

function SuspensionGate({ onViewDemo }: { onViewDemo: () => void }) {
  return (
    <main className="min-h-dvh bg-crema px-5 py-8 text-neutral-950">
      <section className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-3xl flex-col items-center justify-center text-center">
        <img
          src={pecadoLogo}
          alt="Pecado Picoso"
          className="mb-8 h-24 w-auto object-contain sm:h-28"
        />

        <div className="w-full rounded-lg border border-red-200 bg-white px-6 py-8 shadow-sm sm:px-10 sm:py-10">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-rojo">
            Servicio suspendido
          </p>
          <h1 className="text-3xl font-bold leading-tight text-neutral-950 sm:text-5xl">
            Pagina temporalmente bloqueada
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-neutral-700 sm:text-lg">
            Esta pagina fue suspendida el {suspensionDate} por falta de pago
            desde {unpaidSince}.
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-neutral-700 sm:text-lg">
            Si quieres ver una demo o reactivar el servicio, puedes contactar a
            Akora.
          </p>

          <button
            type="button"
            onClick={onViewDemo}
            className="mt-8 inline-flex items-center justify-center rounded-md bg-rojo px-7 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white shadow-sm transition hover:bg-rojo-dark focus:outline-none focus:ring-2 focus:ring-rojo focus:ring-offset-2"
          >
            Mirar demo
          </button>

          <div className="mt-8 flex flex-col items-center gap-3 border-t border-neutral-200 pt-6">
            <span className="text-sm font-semibold uppercase tracking-[0.14em] text-neutral-500">
              Desarrollado por
            </span>
            <img
              src={akoraLogo}
              alt="Akora"
              className="h-14 w-auto object-contain"
            />
          </div>
        </div>
      </section>
    </main>
  );
}

export default function App() {
  const [showDemo, setShowDemo] = useState(false);

  if (!showDemo) {
    return <SuspensionGate onViewDemo={() => setShowDemo(true)} />;
  }

  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
