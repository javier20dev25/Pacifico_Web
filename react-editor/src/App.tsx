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
    <nav style={{ padding: '1rem', backgroundColor: '#eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        {isAuthenticated ? (
          <>
            <Link to="/dashboard" style={{ marginRight: '1rem' }}>Dashboard</Link>
            <Link to="/editor" style={{ marginRight: '1rem' }}>Editor de Tienda</Link>
            {userRole === 'admin' && (
              <Link to="/admin" style={{ marginRight: '1rem' }}>Admin</Link>
            )}
          </>
        ) : (
          <Link to="/login" style={{ marginRight: '1rem' }}>Login</Link>
        )}
      </div>
      {isAuthenticated && (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: '1rem', fontStyle: 'italic' }}>{userEmail}</span>
          <button onClick={logout} style={{ background: 'none', border: 'none', color: 'blue', cursor: 'pointer', textDecoration: 'underline' }}>
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