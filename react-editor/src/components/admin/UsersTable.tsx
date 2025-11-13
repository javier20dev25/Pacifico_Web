import React, { useState } from 'react';
import apiClient from '@/api/axiosConfig';
import ActionButtons from './ActionButtons';
import { AxiosError } from 'axios';

// --- TIPOS Y INTERFACES ---

export type Credentials = {
  correo: string;
  password?: string;
};

export type User = {
  usuario_uuid: string;
  correo: string;
  nombre: string | null;
  plan: string | null;
  status: 'temporary' | 'active' | 'suspended' | 'revoked';
  creado_at: string;
  fecha_expiracion: string | null;
};

export type Action = 'show-credentials' | 'renew' | 'reset-password' | 'reactivate' | 'suspend' | 'revoke';

type CredentialsModalProps = {
  credentials: Credentials | null;
  isOpen: boolean;
  onClose: () => void;
  onCopy: () => void;
};

type UsersTableProps = {
  users: User[];
  onUserAction: () => void;
};

// --- Componente Modal para Credenciales ---
const CredentialsModal: React.FC<CredentialsModalProps> = ({ credentials, isOpen, onClose, onCopy }) => {
  if (!isOpen || !credentials) return null;

  const handleCopy = () => {
    const message = `Hola, ¡ya hemos creado tu cuenta! Puedes entrar con estas credenciales:\n\nCorreo: ${credentials.correo}\nContraseña: ${credentials.password}\n\nInicia sesión en: ${window.location.origin}\n\nAl entrar por primera vez, el sistema te pedirá que actualices tu contraseña por una personal. ¡Cualquier duda, estamos para ayudarte!`;
    navigator.clipboard.writeText(message)
      .then(() => {
        alert('Mensaje para el cliente copiado al portapapeles!');
        onCopy();
      })
      .catch(err => alert('Error al copiar el mensaje: ' + err));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Credenciales Temporales</h3>
        <div className="space-y-2 mb-4">
          <p><strong>Correo:</strong> {credentials.correo}</p>
          <p><strong>Contraseña:</strong> <code className="bg-gray-100 p-1 rounded">{credentials.password}</code></p>
        </div>
        <div className="flex justify-between items-center">
          <button onClick={handleCopy} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">
            Copiar Mensaje
          </button>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800 font-semibold">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};


const UsersTable: React.FC<UsersTableProps> = ({ users, onUserAction }) => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [currentCredentials, setCurrentCredentials] = useState<Credentials | null>(null);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(false);

  const handleShowCredentials = async (userUuid: string) => {
    setIsLoadingCredentials(true);
    try {
      const response = await apiClient.get<Credentials>(`/admin/credentials/${userUuid}`);
      setCurrentCredentials(response.data);
      setModalOpen(true);
    } catch (err: unknown) {
      const error = err as AxiosError<{ error: string }>;
      alert(error.response?.data?.error || 'Error al obtener las credenciales.');
    } finally {
      setIsLoadingCredentials(false);
    }
  };

  const handleAction = async (action: Action, user: User) => {
    if (action === 'show-credentials') {
      handleShowCredentials(user.usuario_uuid);
      return;
    }

    const actions: Record<Action, { confirm: string; endpoint: string } | undefined> = {
      revoke: { confirm: '¿Estás seguro de que quieres eliminar a este usuario de forma permanente?', endpoint: '/revoke-user' },
      suspend: { confirm: '¿Estás seguro de que quieres suspender a este usuario?', endpoint: '/suspend-user' },
      reactivate: { confirm: '¿Estás seguro de que quieres reactivar a este usuario?', endpoint: '/reactivate-user' },
      renew: { confirm: '¿Estás seguro de que quieres renovar el contrato de este usuario por 3 meses más?', endpoint: '/renew-contract' },
      'reset-password': { confirm: '¿Estás seguro de que quieres resetear la contraseña de este usuario?', endpoint: '/reset-password' },
      'show-credentials': undefined,
    };

    const actionConfig = actions[action];
    if (!actionConfig) return;

    if (window.confirm(actionConfig.confirm)) {
      try {
        const payload = action === 'reset-password' 
          ? { email: user.correo } 
          : { userUuid: user.usuario_uuid };

        const response = await apiClient.post<{ message?: string; copyPasteMessage?: string }>('/admin' + actionConfig.endpoint, payload);

        if (action === 'reset-password' && response.data.copyPasteMessage) {
          window.prompt('Copia el mensaje para tu cliente:', response.data.copyPasteMessage);
        } else {
          alert(response.data.message || 'Acción completada con éxito');
        }
        
        onUserAction();
      } catch (err: unknown) {
        const error = err as AxiosError<{ error: string }>;
        alert(error.response?.data?.error || 'Error al ejecutar la acción.');
      }
    }
  };

  return (
    <>
      <CredentialsModal 
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        credentials={currentCredentials}
        onCopy={() => setModalOpen(false)}
      />
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
                <tr><td colSpan={7} className="p-4 text-center text-gray-500">No hay usuarios en el sistema.</td></tr>
              ) : (
                users.map((user: User) => (
                  <tr key={user.usuario_uuid} className="border-b hover:bg-gray-50">
                    <td className="p-3">{user.correo}</td>
                    <td className="p-3">{user.nombre || 'N/A'}</td>
                    <td className="p-3">{user.plan || 'N/A'}</td>
                    <td className="p-3">{user.status}</td>
                    <td className="p-3">{new Date(user.creado_at).toLocaleDateString()}</td>
                    <td className="p-3">{user.fecha_expiracion ? new Date(user.fecha_expiracion).toLocaleDateString() : 'N/A'}</td>
                    <td className="p-3"><ActionButtons user={user} onAction={handleAction} isLoadingCredentials={isLoadingCredentials} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default UsersTable;