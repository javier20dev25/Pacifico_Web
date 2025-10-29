import React from 'react';
import apiClient from '@/api/axiosConfig';
import ActionButtons from './ActionButtons';

const UsersTable = ({ users, onUserAction }) => {

  const handleAction = async (action, userUuid) => {
    const actions = {
      revoke: { confirm: '¿Estás seguro de que quieres eliminar a este usuario de forma permanente?', endpoint: '/revoke-user' },
      suspend: { confirm: '¿Estás seguro de que quieres suspender a este usuario?', endpoint: '/suspend-user' },
      reactivate: { confirm: '¿Estás seguro de que quieres reactivar a este usuario?', endpoint: '/reactivate-user' },
      renew: { confirm: '¿Estás seguro de que quieres renovar el contrato de este usuario por 3 meses más?', endpoint: '/renew-contract' },
      'reset-password': { confirm: '¿Estás seguro de que quieres resetear la contraseña de este usuario?', endpoint: '/reset-password' },
    };

    const actionConfig = actions[action];
    if (!actionConfig) return;

    if (window.confirm(actionConfig.confirm)) {
      try {
        const response = await apiClient.post(`/admin${actionConfig.endpoint}`, { userUuid });
        alert(response.data.message || 'Acción completada con éxito');
        onUserAction(); // Refrescar la lista de usuarios
      } catch (err) {
        alert(err.response?.data?.error || `Error al ejecutar la acción.`);
      }
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Gestión de Usuarios</h2>
        <button onClick={onUserAction} className="px-3 py-1 text-sm rounded-md font-semibold bg-gray-200 text-gray-800 hover:bg-gray-300">Refrescar</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100">
            <tr>
              {['Correo', 'Nombre', 'Plan', 'Estado', 'Creado', 'Expira', 'Acciones'].map(h => <th key={h} className="p-3">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan="7" className="p-4 text-center text-gray-500">No hay usuarios en el sistema.</td></tr>
            ) : (
              users.map(user => (
                <tr key={user.usuario_uuid} className="border-b hover:bg-gray-50">
                  <td className="p-3">{user.correo}</td>
                  <td className="p-3">{user.nombre || 'N/A'}</td>
                  <td className="p-3">{user.plan || 'N/A'}</td>
                  <td className="p-3">{user.status}</td>
                  <td className="p-3">{new Date(user.creado_at).toLocaleDateString()}</td>
                  <td className="p-3">{user.fecha_expiracion ? new Date(user.fecha_expiracion).toLocaleDateString() : 'N/A'}</td>
                  <td className="p-3"><ActionButtons user={user} onAction={handleAction} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersTable;
