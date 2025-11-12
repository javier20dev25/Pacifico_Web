import axios from 'axios';// Crear una instancia de Axios con configuración centralizada
const apiClient = axios.create({
  baseURL: '/api', // Prefijo para todas las rutas
});// Interceptor de peticiones
apiClient.interceptors.request.use(
  (config) => {
    // Obtener el token de localStorage en cada petición
    const token = localStorage.getItem('sessionToken');
    if (token) {
      // Si el token existe, añadirlo a la cabecera Authorization
      config.headers.Authorization = 'Bearer ' + token;
    }
    return config; // Devolver la configuración modificada
  },
  (error) => {
    // Manejar errores de la petición
    return Promise.reject(error);
  }
);export default apiClient;