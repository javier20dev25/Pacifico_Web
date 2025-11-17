import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import StoreEditor from './pages/StoreEditor';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import NotFound from './pages/NotFound';
import { useAuth, useLogout } from './hooks/useAuth';

// Componente de Navegación Dinámica
const Navigation = () => {
  const { isAuthenticated, userRole, userEmail } = useAuth();
  const logout = useLogout();
  return (
    <nav className="bg-gray-100 p-4 flex justify-between items-center shadow-md neumorphic-flat">
      <div>
        {isAuthenticated ? (
          <>
            <Link to="/dashboard" className="mr-4 text-blue-600 hover:text-blue-800 font-medium">Dashboard</Link>
            <Link to="/editor" className="mr-4 text-blue-600 hover:text-blue-800 font-medium">Editor de Tienda</Link>
            {userRole === 'admin' && (
              <Link to="/admin" className="mr-4 text-blue-600 hover:text-blue-800 font-medium">Admin</Link>
            )}
          </>
        ) : (
          <Link to="/login" className="mr-4 text-blue-600 hover:text-blue-800 font-medium">Login</Link>
        )}
      </div>
      {isAuthenticated && (
        <div className="flex items-center">
          <span className="mr-4 text-gray-700 font-mono text-sm">{userEmail}</span>
          <button onClick={logout} className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75 neumorphic-button">
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Navigation />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/editor" element={<StoreEditor />} />
        <Route path="/" element={<Login />} /> 
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;