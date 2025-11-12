import { useState, useEffect } from 'react';

// Define la estructura esperada del payload del JWT
interface DecodedToken {
  exp: number;
  rol: string;
  email: string;
  uuid: string;
  purpose?: string;
}

// Función para decodificar el payload de un JWT
// No verifica la firma, solo decodifica para leer datos en el cliente.
function decodeToken(token: string): DecodedToken | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Failed to decode token:", error);
    return null;
  }
}

interface AuthState {
  isAuthenticated: boolean;
  userRole: string | null;
  userEmail: string | null;
}

export const useAuth = (): AuthState => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    userRole: null,
    userEmail: null
  });

  useEffect(() => {
    const token = localStorage.getItem('sessionToken');
    if (token) {
      const decoded = decodeToken(token);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        setAuthState({
          isAuthenticated: true,
          userRole: decoded.rol, // 'rol' según el payload del backend
          userEmail: decoded.email
        });
      } else {
        // Token expirado o inválido
        localStorage.removeItem('sessionToken');
        setAuthState({ isAuthenticated: false, userRole: null, userEmail: null });
      }
    } else {
        setAuthState({ isAuthenticated: false, userRole: null, userEmail: null });
    }
  }, []); // Se ejecuta solo una vez al montar el componente

  return authState;
};

// Hook para el botón de logout
export const useLogout = () => {
    const navigate = (path: string) => window.location.href = path; // Simple navigate for now

    const logout = () => {
        localStorage.removeItem('sessionToken');
        // Redirigir a la página de login y recargar para limpiar el estado
        navigate('/login');
    };

    return logout;
};