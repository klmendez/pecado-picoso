import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import CatalogoPage from "./pages/CatalogoPage";
import ArmarPedido from "./pages/ArmarPedido";
import Terminos from "./pages/Terminos";
import Contacto from "./pages/Contacto";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-dvh flex flex-col bg-neutral-950 text-neutral-100">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/catalogo" element={<CatalogoPage />} />
            <Route path="/armar" element={<ArmarPedido />} />
            <Route path="/terminos" element={<Terminos />} />
            <Route path="/contacto" element={<Contacto />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
