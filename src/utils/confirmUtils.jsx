// src/utils/confirmUtils.jsx

import toast from 'react-hot-toast';

/**
 * Muestra un toast de confirmación con botones personalizados
 * Optimizado para mobile con position fixed y overlay oscuro
 * @param {string} title - Título de la confirmación
 * @param {string} message - Mensaje descriptivo (opcional)
 * @param {object} options - Opciones de personalización
 * @returns {Promise<boolean>} - true si confirma, false si cancela
 */
export const confirmarAccion = ({
  title = '¿Estás seguro?',
  message = '',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmColor = '#dc3545',
  cancelColor = '#6c757d'
}) => {
  return new Promise((resolve) => {
    toast((t) => (
      <div style={{ 
        width: '100%',
        textAlign: 'center'
      }}>
        {/* Título */}
        <p style={{ 
          margin: '0 0 8px 0', 
          fontWeight: '700',
          fontSize: '16px',
          lineHeight: '1.4',
          color: '#1a1a1a'
        }}>
          {title}
        </p>
        
        {/* Mensaje (opcional) */}
        {message && (
          <p style={{ 
            margin: '0 0 20px 0', 
            fontSize: '14px', 
            color: '#555',
            lineHeight: '1.5'
          }}>
            {message}
          </p>
        )}
        
        {/* Botones */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          justifyContent: 'center',
          flexWrap: 'nowrap',
          marginTop: message ? '20px' : '16px'
        }}>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toast.dismiss(t.id);
              resolve(false);
            }}
            style={{
              padding: '12px 20px',
              background: cancelColor,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              minWidth: '100px',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toast.dismiss(t.id);
              resolve(true);
            }}
            style={{
              padding: '12px 20px',
              background: confirmColor,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              minWidth: '100px',
              transition: 'all 0.2s ease',
              boxShadow: `0 2px 8px ${confirmColor}40`
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    ), { 
      duration: Infinity,
      style: {
        maxWidth: '400px',
        padding: '24px',
        background: '#fff',
        borderRadius: '12px'
      },
      // Importante: no cerrar automáticamente
      dismiss: {
        duration: Infinity
      }
    });
  });
};