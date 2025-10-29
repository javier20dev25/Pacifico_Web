import React from 'react';

const ActionButtons = ({ user, onAction }) => {
  const buttonStyle = "px-2 py-1 text-xs rounded-md font-semibold transition-colors";
  const baseBtn = `${buttonStyle} bg-gray-200 text-gray-800 hover:bg-gray-300`;
  const dangerBtn = `${buttonStyle} bg-red-500 text-white hover:bg-red-600`;
  const primaryBtn = `${buttonStyle} bg-blue-500 text-white hover:bg-blue-600`;

  return (
    <div className="flex flex-col sm:flex-row gap-1">
      <button 
        onClick={() => onAction('renew', user.usuario_uuid)}
        disabled={user.status !== 'active'}
        className={`${baseBtn} disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        Renovar
      </button>
      <button 
        onClick={() => onAction('reset-password', user.usuario_uuid)}
        className={baseBtn}
      >
        Resetear Pass
      </button>
      {user.status === 'suspended' ? (
        <button 
          onClick={() => onAction('reactivate', user.usuario_uuid)}
          className={`${primaryBtn}`}
        >
          Reactivar
        </button>
      ) : (
        <button 
          onClick={() => onAction('suspend', user.usuario_uuid)}
          className={`${dangerBtn}`}
        >
          Suspender
        </button>
      )}
      <button 
        onClick={() => onAction('revoke', user.usuario_uuid)}
        className={dangerBtn}
      >
        Revocar
      </button>
    </div>
  );
};

export default ActionButtons;
