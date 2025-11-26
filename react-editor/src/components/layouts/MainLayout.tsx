import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuth, useLogout } from '../../hooks/useAuth';

// Componente de Navegación Dinámica (Movido aquí desde App.tsx)
const Navigation = () => {
  const { isAuthenticated, userRole, userEmail } = useAuth();
  const logout = useLogout();
  return (
    <nav className="bg-gray-100 p-4 flex justify-between items-center shadow-md">
      <div className="w-1/3">
        {/* Espacio izquierdo para balancear */}
      </div>
      <div className="w-1/3 text-center text-2xl font-bold">
        <Link to="/dashboard" className="text-blue-600">Pacifico</Link><span className="text-gray-800">Web</span>
      </div>
      <div className="w-1/3 flex justify-end items-center">
        {isAuthenticated ? (
          <>
            {userRole === 'admin' && (
              <Link to="/admin" className="mr-4 text-blue-600 hover:text-blue-800 font-medium">Admin</Link>
            )}
            <span className="mr-4 text-gray-700 font-mono text-sm hidden md:inline">{userEmail}</span>
            <button onClick={logout} className="px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75">
              Cerrar Sesión
            </button>
          </>
        ) : (
          <Link to="/login" className="mr-4 text-blue-600 hover:text-blue-800 font-medium">Login</Link>
        )}
      </div>
    </nav>
  );
}


const MainLayout: React.FC = () => {
  return (
    <div>
      <Navigation />
      <main>
        <Outlet /> {/* Las rutas anidadas se renderizarán aquí */}
      </main>
    </div>
  );
};

export default MainLayout;
