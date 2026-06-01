import React from 'react';
import { Link } from 'react-router';

const Unauthorized: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-gray-900 px-4">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">403 - Acceso Denegado</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8 text-center max-w-md">
        No tienes los permisos necesarios para acceder a esta página. Contacta al administrador si crees que esto es un error.
      </p>
      <Link to="/" className="px-6 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors">
        Volver al inicio
      </Link>
    </div>
  );
};

export default Unauthorized;
