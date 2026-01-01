import React from 'react';

const LandingPage: React.FC = () => {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Bienvenido a PacíficoWeb</h1>
      <p>La nueva experiencia de gestión para tu tienda online.</p>
      
      {/* Placeholder for plans section */}
      <div style={{ margin: '2rem 0' }}>
        <h2>Planes</h2>
        <p>[Aquí se mostrarán los planes: Free, Emprendedor, Oro]</p>
      </div>

      <div>
        <button style={{ marginRight: '1rem' }}>Registrarse</button>
        <button>Iniciar Sesión</button>
      </div>
    </div>
  );
};

export default LandingPage;
