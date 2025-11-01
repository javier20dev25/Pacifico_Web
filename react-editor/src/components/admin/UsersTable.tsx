import apiClient from '../../api/axiosConfig';
import ActionButtons from './ActionButtons';
import { ArrowPathIcon } from '@heroicons/react/24/outline'; // Import Heroicon

import type { User } from '../../types/user';

interface UsersTableProps {
  users: User[];
  onUserAction: () => void;
}

const UsersTable: React.FC<UsersTableProps> = ({ users, onUserAction }) => {

  const handleAction = async (action: string, userUuid: string) => {
    const actions: Record<string, { confirm: string; endpoint: string }> = {
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
      } catch (err: any) {
        alert(err.response?.data?.error || `Error al ejecutar la acción.`);
      }
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-neutral-800">Gestión de Usuarios</h2>
        <button onClick={onUserAction} className="inline-flex items-center px-4 py-2 text-sm rounded-lg font-semibold bg-neutral-200 text-neutral-800 hover:bg-neutral-300 transition duration-300">
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Refrescar
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-neutral-100">
                          <tr>
                            {['Correo', 'Nombre', 'Usuario', 'Edad', 'Género', 'Plan', 'Estado', 'Creado', 'Expira', 'Acciones'].map(h => <th key={h} className="p-3 border-b border-neutral-300 text-neutral-700">{h}</th>)}
                          </tr>
                        </thead>          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan={10} className="p-4 text-center text-neutral-500">No hay usuarios en el sistema.</td></tr>
            ) : (
              users.map((user: User) => (
                <tr key={user.usuario_uuid} className="border-b border-neutral-200 hover:bg-neutral-50 transition duration-150">
                  <td className="p-3 text-neutral-800">{user.correo}</td>
                  <td className="p-3 text-neutral-700">{user.nombre || 'N/A'}</td>
                  <td className="p-3 text-neutral-700">{user.username || 'N/A'}</td>
                  <td className="p-3 text-neutral-700">{user.age || 'N/A'}</td>
                  <td className="p-3 text-neutral-700">{user.gender || 'N/A'}</td>
                  <td className="p-3 text-neutral-700">{user.plan || 'N/A'}</td>
                  <td className="p-3 text-neutral-700">{user.status}</td>
                  <td className="p-3 text-neutral-700">{new Date(user.creado_at).toLocaleDateString()}</td>
                  <td className="p-3 text-neutral-700">{user.fecha_expiracion ? new Date(user.fecha_expiracion).toLocaleDateString() : 'N/A'}</td>
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
