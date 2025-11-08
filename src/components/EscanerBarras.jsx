// src/components/EscanerBarras.jsx

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

function EscanerBarras({ onScan, onClose }) {
  const scannerRef = useRef(null);
  const [error, setError] = useState('');
  const [ultimoMensaje, setUltimoMensaje] = useState('');
  const ultimoCodigoProcesado = useRef(null);
  const timeoutProcesamiento = useRef(null);
  
  // Bandera para el error 'Cannot stop'
  const scannerHaIniciado = useRef(false);

  useEffect(() => {
    // Ya no usamos 'inicializadoRef'. Dejamos que StrictMode haga lo suyo.
    
    const iniciarEscaner = async () => {
      // --- FIX DOBLE CÁMARA: Limpiamos el div ANTES de empezar ---
      const readerEl = document.getElementById("reader");
      if (readerEl) {
        readerEl.innerHTML = "";
      }
      // --- FIN FIX ---

      try {
        const scanner = new Html5Qrcode("reader");
        scannerRef.current = scanner;
        
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            // Sin qrbox para que use el 100% del visor
          },
          (codigo) => {
            if (ultimoCodigoProcesado.current === codigo) return;

            ultimoCodigoProcesado.current = codigo;
            setUltimoMensaje(`✓ Escaneado: ${codigo.substring(0, 13)}`);

            if (onScan) onScan(codigo);

            if (timeoutProcesamiento.current) {
              clearTimeout(timeoutProcesamiento.current);
            }
            
            timeoutProcesamiento.current = setTimeout(() => {
              ultimoCodigoProcesado.current = null;
              setUltimoMensaje('');
            }, 500); 
          },
          () => {} // Ignorar errores de escaneo
        );

        // Si llegamos aquí, el scanner SÍ arrancó
        scannerHaIniciado.current = true;

      } catch (err) {
        console.error("Error al iniciar:", err);
        setError('No se pudo acceder a la cámara');
      }
    };

    iniciarEscaner();

    // Función de limpieza de useEffect
    return () => {
      if (timeoutProcesamiento.current) {
        clearTimeout(timeoutProcesamiento.current);
      }
      
      // Doble validación para el error 'Cannot stop'
      if (scannerRef.current && scannerHaIniciado.current) {
        scannerRef.current.stop()
          .catch((err) => {
            console.warn("Error (ignorable) al detener el scanner:", err);
          })
          .finally(() => {
            // --- ¡FIX DOBLE CÁMARA! ---
            // Limpiamos el DIV manualmente DESPUÉS de frenar
            const readerEl = document.getElementById("reader");
            if (readerEl) {
              readerEl.innerHTML = "";
            }
            // --- FIN DEL FIX ---
            scannerRef.current = null;
          });
      }
    };
  }, []); // El array de dependencias sigue vacío

  const handleClose = () => {
    if (scannerRef.current && scannerHaIniciado.current) {
      scannerRef.current.stop()
        .catch((err) => {
          console.warn("Error (ignorable) al detener en handleClose:", err); 
        })
        .finally(() => {
          scannerRef.current = null;
          
          // Limpiamos también al cerrar manualmente
          const readerEl = document.getElementById("reader");
          if (readerEl) {
            readerEl.innerHTML = "";
          }
          
          onClose(); 
        });
    } else {
      onClose();
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.95)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2147483647, // zIndex MÁXIMO
        padding: '0.5rem'
      }}
    >
      <div 
        style={{
          background: 'white',
          borderRadius: '16px',
          maxWidth: '450px',
          width: '100%',
          maxHeight: '95vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }}
      >
        <div style={{
          padding: '1rem',
          borderBottom: '2px solid #e0e0e0',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', textAlign: 'center' }}>
            📷 Escáner de Códigos
          </h2>
        </div>

        <div style={{
          padding: '1rem',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {error && (
            <div style={{
              padding: '0.75rem',
              background: '#f8d7da',
              color: '#721c24',
              borderRadius: '8px',
              marginBottom: '1rem',
              width: '100%',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <div 
            id="reader" 
            style={{
              width: '100%',
              borderRadius: '12px',
              overflow: 'hidden',
              marginBottom: '0.75rem',
              border: '3px solid #28a745'
            }}
          ></div>

          {ultimoMensaje && (
            <div style={{
              padding: '0.5rem 1rem',
              background: '#d4edda',
              color: '#155724',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: '600',
              marginBottom: '0.5rem',
              textAlign: 'center',
              width: '100%'
            }}>
              {ultimoMensaje}
            </div>
          )}

          <p style={{ 
            textAlign: 'center', 
            color: '#666', 
            fontSize: '0.85rem',
            margin: '0.5rem 0',
            fontWeight: '600'
          }}>
            🎯 Centra el código y se escaneará automáticamente
          </p>
        </div>

        <div style={{
          padding: '1rem',
          borderTop: '2px solid #e0e0e0'
        }}>
          <button 
            onClick={handleClose}
            className="btn"
            style={{ 
              backgroundColor: '#dc3545',
              width: '100%',
              padding: '0.75rem',
              fontSize: '1rem',
              fontWeight: '600'
            }}
          >
            ✕ Cerrar Escáner
          </button>
        </div>
      </div>
    </div>
  );
}

export default EscanerBarras;