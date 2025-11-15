
import { Outlet } from 'react-router-dom';

// Este layout simplemente renderiza la ruta hija sin ninguna UI adicional.
// Es perfecto para páginas públicas como el visor de la tienda, que
// no deben tener la barra de navegación del editor.
const PublicLayout = () => {
  return (
    <main>
      <Outlet />
    </main>
  );
};

export default PublicLayout;
