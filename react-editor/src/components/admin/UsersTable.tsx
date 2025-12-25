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

export type Action = 'show-credentials' | 'renew' | 'reset-password' | 'reactivate' | 'suspend' | 'revoke' | 'riel-reset-password' | 'generate-activation';

// --- MODALES ---

const CredentialsModal: React.FC<{ credentials: Credentials | null; isOpen: boolean; onClose: () => void; onCopy: () => void; }> = ({ credentials, isOpen, onClose, onCopy }) => {
  if (!isOpen || !credentials) return null;

  const handleCopy = () => {
    const message = `Hola, ¡ya hemos creado tu cuenta! Puedes entrar con estas credenciales:\n\nCorreo: ${credentials.correo}\nContraseña: ${credentials.password}\n\nInicia sesión en: ${window.location.origin}/login\n\nAl entrar por primera vez, el sistema te pedirá que actualices tu contraseña por una personal. ¡Cualquier duda, estamos para ayudarte!`;
    navigator.clipboard.writeText(message)
      .then(() => {
        alert('Mensaje para el cliente copiado al portapapeles!');
        onCopy();
      })
      .catch(err => alert('Error al copiar el mensaje: ' + err));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Credenciales Temporales</h3>
        <div className="space-y-2 mb-4">
          <p><strong>Correo:</strong> {credentials.correo}</p>
          <p><strong>Contraseña:</strong> <code className="bg-gray-100 p-1 rounded break-all">{credentials.password}</code></p>
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

const ActivationLinkModal: React.FC<{ link: string | null; isOpen: boolean; onClose: () => void; isLoading: boolean; }> = ({ link, isOpen, onClose, isLoading }) => {
  const [copyButtonText, setCopyButtonText] = useState('Copiar Enlace');

  if (!isOpen) return null;

  const handleCopyLink = () => {
    if (!link) return;
    navigator.clipboard.writeText(link)
      .then(() => {
        setCopyButtonText('¡Copiado!');
        setTimeout(() => {
          setCopyButtonText('Copiar Enlace');
          onClose();
        }, 1500);
      })
      .catch(err => alert('Error al copiar el enlace: ' + err));
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Enlace de Activación Directa</h3>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-slate-600">Generando enlace...</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-3">Envía este enlace al usuario para que pueda activar su cuenta y establecer su propia contraseña.</p>
            <input 
              type="text" 
              readOnly 
              value={link || ''}
              className="w-full p-2 border border-gray-300 rounded bg-gray-50 mb-4"
            />
            <div className="flex justify-between items-center">
              <button onClick={handleCopyLink} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 w-32" disabled={!link}>
                {copyButtonText}
              </button>
              <button onClick={onClose} className="text-gray-600 hover:text-gray-800 font-semibold">
                Cerrar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const ConfirmationModal: React.FC<{ isOpen: boolean; message: string; onConfirm: () => void; onCancel: () => void; confirmButtonText?: string; cancelButtonText?: string;}> = 
({ isOpen, message, onConfirm, onCancel, confirmButtonText = "Aceptar", cancelButtonText = "Cancelar" }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
                <p className="text-slate-700 text-center mb-6">{message}</p>
                <div className="flex justify-center gap-4">
                    <button onClick={onCancel} className="px-6 py-2 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 font-semibold">
                        {cancelButtonText}
                    </button>
                    <button onClick={onConfirm} className="px-6 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 font-semibold">
                        {confirmButtonText}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL DE LA TABLA ---

type UsersTableProps = {
  users: User[];
  onUserAction: () => void;
};

const UsersTable: React.FC<UsersTableProps> = ({ users, onUserAction }) => {
  const [isCredentialsModalOpen, setCredentialsModalOpen] = useState(false);
  const [isLinkModalOpen, setLinkModalOpen] = useState(false);
  const [currentCredentials, setCurrentCredentials] = useState<Credentials | null>(null);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(false);
  
  // Estado unificado para el modal de enlace
  const [linkModalState, setLinkModalState] = useState<{ link: string | null; isLoading: boolean }>({ link: null, isLoading: false });

  // State for confirmation modal
  const [isConfirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [confirmationState, setConfirmationState] = useState<{ action: Action; user: User; message: string; } | null>(null);


  const handleShowCredentials = async (userUuid: string) => {
    setIsLoadingCredentials(true);
    try {
      const response = await apiClient.get<Credentials>(`/admin/credentials/${userUuid}`);
      setCurrentCredentials(response.data);
      setCredentialsModalOpen(true);
    } catch (err: unknown) {
      const error = err as AxiosError<{ error: string }>;
      alert(error.response?.data?.error || 'Error al obtener las credenciales.');
    } finally {
      setIsLoadingCredentials(false);
    }
  };

  const executeConfirmedAction = async () => {
    if (!confirmationState) return;

    const { action, user } = confirmationState;
    
    const actions: Record<Action, { endpoint: string } | undefined> = {
        revoke: { endpoint: '/revoke-user' },
        suspend: { endpoint: '/suspend-user' },
        reactivate: { endpoint: '/reactivate-user' },
        renew: { endpoint: '/renew-contract' },
        'reset-password': { endpoint: '/reset-password' },
        'riel-reset-password': { endpoint: '/generate-riel-reset-link' },
        'generate-activation': { endpoint: '/generate-activation-link' },
        'show-credentials': undefined,
    };
    
    const actionConfig = actions[action];
    if (!actionConfig) return;

    setConfirmationModalOpen(false);
    setConfirmationState(null);

    if (action === 'generate-activation' || action === 'riel-reset-password') {
      setLinkModalOpen(true);
      setLinkModalState({ link: null, isLoading: true });

      try {
        const payload = { userUuid: user.usuario_uuid };
        const response = await apiClient.post<{ activationLink?: string }>('/admin' + actionConfig.endpoint, payload);

        if (response.data.activationLink) {
          const fullUrl = `${window.location.origin}${response.data.activationLink}`;
          setLinkModalState({ link: fullUrl, isLoading: false });
        } else {
          throw new Error('El servidor no devolvió un enlace de activación.');
        }
        onUserAction();
      } catch (err: unknown) {
        const error = err as AxiosError<{ error: string }>;
        alert(error.response?.data?.error || (err as Error).message || 'Error al generar el enlace.');
        setLinkModalOpen(false);
        setLinkModalState({ link: null, isLoading: false });
      }
    } else {
        // Lógica para otras acciones
        try {
            const payload = (action === 'reset-password') ? { email: user.correo } : { userUuid: user.usuario_uuid };
            const response = await apiClient.post<{ message?: string; copyPasteMessage?: string }>('/admin' + actionConfig.endpoint, payload);

            if (action === 'reset-password' && response.data.copyPasteMessage) {
                window.prompt('Copia el mensaje para tu cliente:', response.data.copyPasteMessage);
            } else {
                alert(response.data.message || 'Acción completada con éxito');
            }
            onUserAction();
        } catch (err) {
            const error = err as AxiosError<{ error: string }>;
            alert(error.response?.data?.error || 'Error al ejecutar la acción.');
        }
    }
  };


  const handleAction = (action: Action, user: User) => {
    if (action === 'show-credentials') {
      handleShowCredentials(user.usuario_uuid);
      return;
    }

    const actionPrompts: Record<Action, string | undefined> = {
      revoke: '¿Estás seguro de que quieres eliminar a este usuario de forma permanente?',
      suspend: '¿Estás seguro de que quieres suspender a este usuario?',
      reactivate: '¿Estás seguro de que quieres reactivar a este usuario?',
      renew: '¿Estás seguro de que quieres renovar el contrato de este usuario por 3 meses más?',
      'reset-password': '¿Estás seguro de que quieres resetear la contraseña de este usuario?',
      'riel-reset-password': '¿Generar un nuevo enlace de reseteo para este usuario Riel?',
      'generate-activation': '¿Generar un enlace de activación directa para este nuevo usuario?',
      'show-credentials': undefined,
    };

    const message = actionPrompts[action];
    if (message) {
        setConfirmationState({ action, user, message });
        setConfirmationModalOpen(true);
    }
  };

  return (
    <>
      <CredentialsModal 
        isOpen={isCredentialsModalOpen}
        onClose={() => setCredentialsModalOpen(false)}
        credentials={currentCredentials}
        onCopy={() => setCredentialsModalOpen(false)}
      />
      <ActivationLinkModal
        isOpen={isLinkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        link={linkModalState.link}
        isLoading={linkModalState.isLoading}
      />
      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        message={confirmationState?.message || ''}
        onConfirm={executeConfirmedAction}
        onCancel={() => setConfirmationModalOpen(false)}
        confirmButtonText={confirmationState?.action === 'generate-activation' || confirmationState?.action === 'riel-reset-password' ? 'Sí, generar' : 'Aceptar'}
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