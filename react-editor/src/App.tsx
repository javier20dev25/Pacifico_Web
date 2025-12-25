import { BrowserRouter, Routes, Route } from 'react-router-dom';
import StoreEditor from './pages/StoreEditor';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import NotFound from './pages/NotFound';
import MainLayout from './components/layouts/MainLayout';
import ImageUploadTest from './pages/ImageUploadTest';
import Welcome from './pages/Welcome';
import RielModal from './components/RielModal';
import AdminRiel from './pages/AdminRiel';
import RielActivation from './pages/RielActivation'; // <-- AÑADIDO
import AccountActivation from './pages/AccountActivation'; // <-- MI NUEVA TAREA
import RielEditor from './pages/RielEditor';       // <-- AÑADIDO
import PricingPage from './pages/Pricing'; // <-- AÑADIDO PARA PLANES
import RegisterPage from './pages/Register'; // <-- AÑADIDO PARA REGISTRO
import PaymentPage from './pages/Payment'; // <-- AÑADIDO PARA PAYPAL
import PaymentSuccessPage from './pages/PaymentSuccess'; // <-- AÑADIDO PARA PAYPAL

function App() {
  return (
    <BrowserRouter>
      {/* El modal de Riel se renderiza aquí para estar disponible globalmente */}
      <RielModal />
      
      <Routes>
        {/* Rutas públicas que no usan el MainLayout */}
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/pricing" element={<PricingPage />} /> {/* <-- AÑADIDO PARA PLANES */}
        <Route path="/register" element={<RegisterPage />} /> {/* <-- AÑADIDO PARA REGISTRO */}
        <Route path="/payment" element={<PaymentPage />} /> {/* <-- AÑADIDO PARA PAYPAL */}
        <Route path="/payment-success" element={<PaymentSuccessPage />} /> {/* <-- AÑADIDO PARA PAYPAL */}
        <Route path="/image-test" element={<ImageUploadTest />} />
        <Route path="/riel-activation" element={<RielActivation />} />
        <Route path="/activate" element={<AccountActivation />} /> {/* <-- MI NUEVA TAREA */}

        {/* Rutas protegidas que usan el MainLayout */}
        <Route element={<MainLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/riel" element={<AdminRiel />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/editor" element={<StoreEditor />} />
          <Route path="/riel/editor" element={<RielEditor />} /> {/* <-- AÑADIDO */}
        </Route>

        {/* Ruta para páginas no encontradas */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;