import { ArrowPathIcon, KeyIcon, UserMinusIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'; // Import Heroicons

interface User {
  usuario_uuid: string;
  status: string;
}

interface ActionButtonsProps {
  user: User;
  onAction: (action: string, userId: string) => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ user, onAction }) => {
  const buttonStyle = "inline-flex items-center justify-center px-3 py-1 text-xs rounded-md font-semibold transition duration-300";
  const baseBtn = `${buttonStyle} bg-neutral-200 text-neutral-800 hover:bg-neutral-300`;
  const dangerBtn = `${buttonStyle} bg-red-600 text-white hover:bg-red-700`; // Using direct red for danger
  const primaryBtn = `${buttonStyle} bg-primary-DEFAULT text-white hover:bg-primary-dark`;
  const accentBtn = `${buttonStyle} bg-accent-DEFAULT text-neutral-800 hover:bg-accent-dark`; // For renew

  return (
    <div className="flex flex-col sm:flex-row gap-1">
      <button 
        onClick={() => onAction('renew', user.usuario_uuid)}
        disabled={user.status !== 'active'}
        className={`${accentBtn} disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <ArrowPathIcon className="h-4 w-4 mr-1" />
        Renovar
      </button>
      <button 
        onClick={() => onAction('reset-password', user.usuario_uuid)}
        className={baseBtn}
      >
        <KeyIcon className="h-4 w-4 mr-1" />
        Resetear Pass
      </button>
      {user.status === 'suspended' ? (
        <button 
          onClick={() => onAction('reactivate', user.usuario_uuid)}
          className={`${primaryBtn}`}
        >
          <CheckIcon className="h-4 w-4 mr-1" />
          Reactivar
        </button>
      ) : (
        <button 
          onClick={() => onAction('suspend', user.usuario_uuid)}
          className={`${dangerBtn}`}
        >
          <XMarkIcon className="h-4 w-4 mr-1" />
          Suspender
        </button>
      )}
      <button 
        onClick={() => onAction('revoke', user.usuario_uuid)}
        className={dangerBtn}
      >
        <UserMinusIcon className="h-4 w-4 mr-1" />
        Revocar
      </button>
    </div>
  );
};

export default ActionButtons;
