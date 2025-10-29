import React from 'react';

const AdminStats = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Estadísticas Rápidas</h2>
      <div className="space-y-2">
        <p className="text-gray-600">Usuarios Temporales sin Activar: <span className="font-bold text-yellow-600">{stats.temp}</span></p>
        <p className="text-gray-600">Usuarios Oficiales Activos: <span className="font-bold text-green-600">{stats.active}</span></p>
      </div>
    </div>
  );
};

export default AdminStats;
