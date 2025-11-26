import { BrowserRouter, Routes, Route } from 'react-router-dom';
import StoreEditor from './pages/StoreEditor';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import NotFound from './pages/NotFound';
import MainLayout from './components/layouts/MainLayout'; // Importar el nuevo layout
import ImageUploadTest from './pages/ImageUploadTest'; // Importar la página de prueba

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas que no usan el MainLayout */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Login />} />
        <Route path="/image-test" element={<ImageUploadTest />} />

        {/* Rutas protegidas que usan el MainLayout */}
        <Route element={<MainLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/editor" element={<StoreEditor />} />
        </Route>

        {/* Ruta para páginas no encontradas */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;