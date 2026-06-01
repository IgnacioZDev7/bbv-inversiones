import axios from 'axios';

// La URL base asume que el server Django corre en 8000.
const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de Request: Añade el token de acceso a las cabeceras
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de Response: Maneja el refresh automático del token si recibimos 401
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Si el error es 401 Unauthorized y no hemos intentado refrescar ya
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          // Intentar obtener un nuevo access token usando el refresh token
          // Apunta a la ruta real proporcionada por el usuario
          const response = await axios.post('http://127.0.0.1:8000/api/auth/token/refresh/', {
            refresh: refreshToken
          });

          const newAccessToken = response.data.access;
          localStorage.setItem('access_token', newAccessToken);

          // Actualizar el header de la petición original y reintentar
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          // Si el refresh falla (ej. expirado), limpiar tokens y forzar re-login
          console.error("Refresh token failed", refreshError);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/signin';
          return Promise.reject(refreshError);
        }
      } else {
        // No hay refresh token
        window.location.href = '/signin';
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
