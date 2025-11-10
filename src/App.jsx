import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast"; // <-- 1. IMPORTA ESTA LÍNEA

import Navegacion from "./components/Navegacion.jsx";
import Inicio from "./pages/Inicio.jsx";
import Clientes from "./pages/Clientes.jsx";
import Proveedores from "./pages/Proveedores.jsx";
import Verduleria from "./pages/Verduleria.jsx";
import OrdenesCompra from "./pages/OrdenesCompra";
import DetalleOrden from "./pages/DetalleOrden";
import Productos from "./pages/Productos.jsx";

function App() {
  return (
    <BrowserRouter>
       {" "}
      <div className="app-container">
          <Navegacion />
        {/* 2. AÑADE ESTA LÍNEA AQUÍ */}
          <Toaster /> {" "}
        <div className="main-wrapper">
           {" "}
          <main className="page-content">
             {" "}
            <Routes>
                <Route path="/" element={<Inicio />} />
                <Route path="/clientes" element={<Clientes />} />
                <Route path="/proveedores" element={<Proveedores />} />
                <Route path="/verduleria" element={<Verduleria />} />
                <Route path="/ordenes" element={<OrdenesCompra />} />
                <Route path="/ordenes/:ordenId" element={<DetalleOrden />} />
              <Route path="/productos" element={<Productos />} /> {" "}
            </Routes>
             {" "}
          </main>
           {" "}
        </div>
         {" "}
      </div>
       {" "}
    </BrowserRouter>
  );
}

export default App;
