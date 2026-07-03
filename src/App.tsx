import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import CatalogoPage from "./pages/CatalogoPage";
import ArmarPedido from "./pages/ArmarPedido";
import AdminDashboard from "./pages/AdminDashboard";
import OrderDetailPage from "./pages/admin/OrderDetailPage";
import Terminos from "./pages/Terminos";
import Contacto from "./pages/Contacto";

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
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
