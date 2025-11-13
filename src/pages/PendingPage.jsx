import React from 'react';
import { Link } from 'react-router-dom';

function PendingPage() {
  return (
    <div style={{ 
      maxWidth: '500px', 
      margin: '5rem auto', 
      padding: '2.5rem', 
      background: 'white', 
      borderRadius: '12px', 
      boxShadow: 'var(--shadow-lg)',
      textAlign: 'center'
    }}>
      <h1 style={{ marginTop: 0, fontSize: '2.5rem' }}>⏳</h1>
      <h2 style={{ marginBottom: '1rem' }}>Registro Exitoso</h2>
      <p style={{ color: '#333', fontSize: '1.1rem', lineHeight: '1.6' }}>
      	Tu cuenta ha sido creada y está pendiente de aprobación.
      </p>
      <p style={{ color: '#666' }}>
      	Un administrador revisará tu solicitud. Puedes volver a intentar iniciar sesión más tarde.
      </p>
      <Link 
    	to="/login" 
    	className="btn" 
    	style={{ 
    		marginTop: '1.5rem', 
    		textDecoration: 'none', 
    		backgroundColor: '#6c757d' 
    	}}
  	  >
    	Volver a Inicio de Sesión
      </Link>
    </div>
  );
}

export default PendingPage;